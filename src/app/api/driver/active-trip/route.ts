import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { activeTripAccess } from "@/lib/permissions";
import { requireSession } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["DRAFT", "ON_ROAD", "WAITING_SETTLE"];

/**
 * Operational view for the driver PWA. Drivers receive only their own active
 * trip; dispatch/admin may inspect an active trip but never receive COD or
 * order-value fields from this endpoint.
 */
export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { role, id: employeeId } = auth.user;
    const access = activeTripAccess(role);

    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: "Không có quyền xem chuyến xe đang hoạt động!" },
        { status: 403 }
      );
    }

    if (role === "DRIVER") {
      const trip = await prisma.deliveryTrip.findFirst({
        where: { driverId: employeeId, status: { in: ACTIVE_STATUSES } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          tripCode: true,
          status: true,
          vehiclePlate: true,
          departedAt: true,
          returnedAt: true,
          stops: {
            orderBy: { stopSequence: "asc" },
            select: {
              id: true,
              stopSequence: true,
              status: true,
              arrivedAt: true,
              completedAt: true,
              salesOrder: {
                select: {
                  id: true,
                  orderCode: true,
                  customerName: true,
                  customerPhone: true,
                  shippingAddress: true,
                  totalWeightKg: true,
                  codAmountRequired: true,
                },
              },
            },
          },
        },
      });
      return NextResponse.json({ success: true, data: trip });
    }

    const trip = await prisma.deliveryTrip.findFirst({
      where: { status: { in: ACTIVE_STATUSES } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tripCode: true,
        status: true,
        vehiclePlate: true,
        departedAt: true,
        returnedAt: true,
        driver: { select: { id: true, fullName: true, code: true } },
        stops: {
          orderBy: { stopSequence: "asc" },
          select: {
            id: true,
            stopSequence: true,
            status: true,
            arrivedAt: true,
            completedAt: true,
            salesOrder: {
              select: {
                id: true,
                orderCode: true,
                customerName: true,
                customerPhone: true,
                shippingAddress: true,
                totalWeightKg: true,
              },
            },
          },
        },
      },
    });
    return NextResponse.json({ success: true, data: trip });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể tải chuyến xe";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
