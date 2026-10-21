import { NextResponse } from "next/server";
import { SapoService, SapoOrderWebhookPayload } from "@/services/sapo.service";

export const dynamic = "force-dynamic";

// Danh sách khách hàng mẫu tại Hà Nội
const SAMPLE_CUSTOMERS = [
  {
    name: "Tạp Hóa Hương Sen",
    phone: "0982341122",
    address1: "18 Phố Huế",
    ward: "Hàng Bài",
    district: "Hoàn Kiếm",
    city: "Hà Nội",
  },
  {
    name: "Đại lý Bánh Kẹo Hùng Cường",
    phone: "0915667788",
    address1: "102 Chùa Bộc",
    ward: "Trung Liệt",
    district: "Đống Đa",
    city: "Hà Nội",
  },
  {
    name: "Cửa hàng Tiện lợi FamilyMart 247",
    phone: "0978991133",
    address1: "56 Trần Thái Tông",
    ward: "Dịch Vọng Hậu",
    district: "Cầu Giấy",
    city: "Hà Nội",
  },
  {
    name: "Bếp Ăn Nhanh Minh Đức",
    phone: "0936123456",
    address1: "240 Kim Mã",
    ward: "Kim Mã",
    district: "Ba Đình",
    city: "Hà Nội",
  },
  {
    name: "Siêu thị Thực Phẩm Sạch An Tâm",
    phone: "0904556677",
    address1: "15 Nguyễn Tuân",
    ward: "Thanh Xuân Trung",
    district: "Thanh Xuân",
    city: "Hà Nội",
  },
];

// Danh sách mặt hàng mẫu chuẩn của Sơn Khang
const SAMPLE_CATALOG = [
  {
    variant_id: 1001,
    sku: "IDM-GOR-T40",
    name: "Mì Indomie Mi Goreng Đặc Biệt (Thùng 40 gói)",
    price: 290000,
    grams: 3600, // 3.6 kg / thùng
  },
  {
    variant_id: 1002,
    sku: "XX-SK-500G",
    name: "Xúc Xích Dinh Dưỡng Sơn Khang (Gói 500g)",
    price: 45000,
    grams: 500, // 0.5 kg / gói
  },
  {
    variant_id: 1003,
    sku: "BC-SK-1KG",
    name: "Bột Chiên Giòn Cao Cấp (Bao 1kg)",
    price: 28000,
    grams: 1000, // 1.0 kg / bao
  },
  {
    variant_id: 1004,
    sku: "MAY-MEJE-1KG",
    name: "Sốt Mayonnaise MEJE Chai 1Kg",
    price: 85000,
    grams: 1050, // 1.05 kg / chai
  },
  {
    variant_id: 1005,
    sku: "TC-MEJE-5L",
    name: "Tương Cà Đậm Đà MEJE Can 5L",
    price: 165000,
    grams: 5200, // 5.2 kg / can
  },
];

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Endpoint mô phỏng bị vô hiệu hóa trên Production!" }, { status: 403 });
  }
  try {
    // 1. Random khách hàng
    const cust = SAMPLE_CUSTOMERS[Math.floor(Math.random() * SAMPLE_CUSTOMERS.length)];
    const randomOrderId = Math.floor(10000 + Math.random() * 90000);
    const sapoOrderNumber = `SON${randomOrderId}`;

    // 2. Random chọn 1-3 mặt hàng với số lượng ngẫu nhiên
    const itemsCount = Math.floor(Math.random() * 3) + 1;
    const shuffledCatalog = [...SAMPLE_CATALOG].sort(() => 0.5 - Math.random());
    const selectedCatalog = shuffledCatalog.slice(0, itemsCount);

    let totalPrice = 0;
    const orderLineItems = selectedCatalog.map((cat, idx) => {
      // Số lượng từ 2 đến 10
      const qty = Math.floor(Math.random() * 8) + 2;
      const lineTotal = cat.price * qty;
      totalPrice += lineTotal;

      return {
        id: randomOrderId * 10 + idx + 1,
        variant_id: cat.variant_id,
        sku: cat.sku,
        name: cat.name,
        quantity: qty,
        price: cat.price,
        discount_amount: 0,
        grams: cat.grams, // Gram từ Sapo
      };
    });

    // 3. Xây dựng payload Sapo chuẩn
    const payload: SapoOrderWebhookPayload = {
      id: randomOrderId,
      order_number: sapoOrderNumber,
      created_on: new Date().toISOString(),
      total_price: totalPrice,
      total_outstanding: totalPrice, // COD bằng 100% tổng tiền
      customer: {
        id: randomOrderId + 50000,
        name: cust.name,
        phone_number: cust.phone,
      },
      shipping_address: {
        full_name: cust.name,
        phone_number: cust.phone,
        address1: cust.address1,
        ward: cust.ward,
        district: cust.district,
        city: cust.city,
      },
      order_line_items: orderLineItems,
    };

    // 4. Đồng bộ trực tiếp qua SapoService
    const synchronizedOrder = await SapoService.syncOrderFromWebhook(payload);

    return NextResponse.json({
      success: true,
      message: `Đã giả lập nhận thành công đơn ${synchronizedOrder.orderCode} từ Sapo!`,
      data: {
        id: synchronizedOrder.id,
        orderCode: synchronizedOrder.orderCode,
        customerName: synchronizedOrder.customerName,
        customerPhone: synchronizedOrder.customerPhone,
        shippingAddress: synchronizedOrder.shippingAddress,
        totalWeightKg: synchronizedOrder.totalWeightKg,
        codAmountRequired: synchronizedOrder.codAmountRequired,
        totalAmount: synchronizedOrder.totalAmount,
        deliveryStatus: synchronizedOrder.deliveryStatus,
        itemCount: orderLineItems.length,
      },
    });
  } catch (error: any) {
    console.error("[Simulate Sapo Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
