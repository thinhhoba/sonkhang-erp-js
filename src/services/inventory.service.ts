// File: src/services/inventory.service.ts
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ProcurementDomainError } from "@/lib/procurement";

export class InventoryDomainError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "InventoryDomainError";
  }
}

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
  /** Actor is required by warehouse write flows so the immutable movement is auditable. */
  actorId?: string;
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
    const { productId, type, referenceCode, qtyChange, unitCostAtTime, note, actorId } = input;
    const inTransitChange = input.inTransitChange ?? 0;

    if (!productId || !referenceCode || !Number.isFinite(qtyChange) || !Number.isFinite(inTransitChange)) {
      throw new InventoryDomainError("Dữ liệu biến động kho không hợp lệ");
    }
    if (unitCostAtTime !== undefined && (!Number.isFinite(unitCostAtTime) || unitCostAtTime < 0)) {
      throw new InventoryDomainError("Giá vốn tại thời điểm biến động không hợp lệ");
    }
    if (inTransitChange !== 0 && !actorId) {
      throw new InventoryDomainError("Biến động tồn trên xe phải có tác nhân đối soát", 400);
    }

    const product = await tx.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new InventoryDomainError("Không tìm thấy sản phẩm", 404);
    }

    const newStock = product.currentStock + qtyChange;
    const newInTransitStock = product.inTransitStock + inTransitChange;
    const effectiveUnitCost = unitCostAtTime ?? product.avgCostPrice;

    // Cached balances are never allowed to go below zero. PostgreSQL serializable
    // transactions at mutation entry points make this read/compute/write atomic.
    if (newStock < 0 || newInTransitStock < 0) {
      throw new InventoryDomainError("Không thể ghi nhận biến động làm âm tồn kho hoặc tồn trên xe", 409);
    }

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
        // InventoryLedger cannot model in-transit balance without a location
        // dimension. The explicit note and AuditLog keep this limitation visible
        // to reconciliation instead of pretending qtyChange is truck stock.
        note: inTransitChange === 0 ? note : `${note || "Biến động tồn trên xe"} [Tồn trên xe: ${product.inTransitStock} → ${newInTransitStock}]`,
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

    if (actorId) {
      await tx.auditLog.create({
        data: {
          employeeId: actorId,
          action: "INVENTORY_LEDGER_POSTED",
          targetId: ledgerEntry.id,
          oldValue: JSON.stringify({ currentStock: product.currentStock, inTransitStock: product.inTransitStock }),
          newValue: JSON.stringify({ currentStock: newStock, inTransitStock: newInTransitStock }),
          note: `${type} ${referenceCode}${inTransitChange === 0 ? "" : " — cần đối chiếu tồn trên xe với chuyến giao"}`,
        },
      });
    }

    return ledgerEntry;
  }

  /**
   * Ghi nhận biến động thẻ kho an toàn qua Database Transaction
   * CẤM update trực tiếp currentStock bên ngoài hàm này
   */
  static async recordTransaction(input: RecordStockTransactionInput) {
    return await prisma.$transaction(async (tx) => {
      return await InventoryService.recordTransactionInTx(tx, input);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Nhập kho từ Hóa đơn mua vào (meInvoiceBot) & Tính Giá vốn bình quân gia quyền
   * Công thức:
   * Giá vốn mới = ((Tồn hiện tại * Giá vốn cũ) + Giá trị nhập thực tế) / (Tồn hiện tại + Số lượng nhập)
   */
  static async importPurchaseInvoiceToStock(purchaseInvoiceId: string, actorId?: string) {
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.purchaseInvoice.findUnique({
        where: { id: purchaseInvoiceId },
        include: { items: true },
      });

      if (!invoice) {
        throw new ProcurementDomainError(`Không tìm thấy hóa đơn mua hàng ID: ${purchaseInvoiceId}`, 404);
      }

      if (invoice.status === "IMPORTED_STOCK") {
        throw new ProcurementDomainError("Hóa đơn này đã được nhập kho trước đó!", 409);
      }

      // Hệ số phân bổ Chiết khấu và Chi phí thêm trên từng dòng hàng
      const totalInvoiceAmount = invoice.subTotalAmount;
      const discountRatio = totalInvoiceAmount > 0 ? invoice.discountAmount / totalInvoiceAmount : 0;
      const extraFeeRatio = totalInvoiceAmount > 0 ? invoice.extraFeeAmount / totalInvoiceAmount : 0;

      for (const item of invoice.items) {
        if (!item.mappedProductId || !item.convertedQty || item.convertedQty <= 0) {
          throw new ProcurementDomainError(
            `Dòng hàng "${item.rawProductName}" chưa được gán mã nội bộ hoặc số lượng quy đổi không hợp lệ.`
          );
        }

        const product = await tx.product.findUnique({
          where: { id: item.mappedProductId },
        });

        if (!product) {
          throw new ProcurementDomainError(`Sản phẩm nội bộ ID ${item.mappedProductId} không tồn tại.`, 404);
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
      const updatedInvoice = await tx.purchaseInvoice.update({
        where: { id: invoice.id },
        data: { status: "IMPORTED_STOCK" },
      });
      if (actorId) {
        await tx.auditLog.create({
          data: {
            employeeId: actorId,
            action: "IMPORT_PURCHASE_INVOICE_TO_STOCK",
            targetId: invoice.id,
            newValue: JSON.stringify({ invoiceNumber: invoice.invoiceNumber, itemCount: invoice.items.length }),
          },
        });
      }
      return updatedInvoice;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

}
