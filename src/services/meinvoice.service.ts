// File: src/services/meinvoice.service.ts
import prisma from "@/lib/prisma";
import { ProcurementDomainError } from "@/lib/procurement";

// ==========================================
// CẤU TRÚC DỮ LIỆU TỪ MISA MEINVOICEBOT (INBOT)
// ==========================================
export interface MisaInbotItem {
  ItemName: string;         // Tên hàng gốc trên XML của NCC
  UnitName: string;         // Đơn vị tính trên hóa đơn NCC (Thùng, Bao, Gói...)
  Quantity: number;         // Số lượng
  UnitPrice: number;        // Đơn giá trước thuế
  Amount: number;           // Thành tiền trước thuế
  DiscountAmount?: number;  // Chiết khấu (nếu có)
  VATRate?: number;         // Thuế suất (%)
  VATAmount?: number;       // Tiền thuế
}

export interface MisaInbotInvoicePayload {
  InvoiceId: string;        // ID định danh duy nhất của hóa đơn trên MISA Inbot
  InvoiceNumber: string;    // Số hóa đơn (VD: 0001234)
  InvoiceSymbol: string;    // Ký hiệu (VD: 1C26TBB)
  InvoiceDate: string;      // Ngày hóa đơn (ISO string)
  SellerTaxCode: string;    // MST Nhà cung cấp
  SellerName: string;       // Tên Nhà cung cấp
  TotalSaleAmount: number;  // Tổng tiền hàng trước thuế
  TotalDiscountAmount?: number; // Tổng chiết khấu thương mại
  TotalVATAmount: number;   // Tổng tiền thuế GTGT
  TotalAmount: number;      // Tổng thanh toán
  XmlUrl?: string;          // Link tải file XML gốc
  Items: MisaInbotItem[];   // Danh sách chi tiết hàng hóa
}

export class MeInvoiceService {
  private static readonly MISA_AUTH_URL = "https://id.misa.vn/api/oauth/v2/token";
  private static readonly MISA_INBOT_API = "https://inbotapi.misa.vn/api/v1/invoices";

