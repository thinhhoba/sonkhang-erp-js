// File: src/services/sales-ar.service.ts
import prisma from "@/lib/prisma";
import { InventoryService } from "./inventory.service";

export interface CreateCustomerInput {
  customerCode?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  ward?: string;
  city?: string;
  creditLimit?: number;
  paymentTerms?: string;
  maxOverdueDays?: number;
}

export interface ReturnItemInput {
  salesOrderItemId?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  condition: "GOOD" | "DAMAGED"; // GOOD: nhập lại kho bán | DAMAGED: xuất hủy tổn thất
  reason?: string;
}

export interface CreateSalesReturnInput {
  salesOrderId?: string;
  customerId?: string;
  tripCode?: string;
  reason: string;
  receivedById?: string;
  note?: string;
  items: ReturnItemInput[];
}

export interface GroupedTripSuggestion {
  district: string;
  orderCount: number;
  totalWeightKg: number;
  totalCodAmount: number;
  vehicleCapacityKg: number;
  utilizationRate: number; // Tỷ lệ % tải trọng Tera V6 (945 Kg)
  status: "OPTIMAL" | "UNDERLOADED" | "OVERLOADED";
  recommendation: string;
  orders: Array<{
    id: string;
    orderCode: string;
    customerName: string;
    customerPhone: string | null;
    shippingAddress: string;
    district: string | null;
    totalWeightKg: number;
    codAmountRequired: number;
    requiresCreditApproval: boolean;
    creditApprovalStatus: string;
    orderDate: Date;
  }>;
}

export class SalesARService {
  /**
   * 1. Chuẩn hóa & bóc tách Quận/Huyện từ chuỗi địa chỉ giao hàng
   */
  static extractDistrict(address: string): string {
    if (!address) return "Chưa xác định";

    const normalized = address.toLowerCase();

    // Danh sách các quận/huyện phổ biến tại TP.HCM & Hà Nội
    const districtPatterns: Array<{ name: string; regex: RegExp }> = [
      // TP.HCM
      { name: "Quận Tân Bình", regex: /(quận|q\.)?\s*tân bình/i },
      { name: "Quận Bình Tân", regex: /(quận|q\.)?\s*bình tân/i },
      { name: "Quận Tân Phú", regex: /(quận|q\.)?\s*tân phú/i },
      { name: "Quận 12", regex: /(quận|q\.)?\s*12/i },
      { name: "Quận Gò Vấp", regex: /(quận|q\.)?\s*gò vấp/i },
      { name: "Quận Phú Nhuận", regex: /(quận|q\.)?\s*phú nhuận/i },
      { name: "Quận Bình Thạnh", regex: /(quận|q\.)?\s*bình thạnh/i },
      { name: "TP. Thủ Đức", regex: /(thủ đức|quận 2|quận 9)/i },
      { name: "Quận 1", regex: /(quận|q\.)?\s*1\b/i },
      { name: "Quận 3", regex: /(quận|q\.)?\s*3\b/i },
      { name: "Quận 5", regex: /(quận|q\.)?\s*5\b/i },
      { name: "Quận 6", regex: /(quận|q\.)?\s*6\b/i },
      { name: "Quận 7", regex: /(quận|q\.)?\s*7\b/i },
      { name: "Quận 8", regex: /(quận|q\.)?\s*8\b/i },
      { name: "Quận 10", regex: /(quận|q\.)?\s*10\b/i },
      { name: "Quận 11", regex: /(quận|q\.)?\s*11\b/i },
      { name: "Huyện Hóc Môn", regex: /hóc môn/i },
      { name: "Huyện Củ Chi", regex: /củ chi/i },
      { name: "Huyện Bình Chánh", regex: /bình chánh/i },
      { name: "Huyện Nhà Bè", regex: /nhà bè/i },

      // Hà Nội
      { name: "Quận Cầu Giấy", regex: /cầu giấy/i },
      { name: "Quận Đống Đa", regex: /đống đa/i },
      { name: "Quận Ba Đình", regex: /ba đình/i },
      { name: "Quận Thanh Xuân", regex: /thanh xuân/i },
      { name: "Quận Nam Từ Liêm", regex: /nam từ liêm/i },
      { name: "Quận Bắc Từ Liêm", regex: /bắc từ liêm/i },
      { name: "Quận Hà Đông", regex: /hà đông/i },
      { name: "Quận Hoàng Mai", regex: /hoàng mai/i },
      { name: "Quận Hai Bà Trưng", regex: /hai bà trưng/i },
      { name: "Quận Hoàn Kiếm", regex: /hoàn kiếm/i },
      { name: "Quận Long Biên", regex: /long biên/i },
      { name: "Quận Tây Hồ", regex: /tây hồ/i },
    ];

    for (const p of districtPatterns) {
      if (p.regex.test(normalized)) {
        return p.name;
      }
    }

    // Nếu không khớp từ khóa đặc biệt, cố gắng lấy phần tử áp chót nếu phân cách bằng dấu phẩy
    const parts = address.split(",").map((s) => s.trim());
    if (parts.length >= 3) {
      return parts[parts.length - 2];
    }

    return "Khác";
  }

