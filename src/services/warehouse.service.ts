// File: src/services/warehouse.service.ts
import prisma from "@/lib/prisma";
import { InventoryService } from "@/services/inventory.service";

export interface CreateStocktakeInput {
  title: string;
  conductedById?: string;
  note?: string;
  productIds?: string[]; // Nếu không truyền sẽ lấy toàn bộ sản phẩm đang có tồn
}

export interface UpdateStocktakeActualInput {
  stocktakeId: string;
  items: Array<{
    productId: string;
    actualQty: number;
    reason?: string;
  }>;
}

export interface CreateWarehouseIssueInput {
  type: "DAMAGED" | "INTERNAL_USE" | "DONATION" | "OTHER";
  source?: "WAREHOUSE" | "TRIP_RETURN";
  referenceCode?: string; // Mã chuyến xe Tera V6 nếu hàng hỏng từ xe trả về
  createdById?: string;
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
    code: string;
    name: string;
    zone: string;
    aisle?: string;
    rack?: string;
    bin?: string;
    description?: string;
  }) {
    return await prisma.warehouseLocation.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        zone: data.zone,
        aisle: data.aisle,
        rack: data.rack,
        bin: data.bin,
        description: data.description,
      },
    });
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
    // 1. Tự sinh mã kiểm kê: KK-YYYYMM-XXXX
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const countThisMonth = await prisma.inventoryStocktake.count({
      where: { stocktakeCode: { startsWith: `KK-${yearMonth}` } },
    });
    const stocktakeCode = `KK-${yearMonth}-${String(countThisMonth + 1).padStart(3, "0")}`;

    // 2. Lấy danh sách sản phẩm cần kiểm kê
    const productWhere: any = {};
    if (input.productIds && input.productIds.length > 0) {
      productWhere.id = { in: input.productIds };
    }

    const products = await prisma.product.findMany({
      where: productWhere,
      select: {
        id: true,
        currentStock: true,
        avgCostPrice: true,
      },
    });

    const itemsData = products.map((p) => ({
      productId: p.id,
      systemQty: p.currentStock,
      actualQty: p.currentStock, // Mặc định khởi tạo bằng tồn hệ thống
      differenceQty: 0,
      unitCost: p.avgCostPrice,
      differenceValue: 0,
    }));

    return await prisma.inventoryStocktake.create({
      data: {
        stocktakeCode,
        title: input.title,
        conductedById: input.conductedById,
        status: "DRAFT",
        note: input.note,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });
  }

  static async updateStocktakeActual(input: UpdateStocktakeActualInput) {
    return await prisma.$transaction(async (tx) => {
      let totalDiffQty = 0;
      let totalDiffValue = 0;

      for (const item of input.items) {
        const existingItem = await tx.stocktakeItem.findFirst({
          where: { stocktakeId: input.stocktakeId, productId: item.productId },
        });

        if (existingItem) {
          const diffQty = item.actualQty - existingItem.systemQty;
          const diffVal = diffQty * existingItem.unitCost;

          totalDiffQty += diffQty;
          totalDiffValue += diffVal;

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
      }

      return await tx.inventoryStocktake.update({
        where: { id: input.stocktakeId },
        data: {
          status: "IN_PROGRESS",
          totalDifferenceQty: totalDiffQty,
          totalDifferenceValue: totalDiffValue,
        },
        include: { items: { include: { product: true } } },
      });
    });
  }

  static async completeStocktake(stocktakeId: string) {
    return await prisma.$transaction(async (tx) => {
      const stocktake = await tx.inventoryStocktake.findUnique({
        where: { id: stocktakeId },
        include: {
          items: { include: { product: true } },
        },
      });

      if (!stocktake) throw new Error("Không tìm thấy phiếu kiểm kê");
      if (stocktake.status === "COMPLETED") {
        throw new Error("Phiếu kiểm kê này đã được khóa sổ trước đó");
      }

      // 1. Duyệt qua từng dòng có chênh lệch và sinh giao dịch Thẻ kho qua InventoryService
      for (const item of stocktake.items) {
        if (Math.abs(item.differenceQty) > 0.001) {
          await InventoryService.recordTransactionInTx(tx, {
            productId: item.productId,
            type: "ADJUSTMENT",
            referenceCode: stocktake.stocktakeCode,
            qtyChange: item.differenceQty,
            unitCostAtTime: item.unitCost,
            note: `Kiểm kê kho (${stocktake.stocktakeCode}): ${
              item.differenceQty > 0 ? "Thừa kiểm kê" : "Thiếu kiểm kê"
            }${item.reason ? ` - Lý do: ${item.reason}` : ""}`,
          });
        }
      }

      // 2. Chốt trạng thái phiếu kiểm kê
      return await tx.inventoryStocktake.update({
        where: { id: stocktakeId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
        include: {
          items: { include: { product: true } },
        },
      });
    });
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
    if (!input.items || input.items.length === 0) {
      throw new Error("Phiếu xuất hủy phải có ít nhất 1 mặt hàng");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Tự sinh mã xuất kho: XK-YYYYMM-XXXX
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const countThisMonth = await tx.warehouseIssue.count({
        where: { issueCode: { startsWith: `XK-${yearMonth}` } },
      });
      const issueCode = `XK-${yearMonth}-${String(countThisMonth + 1).padStart(3, "0")}`;

      let totalAmount = 0;
      const preparedItems = [];

      for (const it of input.items) {
        const product = await tx.product.findUnique({
          where: { id: it.productId },
        });

        if (!product) {
          throw new Error(`Không tìm thấy sản phẩm ID: ${it.productId}`);
        }

        if (product.currentStock < it.quantity) {
          throw new Error(
            `Không thể xuất hủy: Sản phẩm [${product.sku}] ${product.name} chỉ còn tồn ${product.currentStock} ${product.baseUnit}, không đủ để xuất ${it.quantity} ${product.baseUnit}`
          );
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
      return await tx.warehouseIssue.create({
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
    });
  }
}
