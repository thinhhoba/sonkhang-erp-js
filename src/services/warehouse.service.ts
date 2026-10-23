// File: src/services/warehouse.service.ts
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { InventoryDomainError, InventoryService } from "@/services/inventory.service";

export interface CreateStocktakeInput {
  title: string;
  conductedById: string;
  note?: string;
  productIds?: string[]; // Nếu không truyền sẽ lấy toàn bộ sản phẩm đang có tồn
}

export interface UpdateStocktakeActualInput {
  stocktakeId: string;
  actorId: string;
  items: Array<{
    productId: string;
    actualQty: number;
    reason?: string;
  }>;
}

export interface CreateWarehouseIssueInput {
  type: "DAMAGED" | "INTERNAL_USE" | "DONATION" | "OTHER";
  source?: "WAREHOUSE" | "TRIP_RETURN";
  /** Client generated request key, mapped to the unique issueCode for durable replay. */
  idempotencyKey?: string;
  referenceCode?: string; // Mã chuyến xe Tera V6 nếu hàng hỏng từ xe trả về
  createdById: string;
  note?: string;
  items: Array<{
    productId: string;
    quantity: number;
    reason?: string;
  }>;
}

export class WarehouseService {
  // ==========================================
  // 1. QUẢN LÝ VỊ TRÍ KHO HÀNG (BIN LOCATIONS)
  // ==========================================
  static async listLocations(zone?: string) {
    const where: any = {};
    if (zone && zone !== "ALL") where.zone = zone;

    return await prisma.warehouseLocation.findMany({
      where,
      include: {
        products: {
          select: {
            id: true,
            sku: true,
            name: true,
            baseUnit: true,
            currentStock: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });
  }

  static async createLocation(data: {
    actorId: string;
    code: string;
    name: string;
    zone: string;
    aisle?: string;
    rack?: string;
    bin?: string;
    description?: string;
  }) {
    if (!data.actorId || !data.code?.trim() || !data.name?.trim() || !data.zone?.trim()) throw new InventoryDomainError("Dữ liệu vị trí kho không hợp lệ");
    return prisma.$transaction(async (tx) => {
      const location = await tx.warehouseLocation.create({ data: { code: data.code.trim().toUpperCase(), name: data.name.trim(), zone: data.zone.trim(), aisle: data.aisle, rack: data.rack, bin: data.bin, description: data.description } });
      await tx.auditLog.create({ data: { employeeId: data.actorId, action: "CREATE_WAREHOUSE_LOCATION", targetId: location.id, newValue: JSON.stringify({ code: location.code, zone: location.zone }) } });
      return location;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  static async assignProductLocation(productId: string, locationId: string | null) {
    return await prisma.product.update({
      where: { id: productId },
      data: { locationId },
      include: { location: true },
    });
  }

  // ==========================================
  // 2. PHIẾU KIỂM KÊ KHO ĐỊNH KỲ (STOCKTAKE)
  // ==========================================
  static async listStocktakes() {
    return await prisma.inventoryStocktake.findMany({
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getStocktakeById(id: string) {
    return await prisma.inventoryStocktake.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: { location: true },
            },
          },
        },
      },
    });
  }

  static async createStocktake(input: CreateStocktakeInput) {
    if (!input.conductedById || !input.title?.trim()) {
      throw new InventoryDomainError("Thiếu người thực hiện hoặc tiêu đề phiếu kiểm kê");
    }
    const actorId = input.conductedById;
    // 1. Tự sinh mã kiểm kê: KK-YYYYMM-XXXX
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    return prisma.$transaction(async (tx) => {
      const countThisMonth = await tx.inventoryStocktake.count({ where: { stocktakeCode: { startsWith: `KK-${yearMonth}` } } });
      const stocktakeCode = `KK-${yearMonth}-${String(countThisMonth + 1).padStart(3, "0")}`;
      const productWhere: any = input.productIds?.length ? { id: { in: Array.from(new Set(input.productIds)) } } : {};
      const products = await tx.product.findMany({ where: productWhere, select: { id: true, currentStock: true, avgCostPrice: true } });
      if (!products.length) throw new InventoryDomainError("Không có sản phẩm hợp lệ để kiểm kê");
      const stocktake = await tx.inventoryStocktake.create({
        data: { stocktakeCode, title: input.title.trim(), conductedById: actorId, status: "DRAFT", note: input.note,
          items: { create: products.map((p) => ({ productId: p.id, systemQty: p.currentStock, actualQty: p.currentStock, differenceQty: 0, unitCost: p.avgCostPrice, differenceValue: 0 })) } },
        include: { items: { include: { product: true } } },
      });
      await tx.auditLog.create({ data: { employeeId: actorId, action: "CREATE_STOCKTAKE", targetId: stocktake.id, newValue: JSON.stringify({ stocktakeCode, itemCount: products.length }) } });
      return stocktake;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  static async updateStocktakeActual(input: UpdateStocktakeActualInput) {
    if (!input.actorId || !input.items?.length) throw new InventoryDomainError("Phiếu kiểm kê cần người thực hiện và ít nhất một dòng số lượng");
    if (new Set(input.items.map((item) => item.productId)).size !== input.items.length || input.items.some((item) => !item.productId || !Number.isFinite(item.actualQty) || item.actualQty < 0)) {
      throw new InventoryDomainError("Dòng kiểm kê không hợp lệ");
    }
    return await prisma.$transaction(async (tx) => {
      const stocktake = await tx.inventoryStocktake.findUnique({ where: { id: input.stocktakeId }, include: { items: true } });
      if (!stocktake) throw new InventoryDomainError("Không tìm thấy phiếu kiểm kê", 404);
      if (stocktake.status === "COMPLETED" || stocktake.status === "CANCELLED") throw new InventoryDomainError("Phiếu kiểm kê đã khóa hoặc hủy", 409);

      for (const item of input.items) {
        const existingItem = await tx.stocktakeItem.findFirst({
          where: { stocktakeId: input.stocktakeId, productId: item.productId },
        });

        if (!existingItem) throw new InventoryDomainError("Sản phẩm không thuộc phiếu kiểm kê");
        const diffQty = item.actualQty - existingItem.systemQty;
        const diffVal = diffQty * existingItem.unitCost;
          await tx.stocktakeItem.update({
            where: { id: existingItem.id },
            data: {
              actualQty: item.actualQty,
              differenceQty: diffQty,
              differenceValue: diffVal,
              reason: item.reason,
            },
          });
      }
      const recalculated = await tx.stocktakeItem.findMany({ where: { stocktakeId: input.stocktakeId } });
      const totalDiffQty = recalculated.reduce((sum, item) => sum + item.differenceQty, 0);
      const totalDiffValue = recalculated.reduce((sum, item) => sum + item.differenceValue, 0);

      const updated = await tx.inventoryStocktake.update({
        where: { id: input.stocktakeId },
        data: {
          status: "IN_PROGRESS",
          totalDifferenceQty: totalDiffQty,
          totalDifferenceValue: totalDiffValue,
        },
        include: { items: { include: { product: true } } },
      });
      await tx.auditLog.create({ data: { employeeId: input.actorId, action: "UPDATE_STOCKTAKE_COUNT", targetId: input.stocktakeId, newValue: JSON.stringify({ itemCount: input.items.length, totalDiffQty, totalDiffValue }) } });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  static async completeStocktake(stocktakeId: string, actorId: string) {
    return await prisma.$transaction(async (tx) => {
      const stocktake = await tx.inventoryStocktake.findUnique({
        where: { id: stocktakeId },
        include: {
          items: { include: { product: true } },
        },
      });

      if (!stocktake) throw new InventoryDomainError("Không tìm thấy phiếu kiểm kê", 404);
      if (stocktake.status === "COMPLETED") throw new InventoryDomainError("Phiếu kiểm kê này đã được khóa sổ trước đó", 409);
      if (stocktake.status !== "IN_PROGRESS") throw new InventoryDomainError("Phiếu kiểm kê phải được nhập số liệu trước khi chốt", 409);

      // 1. Duyệt qua từng dòng có chênh lệch và sinh giao dịch Thẻ kho qua InventoryService
      for (const item of stocktake.items) {
        if (Math.abs(item.differenceQty) > 0.001) {
          await InventoryService.recordTransactionInTx(tx, {
            productId: item.productId,
            type: "ADJUSTMENT",
            referenceCode: stocktake.stocktakeCode,
            qtyChange: item.differenceQty,
            unitCostAtTime: item.unitCost,
            actorId,
            note: `Kiểm kê kho (${stocktake.stocktakeCode}): ${
              item.differenceQty > 0 ? "Thừa kiểm kê" : "Thiếu kiểm kê"
            }${item.reason ? ` - Lý do: ${item.reason}` : ""}`,
          });
        }
      }

      // 2. Chốt trạng thái phiếu kiểm kê
      const closed = await tx.inventoryStocktake.updateMany({
        where: { id: stocktakeId, status: "IN_PROGRESS" },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
      if (closed.count !== 1) throw new InventoryDomainError("Phiếu kiểm kê đã được xử lý đồng thời", 409);
      await tx.auditLog.create({ data: { employeeId: actorId, action: "POST_STOCKTAKE", targetId: stocktakeId, oldValue: JSON.stringify({ status: "IN_PROGRESS" }), newValue: JSON.stringify({ status: "COMPLETED" }), note: stocktake.stocktakeCode } });
      return tx.inventoryStocktake.findUniqueOrThrow({ where: { id: stocktakeId }, include: { items: { include: { product: true } } } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  // ==========================================
  // 3. XUẤT HỦY HÀNG HỎNG / VỠ / QUÁ HẠN (DAMAGED GOODS)
  // ==========================================
  static async listWarehouseIssues(type?: string) {
    const where: any = {};
    if (type && type !== "ALL") where.type = type;

    return await prisma.warehouseIssue.findMany({
      where,
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createWarehouseIssue(input: CreateWarehouseIssueInput) {
    if (!input.createdById || !input.items?.length) throw new InventoryDomainError("Phiếu xuất hủy phải có người lập và ít nhất một mặt hàng");
    const actorId = input.createdById;
    if (!input.idempotencyKey || !/^[A-Za-z0-9_-]{8,64}$/.test(input.idempotencyKey)) throw new InventoryDomainError("Thiếu hoặc sai mã chống gửi lại phiếu xuất hủy");
    if (!["DAMAGED", "INTERNAL_USE", "DONATION", "OTHER"].includes(input.type) || !["WAREHOUSE", "TRIP_RETURN"].includes(input.source || "WAREHOUSE")) throw new InventoryDomainError("Loại hoặc nguồn phiếu xuất hủy không hợp lệ");
    if (new Set(input.items.map((item) => item.productId)).size !== input.items.length || input.items.some((item) => !item.productId || !Number.isFinite(item.quantity) || item.quantity <= 0)) throw new InventoryDomainError("Dòng xuất hủy không hợp lệ");

    const issueCode = `XK-REQ-${input.idempotencyKey}`;
    const isSameReplay = (existing: { type: string; source: string; referenceCode: string | null; items: Array<{ productId: string; quantity: number }> }) =>
      existing.type === input.type && existing.source === (input.source || "WAREHOUSE") &&
      existing.referenceCode === (input.referenceCode || null) && existing.items.length === input.items.length &&
      existing.items.every((item) => input.items.some((candidate) => candidate.productId === item.productId && candidate.quantity === item.quantity));
    try {
      return await prisma.$transaction(async (tx) => {
      const existing = await tx.warehouseIssue.findUnique({ where: { issueCode }, include: { items: true } });
      if (existing) {
        if (isSameReplay(existing)) return existing;
        throw new InventoryDomainError("Mã chống gửi lại đã thuộc một phiếu có dữ liệu khác", 409);
      }

      let totalAmount = 0;
      const preparedItems = [];

      for (const it of input.items) {
        const product = await tx.product.findUnique({
          where: { id: it.productId },
        });

        if (!product) {
          throw new InventoryDomainError("Không tìm thấy sản phẩm", 404);
        }

        if (product.currentStock < it.quantity) {
          throw new InventoryDomainError("Không thể xuất hủy vì số lượng tồn không đủ", 409);
        }

        const lineAmount = it.quantity * product.avgCostPrice;
        totalAmount += lineAmount;

        // Ghi nhận Thẻ kho và trừ tồn qua InventoryService (Luật Thép Số 1)
        await InventoryService.recordTransactionInTx(tx, {
          productId: product.id,
          type: "ADJUSTMENT",
          referenceCode: issueCode,
          qtyChange: -it.quantity, // Xuất kho ghi giảm tồn
            unitCostAtTime: product.avgCostPrice,
            actorId,
          note: `Xuất hủy (${input.type === "DAMAGED" ? "Hàng hỏng vỡ" : input.type}) ${
            input.source === "TRIP_RETURN" ? `từ xe về (${input.referenceCode || ""})` : "tại kho"
          }${it.reason ? ` - Lý do: ${it.reason}` : ""}`,
        });

        preparedItems.push({
          productId: product.id,
          quantity: it.quantity,
          unitCost: product.avgCostPrice,
          lineAmount,
          reason: it.reason,
        });
      }

      // Tạo phiếu xuất hủy
      const issue = await tx.warehouseIssue.create({
        data: {
          issueCode,
          type: input.type,
          source: input.source || "WAREHOUSE",
          referenceCode: input.referenceCode,
          createdById: input.createdById,
          totalAmount,
          status: "CONFIRMED",
          note: input.note,
          items: {
            create: preparedItems,
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });
      await tx.auditLog.create({ data: { employeeId: actorId, action: "POST_WAREHOUSE_ISSUE", targetId: issue.id, newValue: JSON.stringify({ issueCode, totalAmount }) } });
      return issue;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      // A concurrent first request can win the unique issueCode race. Re-read
      // the immutable issue and return it only for an identical replay.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await prisma.warehouseIssue.findUnique({ where: { issueCode }, include: { items: true } });
        if (existing && isSameReplay(existing)) return existing;
        if (existing) throw new InventoryDomainError("Mã chống gửi lại đã thuộc một phiếu có dữ liệu khác", 409);
      }
      throw error;
    }
  }
}