  /**
   * 2. Quản lý danh mục Khách hàng & Công nợ (Sales AR)
   */
  static async getCustomers(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { customerCode: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    return await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { salesOrders: true, salesReturns: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  static async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        salesOrders: {
          orderBy: { orderDate: "desc" },
          take: 10,
        },
        salesReturns: {
          orderBy: { returnDate: "desc" },
          take: 10,
        },
      },
    });
    if (!customer) throw new Error("Không tìm thấy khách hàng!");
    return customer;
  }

  static async upsertCustomer(input: CreateCustomerInput, id?: string) {
    if (id) {
      return await prisma.customer.update({
        where: { id },
        data: {
          name: input.name,
          phone: input.phone,
          email: input.email,
          address: input.address,
          district: input.district,
          ward: input.ward,
          city: input.city || "TP. Hồ Chí Minh",
          creditLimit: input.creditLimit !== undefined ? input.creditLimit : undefined,
          paymentTerms: input.paymentTerms || "NET30",
          maxOverdueDays: input.maxOverdueDays || 30,
        },
      });
    }

    // Tạo mã khách hàng nếu chưa có
    let code = input.customerCode;
    if (!code) {
      const count = await prisma.customer.count();
      code = `KH-${String(count + 1).padStart(4, "0")}`;
    }

    return await prisma.customer.create({
      data: {
        customerCode: code,
        name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address,
        district: input.district || (input.address ? this.extractDistrict(input.address) : null),
        ward: input.ward,
        city: input.city || "TP. Hồ Chí Minh",
        creditLimit: input.creditLimit || 20000000,
        paymentTerms: input.paymentTerms || "NET30",
        maxOverdueDays: input.maxOverdueDays || 30,
      },
    });
  }

  /**
   * 3. Kiểm tra Hạn mức Công nợ (Credit Limit Validation)
   * Kiểm tra nợ hiện tại + đơn hàng mới có vượt hạn mức, hoặc có nợ xấu quá hạn
   */
  static async checkCustomerCredit(customerId: string, newOrderAmount: number = 0) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return {
        isAllowed: true,
        currentDebt: 0,
        creditLimit: 0,
        remainingCredit: 0,
        isOverdue: false,
        warningMessage: undefined,
      };
    }

    if (customer.isBlocked) {
      return {
        isAllowed: false,
        currentDebt: customer.currentDebt,
        creditLimit: customer.creditLimit,
        remainingCredit: customer.creditLimit - customer.currentDebt,
        isOverdue: true,
        warningMessage: `Khách hàng ${customer.name} (${customer.customerCode}) đang bị KHÓA CÔNG NỢ do nợ xấu! Cần Giám đốc phê duyệt đặc biệt.`,
      };
    }

    const projectedDebt = customer.currentDebt + newOrderAmount;
    const isExceeded = customer.creditLimit > 0 && projectedDebt > customer.creditLimit;
    const remainingCredit = customer.creditLimit - customer.currentDebt;

    if (isExceeded) {
      return {
        isAllowed: false,
        currentDebt: customer.currentDebt,
        creditLimit: customer.creditLimit,
        remainingCredit,
        isOverdue: false,
        warningMessage: `Đơn hàng ${newOrderAmount.toLocaleString("vi-VN")}đ khiến công nợ dự kiến (${projectedDebt.toLocaleString("vi-VN")}đ) vượt hạn mức cho phép (${customer.creditLimit.toLocaleString("vi-VN")}đ)! Cần Giám đốc phê duyệt ngoại lệ.`,
      };
    }

    return {
      isAllowed: true,
      currentDebt: customer.currentDebt,
      creditLimit: customer.creditLimit,
      remainingCredit,
      isOverdue: false,
      warningMessage: undefined,
    };
  }

  /**
   * 4. Phê duyệt hoặc từ chối ngoại lệ công nợ cho Đơn hàng
   */
  static async approveCreditException(
    orderId: string,
    approvedById: string,
    note: string = "Giám đốc phê duyệt cho phép xuất hàng dù vượt hạn mức công nợ"
  ) {
    return await prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        requiresCreditApproval: false,
        creditApprovalStatus: "APPROVED",
        creditApprovalNote: note,
        creditApprovedById: approvedById,
      },
    });
  }

  static async rejectCreditException(orderId: string, rejectedById: string, note: string) {
    return await prisma.salesOrder.update({
      where: { id: orderId },
      data: {
        requiresCreditApproval: true,
        creditApprovalStatus: "REJECTED",
        creditApprovalNote: note,
        creditApprovedById: rejectedById,
      },
    });
  }

  /**
   * 5. Xử lý Quy trình Nhận Hàng Trả Lại từ Chuyến Xe Tera V6 / Khách hàng (Sales Return)
   * Tự động hoàn kho hàng tốt, xuất hủy hàng hỏng và giảm trừ công nợ khách hàng
   */
  static async processSalesReturn(input: CreateSalesReturnInput) {
    const { salesOrderId, customerId, tripCode, reason, receivedById, note, items } = input;

    if (!items || items.length === 0) {
      throw new Error("Phiếu trả hàng cần có ít nhất 1 mặt hàng!");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Sinh mã phiếu trả hàng TH-YYYYMMDD-XXX
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const countToday = await tx.salesReturn.count({
        where: {
          returnCode: { startsWith: `TH-${todayStr}` },
        },
      });
      const seq = String(countToday + 1).padStart(3, "0");
      const returnCode = `TH-${todayStr}-${seq}`;

      let totalReturnAmount = 0;

      // 2. Kiểm tra đơn hàng liên quan nếu có
      let order = null;
      let effectiveCustomerId = customerId;
      if (salesOrderId) {
        order = await tx.salesOrder.findUnique({
          where: { id: salesOrderId },
          include: { customer: true },
        });
        if (order && !effectiveCustomerId && order.customerId) {
          effectiveCustomerId = order.customerId;
        }
      }

      // 3. Xử lý từng sản phẩm trả về
      const preparedItems = [];
      const damagedItemsToScrap: Array<{ productId: string; quantity: number; unitCost: number; reason: string }> = [];

      for (const it of items) {
        const lineAmount = it.quantity * it.unitPrice;
        totalReturnAmount += lineAmount;

        const product = await tx.product.findUnique({
          where: { id: it.productId },
        });
        if (!product) throw new Error(`Sản phẩm với ID ${it.productId} không tồn tại!`);

        // Xử lý kho — BẮT BUỘC qua Single Source of Truth (Luật Thép Số 1).
        // Hàng GOOD: nhập lại kho bán tiếp (IN_RETURN_TRIP, tồn tổng không đổi).
        // Hàng DAMAGED: hàng hư trên xe, tiêu hủy (ADJUSTMENT chỉ giảm inTransit).
        const truckQty = Math.min(product.inTransitStock, it.quantity);
        if (it.condition === "GOOD") {
          await InventoryService.recordTransactionInTx(tx, {
            productId: it.productId,
            type: "IN_RETURN_TRIP",
            referenceCode: returnCode,
            qtyChange: it.quantity,
            inTransitChange: -truckQty,
            note: `Nhập lại kho hàng hoàn tốt từ phiếu ${returnCode} ${tripCode ? `(Chuyến ${tripCode})` : ""}`,
          });
        } else {
          await InventoryService.recordTransactionInTx(tx, {
            productId: it.productId,
            type: "ADJUSTMENT",
            referenceCode: returnCode,
            qtyChange: 0,
            inTransitChange: -truckQty,
            note: `Xuất hủy hỏng vỡ từ phiếu ${returnCode}: ${it.reason || "Hàng vỡ/hỏng khi giao vận"}`,
          });

          damagedItemsToScrap.push({
            productId: it.productId,
            quantity: it.quantity,
            unitCost: product.avgCostPrice,
            reason: it.reason || "Hàng vỡ/hỏng khi giao vận",
          });
        }

        // Cập nhật returnedQty trên SalesOrderItem nếu có liên kết
        if (it.salesOrderItemId) {
          await tx.salesOrderItem.update({
            where: { id: it.salesOrderItemId },
            data: {
              returnedQty: { increment: it.quantity },
              deliveredQty: { decrement: it.quantity },
            },
          });
        }

        preparedItems.push({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          lineAmount,
          condition: it.condition,
          actionTaken: it.condition === "GOOD" ? "RESTOCKED" : "SCRAPPED",
          reason: it.reason || null,
        });
      }

      // 4. Nếu có hàng hỏng vỡ -> Tự động sinh phiếu xuất hủy kho WarehouseIssue
      if (damagedItemsToScrap.length > 0) {
        const issueCode = `XH-${returnCode}`;
        const totalDamageCost = damagedItemsToScrap.reduce((sum, d) => sum + d.quantity * d.unitCost, 0);

        await tx.warehouseIssue.create({
          data: {
            issueCode,
            type: "DAMAGED",
            source: "TRIP_RETURN",
            referenceCode: tripCode || returnCode,
            createdById: receivedById,
            totalAmount: totalDamageCost,
            status: "CONFIRMED",
            note: `Tự động xuất hủy hàng hỏng vỡ từ phiếu trả hàng ${returnCode}`,
            items: {
              create: damagedItemsToScrap.map((d) => ({
                productId: d.productId,
                quantity: d.quantity,
                unitCost: d.unitCost,
                lineAmount: d.quantity * d.unitCost,
                reason: d.reason,
              })),
            },
          },
        });

        // Ghi nhận sổ cái ADJUSTMENT bổ sung cho hàng hỏng xuất hủy.
        // (Kho đã trừ qua recordTransactionInTx ở trên; ở đây chỉ ghi dòng
        //  tham chiếu tới phiếu xuất hủy, không biến động kho lần 2.)
        for (const d of damagedItemsToScrap) {
          const currentProd = await tx.product.findUnique({ where: { id: d.productId } });
          await tx.inventoryLedger.create({
            data: {
              productId: d.productId,
              type: "ADJUSTMENT",
              referenceCode: issueCode,
              qtyChange: 0,
              unitCostAtTime: d.unitCost,
              stockAfter: currentProd?.currentStock || 0,
              avgCostAfter: currentProd?.avgCostPrice || 0,
              note: `Xuất hủy hỏng vỡ từ xe trả về: ${d.reason}`,
            },
          });
        }
      }

      // 5. Giảm trừ công nợ khách hàng (AR Deduction)
      let arDeductionAmount = totalReturnAmount;
      if (effectiveCustomerId) {
        const customer = await tx.customer.findUnique({
          where: { id: effectiveCustomerId },
        });
        if (customer) {
          const newDebt = Math.max(0, customer.currentDebt - arDeductionAmount);
          await tx.customer.update({
            where: { id: effectiveCustomerId },
            data: { currentDebt: newDebt },
          });
        }
      }

      // Nếu có SalesOrder, giảm codAmountRequired tương ứng
      if (salesOrderId && order) {
        const newCod = Math.max(0, order.codAmountRequired - totalReturnAmount);
        await tx.salesOrder.update({
          where: { id: salesOrderId },
          data: {
            codAmountRequired: newCod,
            deliveryStatus: newCod === 0 ? "CANCELLED" : "PARTIAL",
          },
        });
      }

      // 6. Tạo bản ghi SalesReturn
      const returnRecord = await tx.salesReturn.create({
        data: {
          returnCode,
          salesOrderId: salesOrderId || null,
          customerId: effectiveCustomerId || null,
          tripCode: tripCode || null,
          returnDate: new Date(),
          reason,
          totalReturnAmount,
          arDeductionAmount,
          status: "COMPLETED",
          receivedById: receivedById || null,
          note: note || null,
          items: {
            create: preparedItems,
          },
        },
        include: {
          items: { include: { product: true } },
          customer: true,
          salesOrder: true,
        },
      });

      return returnRecord;
    });
  }

  /**
   * 6. Tiện ích Gợi ý Gom Nhóm Đơn Hàng theo Khu vực (Auto-Grouping by District/Ward) cho xe Tera V6
   * Giúp điều phối viên nhanh chóng ghép các đơn cùng quận vào 1 chuyến tối ưu
   */
  static async suggestDeliveryTripGroups(): Promise<GroupedTripSuggestion[]> {
    const TERA_V6_CAPACITY_KG = 945; // Tải trọng chuẩn Tera V6: 945 kg

    // Lấy các đơn hàng đang chờ giao
    const pendingOrders = await prisma.salesOrder.findMany({
      where: {
        deliveryStatus: "WAITING_DISPATCH",
      },
      orderBy: { orderDate: "asc" },
      include: {
        customer: true,
      },
    });

    // Nhóm các đơn theo Quận/Huyện
    const districtMap: Record<string, typeof pendingOrders> = {};

    for (const order of pendingOrders) {
      // Ưu tiên quận lưu sẵn trên đơn hoặc khách hàng, nếu chưa có thì trích xuất từ địa chỉ
      let district = order.district || order.customer?.district;
      if (!district) {
        district = this.extractDistrict(order.shippingAddress);
        // Cập nhật lại vào DB để lần sau tra cứu siêu nhanh
        prisma.salesOrder
          .update({
            where: { id: order.id },
            data: { district },
          })
          .catch(() => {});
      }

      if (!districtMap[district]) {
        districtMap[district] = [];
      }
      districtMap[district].push(order);
    }

    const suggestions: GroupedTripSuggestion[] = [];

    for (const [district, orders] of Object.entries(districtMap)) {
      const orderCount = orders.length;
      const totalWeightKg = Math.round(orders.reduce((sum, o) => sum + o.totalWeightKg, 0) * 100) / 100;
      const totalCodAmount = orders.reduce((sum, o) => sum + o.codAmountRequired, 0);
      const utilizationRate = Math.min(100, Math.round((totalWeightKg / TERA_V6_CAPACITY_KG) * 100));

      let status: "OPTIMAL" | "UNDERLOADED" | "OVERLOADED" = "OPTIMAL";
      let recommendation = `Tuyến gom lý tưởng cho 1 chuyến xe Tera V6 tại ${district}.`;

      if (totalWeightKg > TERA_V6_CAPACITY_KG) {
        status = "OVERLOADED";
        recommendation = `Quá tải trọng xe Tera V6 (${totalWeightKg}kg / 945kg). Khuyến nghị chia thành 2 chuyến xe.`;
      } else if (totalWeightKg < 250) {
        status = "UNDERLOADED";
        recommendation = `Tải trọng còn thấp (${totalWeightKg}kg / 945kg). Nên ghép thêm đơn ở các quận lân cận để tối ưu chi phí nhiên liệu.`;
      }

      suggestions.push({
        district,
        orderCount,
        totalWeightKg,
        totalCodAmount,
        vehicleCapacityKg: TERA_V6_CAPACITY_KG,
        utilizationRate,
        status,
        recommendation,
        orders: orders.map((o) => ({
          id: o.id,
          orderCode: o.orderCode,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          shippingAddress: o.shippingAddress,
          district: o.district || district,
          totalWeightKg: o.totalWeightKg,
          codAmountRequired: o.codAmountRequired,
          requiresCreditApproval: o.requiresCreditApproval,
          creditApprovalStatus: o.creditApprovalStatus,
          orderDate: o.orderDate,
        })),
      });
    }

    // Sắp xếp nhóm có nhiều đơn và tải trọng cao lên đầu
    return suggestions.sort((a, b) => b.totalWeightKg - a.totalWeightKg);
  }
}
