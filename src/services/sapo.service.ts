// File: src/services/sapo.service.ts
import crypto from "crypto";
import prisma from "@/lib/prisma";

// ==========================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU TỪ SAPO WEBHOOK
// ==========================================
export interface SapoLineItemPayload {
  id: number;
  variant_id: number;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  discount_amount?: number;
  grams?: number; // Sapo trả về trọng lượng theo gram
}

export interface SapoOrderWebhookPayload {
  id: number;
  order_number: string; // VD: "SON10567"
  created_on: string;
  total_price: number;
  total_outstanding?: number; // Số tiền còn phải thu (dùng cho COD)
  customer?: {
    id: number;
    name: string;
    phone_number?: string;
  };
  shipping_address?: {
    full_name?: string;
    phone_number?: string;
    address1?: string;
    ward?: string;
    district?: string;
    city?: string;
  };
  order_line_items: SapoLineItemPayload[];
}

export class SapoService {
  /**
   * 1. Xác thực Webhook chữ ký HMAC SHA256 từ Sapo gửi sang
   * Tránh request giả mạo trên VPS công khai
   */
  static verifyWebhookSignature(
    rawBody: string,
    sapoHmacHeader: string | null,
    secret: string = process.env.SAPO_WEBHOOK_SECRET || ""
  ): boolean {
    if (!sapoHmacHeader || !secret) return false;

    const hash = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64");

    // timingSafeEqual ném ngoại lệ khi 2 buffer lệch độ dài — kiểm tra trước
    const expected = Buffer.from(hash, "base64");
    const received = Buffer.from(sapoHmacHeader, "base64");
    if (expected.length !== received.length) return false;

    return crypto.timingSafeEqual(expected, received);
  }

