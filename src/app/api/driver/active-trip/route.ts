import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;

    const isDriver = auth.user.role === "DRIVER";
    // Tài xế chỉ thấy chuyến của chính mình; điều phối/admin thấy chuyến đang chạy
    const activeWhere: any = {
      status: { in: ["DRAFT", "ON_ROAD", "WAITING_SETTLE"] },
    };
    if (isDriver) activeWhere.driverId = auth.user.id;

    // Tìm chuyến xe chưa CLOSED gần nhất hoặc đang thực hiện
    const trip = await prisma.deliveryTrip.findFirst({
      where: activeWhere,
      include: {
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        stops: {
          orderBy: { stopSequence: "asc" },
          include: {
            salesOrder: {
              select: {
                id: true,
                orderCode: true,
                customerName: true,
                customerPhone: true,
                shippingAddress: true,
                totalWeightKg: true,
                codAmountRequired: true,
                totalAmount: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Nếu không có chuyến đang chạy, lấy chuyến xe gần nhất kể cả CLOSED để tài xế xem lại
    if (!trip) {
      const latestWhere: any = {};
      if (isDriver) latestWhere.driverId = auth.user.id;

      const latestTrip = await prisma.deliveryTrip.findFirst({
        where: latestWhere,
        include: {
          driver: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
          stops: {
            orderBy: { stopSequence: "asc" },
            include: {
              salesOrder: {
                select: {
                  id: true,
                  orderCode: true,
                  customerName: true,
                  customerPhone: true,
                  shippingAddress: true,
                  totalWeightKg: true,
                  codAmountRequired: true,
                  totalAmount: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, data: latestTrip || null });
    }

    return NextResponse.json({ success: true, data: trip });
  } catch (error: any) {
    console.error("[API Active Trip GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
