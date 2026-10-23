import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { LogisticsService } from "@/services/logistics.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

// GET /api/logistics/trips - Lấy danh sách chuyến xe
export async function GET() {
  try {
    const authGet = await requireSession();
    if ("error" in authGet) return authGet.error;
    const trips = await prisma.deliveryTrip.findMany({
      include: {
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            ratePerTrip: true,
            ratePerStop: true,
            ratePerKg: true,
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
                deliveryStatus: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: trips });
  } catch (error: any) {
    console.error("[API Trips GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/logistics/trips - Tạo chuyến xe mới
export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["DISPATCHER", "ADMIN"]);
    if (forbidden) return forbidden;

    const body = await req.json();
    const { driverId, vehiclePlate, plannedDurationMin, orderIds } = body;

    if (!driverId || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Vui lòng chọn tài xế và ít nhất 1 đơn hàng!" },
        { status: 400 }
      );
    }

    const trip = await LogisticsService.createTrip({
      actorId: auth.user.id!,
      driverId,
      vehiclePlate,
      plannedDurationMin,
      orderIds,
    });

    return NextResponse.json({ success: true, data: trip });
  } catch (error: any) {
    console.error("[API Trips POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
