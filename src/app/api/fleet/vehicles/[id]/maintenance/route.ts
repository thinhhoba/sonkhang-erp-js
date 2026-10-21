import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/route-guard";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const maintenances = await prisma.vehicleMaintenance.findMany({
      where: { vehicleId: params.id },
      orderBy: { maintenanceDate: "desc" },
    });
    return NextResponse.json({ success: true, data: maintenances });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const authPost = await requireSession();
    if ("error" in authPost) return authPost.error;
    const forbidden = requireRole(authPost.user, ["DISPATCHER", "ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    const { odometerKm, serviceType, title, description, garageName, cost, status, performedById } = body;

    const count = await prisma.vehicleMaintenance.count();
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const maintenanceCode = `BD-${todayStr}-${String(count + 1).padStart(3, "0")}`;

    const maintenance = await prisma.vehicleMaintenance.create({
      data: {
        maintenanceCode,
        vehicleId: params.id,
        odometerKm: Number(odometerKm) || 0,
        serviceType: serviceType || "THAY_NHOT",
        title: title || "Bảo dưỡng định kỳ",
        description,
        garageName,
        cost: Number(cost) || 0,
        status: status || "COMPLETED",
        performedById,
        maintenanceDate: new Date(),
      },
    });

    // Update vehicle odometer if higher
    if (odometerKm) {
      const v = await prisma.vehicle.findUnique({ where: { id: params.id } });
      if (v && Number(odometerKm) > v.currentOdometerKm) {
        await prisma.vehicle.update({
          where: { id: params.id },
          data: { currentOdometerKm: Number(odometerKm) },
        });
      }
    }

    return NextResponse.json({ success: true, data: maintenance });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
