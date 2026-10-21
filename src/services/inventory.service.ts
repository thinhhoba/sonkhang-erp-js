// File: src/services/inventory.service.ts
import prisma from "@/lib/prisma";

export interface RecordStockTransactionInput {
  productId: string;
  type: "IN_PURCHASE" | "OUT_DISPATCH" | "IN_RETURN_TRIP" | "ADJUSTMENT";
  referenceCode: string;
  qtyChange: number; // Dương (+) khi nhập/hoàn hàng, Âm (-) khi xuất kho
  unitCostAtTime?: number;
  note?: string;
  // Biến động hàng đang đi đường (dùng khi xuất kho lên xe / nhận hàng hoàn).
  // Mặc định 0 = không đụng tới inTransitStock.
  inTransitChange?: number;
}

// Kiểu client transaction tối thiểu mà recordTransaction cần dùng,
// cho phép gọi lồng bên trong một prisma.$transaction có sẵn.
type TxClient = any;

export class InventoryService {
  /**
   * Ghi nhận biến động thẻ kho — phiên bản dùng chung transaction có sẵn.
   * Mọi biến động currentStock / inTransitStock BẮT BUỘC đi qua hàm này.
   * Không thay đổi avgCostPrice (trừ luồng IN_PURCHASE riêng bên dưới).
   */
  static async recordTransactionInTx(tx: TxClient, input: RecordStockTransactionInput) {
    const { productId, type, referenceCode, qtyChange, unitCostAtTime, note } = input;
    const inTransitChange = input.inTransitChange ?? 0;

    const product = await tx.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm có ID: ${productId}`);
    }

    const newStock = product.currentStock + qtyChange;
    const newInTransitStock = product.inTransitStock + inTransitChange;
    const effectiveUnitCost = unitCostAtTime ?? product.avgCostPrice;

    // 1. Tạo bản ghi Thẻ kho (Ledger) với snapshot số dư THỰC TẾ
    const ledgerEntry = await tx.inventoryLedger.create({
      data: {
        productId,
        type,
        referenceCode,
        qtyChange,
        unitCostAtTime: effectiveUnitCost,
        stockAfter: newStock,
        avgCostAfter: product.avgCostPrice, // Xuất/hoàn kho không đổi giá vốn bình quân
        note,
      },
    });

    // 2. Cập nhật tồn kho sản phẩm
    await tx.product.update({
      where: { id: productId },
      data: {
        currentStock: newStock,
        inTransitStock: newInTransitStock,
      },
    });

    return ledgerEntry;
  }

  /**
   * Ghi nhận biến động thẻ kho an toàn qua Database Transaction
   * CẤM update trực tiếp currentStock bên ngoài hàm này
   */
  static async recordTransaction(input: RecordStockTransactionInput) {
    return await prisma.$transaction(async (tx) => {
      return await InventoryService.recordTransactionInTx(tx, input);
    });
  }

  /**
   * Nhập kho từ Hóa đơn mua vào (meInvoiceBot) & Tính Giá vốn bình quân gia quyền
   * Công thức:
   * Giá vốn mới = ((Tồn hiện tại * Giá vốn cũ) + Giá trị nhập thực tế) / (Tồn hiện tại + Số lượng nhập)
   */
  static async importPurchaseInvoiceToStock(purchaseInvoiceId: string) {
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.purchaseInvoice.findUnique({
        where: { id: purchaseInvoiceId },
        include: { items: true },
      });

      if (!invoice) {
        throw new Error(`Không tìm thấy hóa đơn mua hàng ID: ${purchaseInvoiceId}`);
      }

      if (invoice.status === "IMPORTED_STOCK") {
        throw new Error("Hóa đơn này đã được nhập kho trước đó!");
      }

      // Hệ số phân bổ Chiết khấu và Chi phí thêm trên từng dòng hàng
      const totalInvoiceAmount = invoice.subTotalAmount;
      const discountRatio = totalInvoiceAmount > 0 ? invoice.discountAmount / totalInvoiceAmount : 0;
      const extraFeeRatio = totalInvoiceAmount > 0 ? invoice.extraFeeAmount / totalInvoiceAmount : 0;

      for (const item of invoice.items) {
        if (!item.mappedProductId || !item.convertedQty || item.convertedQty <= 0) {
          throw new Error(
            `Dòng hàng "${item.rawProductName}" chưa được gán mã nội bộ hoặc số lượng quy đổi không hợp lệ.`
          );
        }

        const product = await tx.product.findUnique({
          where: { id: item.mappedProductId },
        });

        if (!product) {
          throw new Error(`Sản phẩm nội bộ ID ${item.mappedProductId} không tồn tại.`);
        }

        // Tính giá trị nhập thực tế của dòng sau khi trừ chiết khấu và cộng phí mua hàng
        const lineNetDiscount = item.amount * discountRatio;
        const lineNetExtraFee = item.amount * extraFeeRatio;
        const actualLineCost = item.amount - lineNetDiscount + lineNetExtraFee;
        const effectiveUnitCost = actualLineCost / item.convertedQty;

        // Tính Giá vốn bình quân mới
        const currentStockVal = Math.max(0, product.currentStock) * product.avgCostPrice;
        const totalStockAfter = Math.max(0, product.currentStock) + item.convertedQty;
        const newAvgCost = (currentStockVal + actualLineCost) / totalStockAfter;

        const newStock = product.currentStock + item.convertedQty;

        // Cập nhật giá nhập hiệu dụng vào Item hóa đơn
        await tx.purchaseInvoiceItem.update({
          where: { id: item.id },
          data: { effectiveUnitCost },
        });

        // Ghi sổ thẻ kho
        await tx.inventoryLedger.create({
          data: {
            productId: product.id,
            type: "IN_PURCHASE",
            referenceCode: `HD-${invoice.invoiceNumber}`,
            qtyChange: item.convertedQty,
            unitCostAtTime: effectiveUnitCost,
            stockAfter: newStock,
            avgCostAfter: newAvgCost,
            note: `Nhập kho HĐ ${invoice.invoiceSymbol}-${invoice.invoiceNumber} từ NCC ${invoice.supplierName}`,
          },
        });

        // Cập nhật tồn và giá vốn mới vào Product
        await tx.product.update({
          where: { id: product.id },
          data: {
            currentStock: newStock,
            avgCostPrice: Math.round(newAvgCost * 100) / 100, // Làm tròn 2 số thập phân
          },
        });
      }

      // Đánh dấu hóa đơn đã nhập kho thành công
      return await tx.purchaseInvoice.update({
        where: { id: invoice.id },
        data: { status: "IMPORTED_STOCK" },
      });
    });
  }

}