  /**
   * 1. Lấy Bearer Token từ MISA ID
   */
  static async getAccessToken(): Promise<string> {
    const appId = process.env.MEINVOICE_APP_ID;
    const taxCode = process.env.MEINVOICE_TAX_CODE;
    const username = process.env.MEINVOICE_USERNAME;
    const password = process.env.MEINVOICE_PASSWORD;

    if (!appId || !username || !password) {
      throw new Error("Thiếu cấu hình biến môi trường MEINVOICE_* trong .env");
    }

    const response = await fetch(this.MISA_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: appId,
        tax_code: taxCode,
        username,
        password,
        grant_type: "password",
      }),
    });

    if (!response.ok) {
      throw new Error(`Đăng nhập MISA Inbot thất bại: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * 2. Kéo danh sách hóa đơn đầu vào mới từ MISA meInvoiceBot
   */
  static async fetchInvoicesFromMisa(fromDate: string, toDate: string): Promise<MisaInbotInvoicePayload[]> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.MISA_INBOT_API}/search?fromDate=${fromDate}&toDate=${toDate}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Không thể lấy danh sách hóa đơn từ MISA Inbot: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * 3. Đồng bộ hóa đơn vào Database & Tự động gán mã hàng (Auto-mapping)
   */
  static async syncPurchaseInvoice(payload: MisaInbotInvoicePayload) {
    return await prisma.$transaction(async (tx) => {
      // Kiểm tra hóa đơn đã tồn tại trong DB chưa
      const existing = await tx.purchaseInvoice.findUnique({
        where: { meInvoiceId: payload.InvoiceId },
      });

      if (existing) {
        return existing; // Đã lưu trước đó, không ghi đè
      }

      let allItemsMapped = true;
      const preparedItems = [];

      for (const item of payload.Items) {
        const rawName = item.ItemName.trim();
        const rawUnit = item.UnitName ? item.UnitName.trim() : "Đơn vị";

        // Tra cứu trong bảng SupplierProductMapping xem đã từng gán mã chưa
        const mapping = await tx.supplierProductMapping.findUnique({
          where: {
            supplierTaxCode_invoiceProductName_invoiceUnit: {
              supplierTaxCode: payload.SellerTaxCode,
              invoiceProductName: rawName,
              invoiceUnit: rawUnit,
            },
          },
        });

        if (mapping) {
          // Đã có quy tắc: Tự động quy đổi số lượng
          const convertedQty = item.Quantity * mapping.conversionRate;
          preparedItems.push({
            rawProductName: rawName,
            rawUnit: rawUnit,
            quantity: item.Quantity,
            unitPrice: item.UnitPrice,
            amount: item.Amount,
            mappedProductId: mapping.productId,
            convertedQty: convertedQty,
          });
        } else {
          // Chưa từng gán mã: Đánh dấu cần Kế toán duyệt tay
          allItemsMapped = false;
          preparedItems.push({
            rawProductName: rawName,
            rawUnit: rawUnit,
            quantity: item.Quantity,
            unitPrice: item.UnitPrice,
            amount: item.Amount,
            mappedProductId: null,
            convertedQty: null,
          });
        }
      }

      // Tạo bản ghi Hóa đơn mua hàng
      return await tx.purchaseInvoice.create({
        data: {
          meInvoiceId: payload.InvoiceId,
          invoiceNumber: payload.InvoiceNumber,
          invoiceSymbol: payload.InvoiceSymbol,
          invoiceDate: new Date(payload.InvoiceDate),
          supplierTaxCode: payload.SellerTaxCode,
          supplierName: payload.SellerName,
          subTotalAmount: payload.TotalSaleAmount,
          discountAmount: payload.TotalDiscountAmount || 0,
          extraFeeAmount: 0,
          vatAmount: payload.TotalVATAmount,
          grandTotal: payload.TotalAmount,
          xmlRawContent: payload.XmlUrl || null,
          // Nếu tất cả mặt hàng đã có quy tắc ánh xạ -> Sẵn sàng nhập kho, ngược lại chờ gán mã
          status: allItemsMapped ? "PENDING_STOCK_IMPORT" : "PENDING_MAP",
          items: {
            create: preparedItems,
          },
        },
        include: { items: true },
      });
    });
  }

  /**
   * 4. Gán mã nội bộ thủ công (Kế toán thao tác trên giao diện lần đầu)
   * Hệ thống sẽ tự động lưu vào SupplierProductMapping để từ lần sau chạy 100% tự động
   */
  static async mapItemProduct(
    invoiceItemId: string,
    productId: string,
    conversionRate: number = 1
  ) {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.purchaseInvoiceItem.findUnique({
        where: { id: invoiceItemId },
        include: { purchaseInvoice: true },
      });

      if (!item) throw new ProcurementDomainError("Không tìm thấy dòng hàng hóa đơn", 404);

      // 1. Lưu ghi nhớ vào bảng Ánh xạ để tự động học cho các hóa đơn sau
      await tx.supplierProductMapping.upsert({
        where: {
          supplierTaxCode_invoiceProductName_invoiceUnit: {
            supplierTaxCode: item.purchaseInvoice.supplierTaxCode,
            invoiceProductName: item.rawProductName,
            invoiceUnit: item.rawUnit,
          },
        },
        create: {
          supplierTaxCode: item.purchaseInvoice.supplierTaxCode,
          invoiceProductName: item.rawProductName,
          invoiceUnit: item.rawUnit,
          conversionRate,
          productId,
        },
        update: {
          conversionRate,
          productId,
        },
      });

      // 2. Cập nhật trực tiếp vào dòng hàng hiện tại
      const updatedItem = await tx.purchaseInvoiceItem.update({
        where: { id: invoiceItemId },
        data: {
          mappedProductId: productId,
          convertedQty: item.quantity * conversionRate,
        },
      });

      // 3. Kiểm tra xem toàn bộ các dòng hàng trong hóa đơn đã được gán mã xong chưa
      const unmappedItemsCount = await tx.purchaseInvoiceItem.count({
        where: {
          purchaseInvoiceId: item.purchaseInvoiceId,
          mappedProductId: null,
        },
      });

      if (unmappedItemsCount === 0) {
        await tx.purchaseInvoice.update({
          where: { id: item.purchaseInvoiceId },
          data: { status: "PENDING_STOCK_IMPORT" },
        });
      }

      return updatedItem;
    });
  }
}
