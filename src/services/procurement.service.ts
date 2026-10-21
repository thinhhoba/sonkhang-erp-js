// File: src/services/procurement.service.ts
import prisma from "@/lib/prisma";

export interface CreateSupplierInput {
  code: string;
  name: string;
  taxCode: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
  creditLimit?: number;
  bankAccount?: string;
  bankName?: string;
}

export interface CreatePOItemInput {
  productId: string;
  orderedQty: number;
  unitPrice: number;
  note?: string;
}

export interface CreatePOInput {
  supplierId: string;
  expectedDeliveryDate?: Date | string;
  paymentTerms?: string;
  note?: string;
  createdById?: string;
  vatRate?: number; // % VAT (mặc định 8% hoặc 10%)
  items: CreatePOItemInput[];
}

export interface ThreeWayMatchingResult {
  poId: string;
  poCode: string;
  supplierName: string;
  supplierTaxCode: string;
  invoiceId?: string;
  invoiceNumber?: string;
  matchStatus: "PASSED" | "WARNING" | "FAILED";
  summary: {
    poOrderedQty: number;
    actualReceivedQty: number;
    invoiceBilledQty: number;
    poTotalAmount: number;
    invoiceGrandTotal: number;
    qtyDifference: number;
    amountDifference: number;
  };
  lineDetails: Array<{
    productId: string;
    productSku: string;
    productName: string;
    orderedQty: number;
    receivedQty: number;
    billedQty: number;
    poUnitPrice: number;
    invoiceUnitPrice: number;
    status: "EXACT_MATCH" | "QTY_MISMATCH" | "PRICE_VARIANCE" | "NOT_BILLED";
  }>;
  discrepancies: string[];
}

