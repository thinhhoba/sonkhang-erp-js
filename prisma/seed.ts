import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Bắt đầu Seeding dữ liệu Sơn Khang ERP ---");

  // 1. Tạo Tài khoản Admin & Kế toán & Tài xế
  const admin = await prisma.employee.upsert({
    where: { email: "admin@sonkhang.vn" },
    update: {},
    create: {
      code: "SK-ADMIN",
      fullName: "Nguyễn Văn Quản Trị (Admin)",
      email: "admin@sonkhang.vn",
      phone: "0900000001",
      role: "ADMIN",
      isActive: true,
      baseSalary: 15000000,
    },
  });

  const driver1 = await prisma.employee.upsert({
    where: { email: "driver1@sonkhang.vn" },
    update: {},
    create: {
      code: "TX-001",
      fullName: "Trần Văn Lái (Tera V6)",
      email: "driver1@sonkhang.vn",
      phone: "0912345678",
      role: "DRIVER",
      isActive: true,
      baseSalary: 6000000,
      ratePerTrip: 30000,
      ratePerStop: 5000,
      ratePerKg: 250,
    },
  });

  const driver2 = await prisma.employee.upsert({
    where: { email: "driver2@sonkhang.vn" },
    update: {},
    create: {
      code: "TX-002",
      fullName: "Lê Văn Tải (Shipper)",
      email: "driver2@sonkhang.vn",
      phone: "0987654321",
      role: "DRIVER",
      isActive: true,
      baseSalary: 5500000,
      ratePerTrip: 30000,
      ratePerStop: 5000,
      ratePerKg: 250,
    },
  });

  console.log("Đã tạo nhân viên:", admin.fullName, driver1.fullName, driver2.fullName);

  // 2. Tạo Danh mục Hàng hóa Sản phẩm
  const p1 = await prisma.product.upsert({
    where: { sku: "IDM-GOR-T40" },
    update: {},
    create: {
      sku: "IDM-GOR-T40",
      sapoVariantId: "1001",
      misaItemCode: "VT_IDM_01",
      name: "Mì Indomie Mi Goreng Đặc Biệt (Thùng 40 gói)",
      baseUnit: "Thùng",
      weightKg: 3.6,
      currentStock: 150,
      inTransitStock: 0,
      avgCostPrice: 245000,
    },
  });

  const p2 = await prisma.product.upsert({
    where: { sku: "XX-SK-500G" },
    update: {},
    create: {
      sku: "XX-SK-500G",
      sapoVariantId: "1002",
      misaItemCode: "VT_XX_02",
      name: "Xúc Xích Dinh Dưỡng Sơn Khang (Gói 500g)",
      baseUnit: "Gói",
      weightKg: 0.5,
      currentStock: 400,
      inTransitStock: 0,
      avgCostPrice: 38000,
    },
  });

  const p3 = await prisma.product.upsert({
    where: { sku: "BC-SK-1KG" },
    update: {},
    create: {
      sku: "BC-SK-1KG",
      sapoVariantId: "1003",
      misaItemCode: "VT_BC_03",
      name: "Bột Chiên Giòn Cao Cấp (Bao 1kg)",
      baseUnit: "Bao",
      weightKg: 1.0,
      currentStock: 300,
      inTransitStock: 0,
      avgCostPrice: 22000,
    },
  });

  console.log("Đã tạo sản phẩm:", p1.name, p2.name, p3.name);

  // 3. Tạo Đơn hàng Sapo chờ điều phối (WAITING_DISPATCH)
  const order1 = await prisma.salesOrder.upsert({
    where: { orderCode: "SON10501" },
    update: {},
    create: {
      sapoOrderId: "20001",
      orderCode: "SON10501",
      customerName: "Đại lý Tạp Hóa Minh Anh",
      customerPhone: "0934112233",
      shippingAddress: "120 Hoàng Hoa Thám, Ba Đình, Hà Nội",
      totalWeightKg: 18.0,
      totalAmount: 1450000,
      codAmountRequired: 1450000,
      deliveryStatus: "WAITING_DISPATCH",
      orderDate: new Date(),
      items: {
        create: [
          {
            productId: p1.id,
            orderedQty: 5,
            deliveredQty: 0,
            returnedQty: 0,
            unitPrice: 290000,
            lineAmount: 1450000,
            lineWeightKg: 18.0,
          },
        ],
      },
    },
  });

  const order2 = await prisma.salesOrder.upsert({
    where: { orderCode: "SON10502" },
    update: {},
    create: {
      sapoOrderId: "20002",
      orderCode: "SON10502",
      customerName: "Siêu thị Mini Mart Xanh",
      customerPhone: "0918776655",
      shippingAddress: "45 Cầu Giấy, Cầu Giấy, Hà Nội",
      totalWeightKg: 36.0,
      totalAmount: 2900000,
      codAmountRequired: 2900000,
      deliveryStatus: "WAITING_DISPATCH",
      orderDate: new Date(),
      items: {
        create: [
          {
            productId: p1.id,
            orderedQty: 10,
            deliveredQty: 0,
            returnedQty: 0,
            unitPrice: 290000,
            lineAmount: 2900000,
            lineWeightKg: 36.0,
          },
        ],
      },
    },
  });

  const order3 = await prisma.salesOrder.upsert({
    where: { orderCode: "SON10503" },
    update: {},
    create: {
      sapoOrderId: "20003",
      orderCode: "SON10503",
      customerName: "Cửa hàng Thực phẩm An Khang",
      customerPhone: "0903889900",
      shippingAddress: "88 Nguyễn Trãi, Thanh Xuân, Hà Nội",
      totalWeightKg: 25.0,
      totalAmount: 2250000,
      codAmountRequired: 2250000,
      deliveryStatus: "WAITING_DISPATCH",
      orderDate: new Date(),
      items: {
        create: [
          {
            productId: p2.id,
            orderedQty: 50,
            deliveredQty: 0,
            returnedQty: 0,
            unitPrice: 45000,
            lineAmount: 2250000,
            lineWeightKg: 25.0,
          },
        ],
      },
    },
  });

  const order4 = await prisma.salesOrder.upsert({
    where: { orderCode: "SON10504" },
    update: {},
    create: {
      sapoOrderId: "20004",
      orderCode: "SON10504",
      customerName: "Quán Ăn Vặt Bé Bự",
      customerPhone: "0977441122",
      shippingAddress: "15 Chùa Láng, Đống Đa, Hà Nội",
      totalWeightKg: 15.0,
      totalAmount: 420000,
      codAmountRequired: 420000,
      deliveryStatus: "WAITING_DISPATCH",
      orderDate: new Date(),
      items: {
        create: [
          {
            productId: p3.id,
            orderedQty: 15,
            deliveredQty: 0,
            returnedQty: 0,
            unitPrice: 28000,
            lineAmount: 420000,
            lineWeightKg: 15.0,
          },
        ],
      },
    },
  });

  console.log("Đã tạo 4 đơn hàng Sapo mẫu:", order1.orderCode, order2.orderCode, order3.orderCode, order4.orderCode);

  // 4. Tạo 1 chuyến xe mẫu đã chạy (DRAFT hoặc ON_ROAD) cho driver1 để test ngay trên /driver-app
  const existingTrip = await prisma.deliveryTrip.findFirst({
    where: { driverId: driver1.id },
  });

  if (!existingTrip) {
    const orderTest = await prisma.salesOrder.create({
      data: {
        sapoOrderId: "20099",
        orderCode: "SON-DEMO-01",
        customerName: "Đại lý Bánh Kẹo Hưng Thịnh",
        customerPhone: "0912999888",
        shippingAddress: "29 Liễu Giai, Ba Đình, Hà Nội",
        totalWeightKg: 36.0,
        totalAmount: 2900000,
        codAmountRequired: 2900000,
        deliveryStatus: "IN_TRANSIT",
        orderDate: new Date(),
        items: {
          create: [
            {
              productId: p1.id,
              orderedQty: 10,
              deliveredQty: 0,
              returnedQty: 0,
              unitPrice: 290000,
              lineAmount: 2900000,
              lineWeightKg: 36.0,
            },
          ],
        },
      },
    });

    const tripDemo = await prisma.deliveryTrip.create({
      data: {
        tripCode: "TRIP-20261021-01",
        driverId: driver1.id,
        vehiclePlate: "Tera V6 - 29D-888.68",
        plannedDurationMin: 180,
        status: "DRAFT",
        stops: {
          create: [
            {
              salesOrderId: orderTest.id,
              stopSequence: 1,
              status: "PENDING",
            },
          ],
        },
      },
    });

    console.log("Đã tạo chuyến xe mẫu cho tài xế:", tripDemo.tripCode);
  }

  console.log("--- Hoàn tất Seeding thành công! ---");
}

main()
  .catch((e) => {
    console.error("Lỗi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