  /**
   * 2. Xử lý lưu và đồng bộ đơn hàng từ Sapo vào Database Sơn Khang
   */
  static async syncOrderFromWebhook(payload: SapoOrderWebhookPayload) {
    const sapoOrderId = String(payload.id);
    const orderCode = payload.order_number;

    return await prisma.$transaction(async (tx) => {
      // 1. Kiểm tra đơn hàng đã nằm trong chuyến xe đang giao hoặc đã giao xong chưa
      const existingOrder = await tx.salesOrder.findUnique({
        where: { sapoOrderId },
        include: { tripStops: true },
      });

      if (
        existingOrder &&
        ["IN_TRANSIT", "DELIVERED", "PARTIAL"].includes(existingOrder.deliveryStatus)
      ) {
        // Đơn đã lên xe hoặc đã giao -> Không ghi đè lại trạng thái điều phối
        return existingOrder;
      }

      // 2. Chuẩn hóa địa chỉ và thông tin người nhận
      const customerName =
        payload.shipping_address?.full_name ||
        payload.customer?.name ||
        "Khách lẻ";
      const customerPhone =
        payload.shipping_address?.phone_number ||
        payload.customer?.phone_number ||
        null;
      
      const fullAddressParts = [
        payload.shipping_address?.address1,
        payload.shipping_address?.ward,
        payload.shipping_address?.district,
        payload.shipping_address?.city,
      ].filter(Boolean);

      const shippingAddress =
        fullAddressParts.length > 0
          ? fullAddressParts.join(", ")
          : "Tại kho / Chưa có địa chỉ";

      // 3. Tính toán tiền COD: Ưu tiên tiền còn phải thu (total_outstanding)
      const codAmountRequired =
        payload.total_outstanding !== undefined && payload.total_outstanding > 0
          ? payload.total_outstanding
          : payload.total_price;

      // 4. Xử lý từng dòng sản phẩm & Tính toán trọng lượng
      let orderTotalWeightKg = 0;
      const preparedItems = [];

      for (const line of payload.order_line_items) {
        const variantIdStr = String(line.variant_id);
        const sku = line.sku ? line.sku.trim() : `SKU-SAPO-${line.variant_id}`;

        // Tìm sản phẩm trong DB nội bộ
        let product = await tx.product.findFirst({
          where: {
            OR: [{ sapoVariantId: variantIdStr }, { sku: sku }],
          },
        });

        // Nếu mặt hàng chưa có trong DB Sơn Khang -> Tự động khởi tạo bản ghi nháp
        if (!product) {
          const fallbackWeightKg = line.grams ? line.grams / 1000 : 0;

          product = await tx.product.create({
            data: {
              sapoVariantId: variantIdStr,
              sku: sku,
              name: line.name,
              baseUnit: "Đơn vị",
              weightKg: fallbackWeightKg,
              currentStock: 0,
              avgCostPrice: 0,
            },
          });
        }

        // Ưu tiên cân nặng chuẩn đã cấu hình ở Product, nếu = 0 thì lấy từ grams của Sapo
        const effectiveUnitWeightKg =
          product.weightKg > 0
            ? product.weightKg
            : line.grams
            ? line.grams / 1000
            : 0;

        const lineWeightKg = Math.round(line.quantity * effectiveUnitWeightKg * 100) / 100;
        orderTotalWeightKg += lineWeightKg;

        const discount = line.discount_amount || 0;
        const lineAmount = Math.max(0, line.quantity * line.price - discount);

        preparedItems.push({
          productId: product.id,
          orderedQty: line.quantity,
          deliveredQty: 0,
          returnedQty: 0,
          unitPrice: line.price,
          discountAmount: discount,
          lineAmount: lineAmount,
          lineWeightKg: lineWeightKg,
        });
      }

      orderTotalWeightKg = Math.round(orderTotalWeightKg * 100) / 100;

      // 5. Tìm hoặc tạo Khách hàng (Customer) & Kiểm tra hạn mức công nợ
      let customerId: string | null = null;
      let requiresCreditApproval = false;
      let creditApprovalStatus = "APPROVED";
      let creditApprovalNote: string | null = null;

      const sapoCustIdStr = payload.customer?.id ? String(payload.customer.id) : null;
      let customer = await tx.customer.findFirst({
        where: {
          OR: [
            ...(sapoCustIdStr ? [{ sapoCustomerId: sapoCustIdStr }] : []),
            ...(customerPhone ? [{ phone: customerPhone }] : []),
          ],
        },
      });

      const extractedDistrict =
        payload.shipping_address?.district ||
        (shippingAddress ? (await import("./sales-ar.service")).SalesARService.extractDistrict(shippingAddress) : null);

      if (!customer && customerName) {
        const count = await tx.customer.count();
        const code = `KH-${String(count + 1).padStart(4, "0")}`;
        customer = await tx.customer.create({
          data: {
            customerCode: code,
            sapoCustomerId: sapoCustIdStr,
            name: customerName,
            phone: customerPhone,
            address: shippingAddress,
            district: extractedDistrict,
            ward: payload.shipping_address?.ward,
            city: payload.shipping_address?.city || "TP. Hồ Chí Minh",
            creditLimit: 30000000, // Mặc định hạn mức 30tr
            currentDebt: 0,
          },
        });
      }

      if (customer) {
        customerId = customer.id;
        // Kiểm tra hạn mức công nợ
        const projectedDebt = customer.currentDebt + payload.total_price;
        if (customer.isBlocked) {
          requiresCreditApproval = true;
          creditApprovalStatus = "PENDING_APPROVAL";
          creditApprovalNote = `Khách hàng đang bị KHÓA CÔNG NỢ. Yêu cầu Giám đốc phê duyệt đặc biệt.`;
        } else if (customer.creditLimit > 0 && projectedDebt > customer.creditLimit) {
          requiresCreditApproval = true;
          creditApprovalStatus = "PENDING_APPROVAL";
          creditApprovalNote = `Công nợ dự kiến (${projectedDebt.toLocaleString("vi-VN")}đ) vượt hạn mức (${customer.creditLimit.toLocaleString("vi-VN")}đ). Cần Giám đốc phê duyệt.`;
        }
      }

      // 6. Upsert bản ghi SalesOrder
      if (existingOrder) {
        // Cập nhật đơn hàng (xóa items cũ để insert lại bộ items mới nhất)
        await tx.salesOrderItem.deleteMany({
          where: { salesOrderId: existingOrder.id },
        });

        return await tx.salesOrder.update({
          where: { id: existingOrder.id },
          data: {
            orderCode,
            customerId: customerId || existingOrder.customerId,
            district: extractedDistrict || existingOrder.district,
            customerName,
            customerPhone,
            shippingAddress,
            totalWeightKg: orderTotalWeightKg,
            totalAmount: payload.total_price,
            codAmountRequired,
            requiresCreditApproval,
            creditApprovalStatus,
            creditApprovalNote,
            orderDate: new Date(payload.created_on),
            items: {
              create: preparedItems,
            },
          },
          include: { items: true },
        });
      } else {
        // Tạo đơn hàng mới
        return await tx.salesOrder.create({
          data: {
            sapoOrderId,
            orderCode,
            customerId,
            district: extractedDistrict,
            ward: payload.shipping_address?.ward,
            sapoCustomerId: sapoCustIdStr,
            customerName,
            customerPhone,
            shippingAddress,
            totalWeightKg: orderTotalWeightKg,
            totalAmount: payload.total_price,
            codAmountRequired,
            requiresCreditApproval,
            creditApprovalStatus,
            creditApprovalNote,
            deliveryStatus: "WAITING_DISPATCH",
            orderDate: new Date(payload.created_on),
            items: {
              create: preparedItems,
            },
          },
          include: { items: true },
        });
      }
    });
  }
}