export class ProcurementService {
  // ==========================================
  // 1. QUẢN LÝ NHÀ CUNG CẤP
  // ==========================================
  static async listSuppliers() {
    return await prisma.supplier.findMany({
      include: {
        _count: {
          select: { purchaseOrders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getSupplierById(id: string) {
    return await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  }

  static async createSupplier(input: CreateSupplierInput) {
    const existing = await prisma.supplier.findFirst({
      where: {
        OR: [{ taxCode: input.taxCode }, { code: input.code }],
      },
    });

    if (existing) {
      throw new Error(`Nhà cung cấp với MST (${input.taxCode}) hoặc Mã (${input.code}) đã tồn tại`);
    }

    return await prisma.supplier.create({
      data: {
        code: input.code.toUpperCase(),
        name: input.name,
        taxCode: input.taxCode,
        contactPerson: input.contactPerson,
        phone: input.phone,
        email: input.email,
        address: input.address,
        paymentTerms: input.paymentTerms || "NET30",
        creditLimit: input.creditLimit || 0,
        bankAccount: input.bankAccount,
        bankName: input.bankName,
      },
    });
  }

  static async updateSupplier(id: string, input: Partial<CreateSupplierInput>) {
    return await prisma.supplier.update({
      where: { id },
      data: {
        name: input.name,
        contactPerson: input.contactPerson,
        phone: input.phone,
        email: input.email,
        address: input.address,
        paymentTerms: input.paymentTerms,
        creditLimit: input.creditLimit,
        bankAccount: input.bankAccount,
        bankName: input.bankName,
      },
    });
  }

  // ==========================================
  // 2. QUẢN LÝ ĐƠN ĐẶT HÀNG (PURCHASE ORDER - PO)
  // ==========================================
  static async listPurchaseOrders(status?: string) {
    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    return await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceSymbol: true,
            grandTotal: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getPurchaseOrderById(id: string) {
    return await prisma.purchaseOrder.findFirst({
      where: {
        OR: [{ id }, { poCode: id }],
      },
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
        invoices: {
          include: {
            items: {
              include: { mappedProduct: true },
            },
          },
        },
      },
    });
  }

  static async createPurchaseOrder(input: CreatePOInput) {
    if (!input.items || input.items.length === 0) {
      throw new Error("Đơn đặt hàng phải có ít nhất 1 mặt hàng");
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: input.supplierId },
    });

    if (!supplier) {
      throw new Error("Không tìm thấy Nhà cung cấp");
    }

    // Tự sinh mã PO: PO-YYYYMM-XXXX
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const countThisMonth = await prisma.purchaseOrder.count({
      where: {
        poCode: { startsWith: `PO-${yearMonth}` },
      },
    });
    const poCode = `PO-${yearMonth}-${String(countThisMonth + 1).padStart(3, "0")}`;

    // Tính toán tiền hàng
    const vatRate = input.vatRate ?? 8; // Mặc định thuế suất 8%
    let totalAmount = 0;

    const itemsData = input.items.map((it) => {
      const lineAmount = it.orderedQty * it.unitPrice;
      totalAmount += lineAmount;
      return {
        productId: it.productId,
        orderedQty: it.orderedQty,
        receivedQty: 0,
        unitPrice: it.unitPrice,
        lineAmount,
        note: it.note,
      };
    });

    const vatAmount = Math.round((totalAmount * vatRate) / 100);
    const grandTotal = totalAmount + vatAmount;

    return await prisma.purchaseOrder.create({
      data: {
        poCode,
        supplierId: input.supplierId,
        paymentTerms: input.paymentTerms || supplier.paymentTerms,
        expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : null,
        createdById: input.createdById,
        status: "DRAFT",
        totalAmount,
        vatAmount,
        grandTotal,
        note: input.note,
        items: {
          create: itemsData,
        },
      },
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
      },
    });
  }

  static async approvePurchaseOrder(poId: string, approvedById?: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });

    if (!po) throw new Error("Không tìm thấy đơn đặt hàng");
    if (po.status !== "DRAFT") {
      throw new Error(`Đơn đặt hàng đang ở trạng thái ${po.status}, không thể phê duyệt`);
    }

    return await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: "APPROVED",
        approvedById,
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });
  }

  static async cancelPurchaseOrder(poId: string, reason?: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });

    if (!po) throw new Error("Không tìm thấy đơn đặt hàng");
    if (po.status === "COMPLETED") {
      throw new Error("Không thể hủy đơn đặt hàng đã hoàn tất nhập kho");
    }

    return await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: "CANCELLED",
        note: reason ? `${po.note ? po.note + " | " : ""}Lý do hủy: ${reason}` : po.note,
      },
    });
  }

  // ==========================================
  // 3. ĐỐI CHIẾU 3 BÊN (3-WAY MATCHING)
  // [1. Đơn PO] <---> [2. Nhập kho thực tế] <---> [3. Hóa đơn meInvoice]
  // ==========================================
  static async performThreeWayMatching(poId: string, invoiceId?: string): Promise<ThreeWayMatchingResult> {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        supplier: true,
        items: { include: { product: true } },
        invoices: {
          include: {
            items: { include: { mappedProduct: true } },
          },
        },
      },
    });

    if (!po) throw new Error("Không tìm thấy đơn đặt hàng để đối chiếu");

    // Chọn hóa đơn để đối chiếu (Ưu tiên invoiceId được truyền vào hoặc hóa đơn liên kết đầu tiên)
    let invoice = invoiceId
      ? await prisma.purchaseInvoice.findUnique({
          where: { id: invoiceId },
          include: { items: { include: { mappedProduct: true } } },
        })
      : po.invoices[0];

    // Nếu PO chưa liên kết hóa đơn trực tiếp, thử tra cứu hóa đơn cùng MST nhà cung cấp gần nhất
    if (!invoice) {
      invoice = await prisma.purchaseInvoice.findFirst({
        where: {
          supplierTaxCode: po.supplier.taxCode,
          status: { in: ["PENDING_STOCK_IMPORT", "IMPORTED_STOCK"] },
        },
        include: { items: { include: { mappedProduct: true } } },
        orderBy: { invoiceDate: "desc" },
      }) as any;
    }

    const discrepancies: string[] = [];
    let matchStatus: "PASSED" | "WARNING" | "FAILED" = "PASSED";

    let poOrderedQty = 0;
    let actualReceivedQty = 0;
    let invoiceBilledQty = 0;

    const lineDetails = po.items.map((poItem) => {
      poOrderedQty += poItem.orderedQty;
      actualReceivedQty += poItem.receivedQty;

      // Tìm dòng hàng tương ứng trên hóa đơn qua mappedProductId
      const matchedInvoiceItem = invoice?.items.find(
        (invItem) => invItem.mappedProductId === poItem.productId
      );

      const billedQty = matchedInvoiceItem?.convertedQty ?? 0;
      invoiceBilledQty += billedQty;

      const invoiceUnitPrice = matchedInvoiceItem ? matchedInvoiceItem.unitPrice : 0;

      let lineStatus: "EXACT_MATCH" | "QTY_MISMATCH" | "PRICE_VARIANCE" | "NOT_BILLED" = "EXACT_MATCH";

      if (!matchedInvoiceItem) {
        lineStatus = "NOT_BILLED";
        discrepancies.push(`Mặt hàng [${poItem.product.sku}] ${poItem.product.name} chưa xuất hiện trên Hóa đơn`);
        matchStatus = "WARNING";
      } else {
        if (Math.abs(poItem.orderedQty - billedQty) > 0.01) {
          lineStatus = "QTY_MISMATCH";
          discrepancies.push(
            `Chênh lệch số lượng mặt hàng [${poItem.product.sku}]: Đặt ${poItem.orderedQty} ${poItem.product.baseUnit} nhưng Hóa đơn xuất ${billedQty} ${poItem.product.baseUnit}`
          );
          matchStatus = "WARNING";
        }
        if (Math.abs(poItem.unitPrice - invoiceUnitPrice) > 100) {
          lineStatus = "PRICE_VARIANCE";
          discrepancies.push(
            `Sai lệch đơn giá mặt hàng [${poItem.product.sku}]: PO thỏa thuận ${poItem.unitPrice.toLocaleString("vi-VN")}đ nhưng HĐ tính ${invoiceUnitPrice.toLocaleString("vi-VN")}đ`
          );
          matchStatus = "FAILED";
        }
      }

      return {
        productId: poItem.productId,
        productSku: poItem.product.sku,
        productName: poItem.product.name,
        orderedQty: poItem.orderedQty,
        receivedQty: poItem.receivedQty,
        billedQty,
        poUnitPrice: poItem.unitPrice,
        invoiceUnitPrice,
        status: lineStatus,
      };
    });

    const invoiceGrandTotal = invoice?.grandTotal ?? 0;
    const amountDifference = invoiceGrandTotal > 0 ? Math.abs(po.grandTotal - invoiceGrandTotal) : 0;

    if (invoice && amountDifference > 1000) {
      discrepancies.push(
        `Tổng giá trị hóa đơn (${invoiceGrandTotal.toLocaleString("vi-VN")}đ) lệch so với Đơn đặt hàng PO (${po.grandTotal.toLocaleString("vi-VN")}đ)`
      );
      if (matchStatus === "PASSED") matchStatus = "WARNING";
    }

    return {
      poId: po.id,
      poCode: po.poCode,
      supplierName: po.supplier.name,
      supplierTaxCode: po.supplier.taxCode,
      invoiceId: invoice?.id,
      invoiceNumber: invoice?.invoiceNumber,
      matchStatus,
      summary: {
        poOrderedQty,
        actualReceivedQty,
        invoiceBilledQty,
        poTotalAmount: po.grandTotal,
        invoiceGrandTotal,
        qtyDifference: Math.abs(poOrderedQty - invoiceBilledQty),
        amountDifference,
      },
      lineDetails,
      discrepancies,
    };
  }
}
