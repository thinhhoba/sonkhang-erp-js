import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/route-guard";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const vehicles = await prisma.vehicle.findMany({
      include: {
        assignedDriver: true,
        _count: {
          select: { maintenances: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: vehicles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["DISPATCHER", "ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    const {
      id,
      plateNumber,
      modelName,
      manufacturer,
      yearOfManufacture,
      payloadCapacityKg,
      fuelType,
      currentOdometerKm,
      status,
      assignedDriverId,
      insuranceExpiryDate,
      registrationExpiryDate,
    } = body;

    if (id) {
      const updated = await prisma.vehicle.update({
        where: { id },
        data: {
          plateNumber,
          modelName,
          manufacturer,
          yearOfManufacture: yearOfManufacture ? Number(yearOfManufacture) : undefined,
          payloadCapacityKg: payloadCapacityKg ? Number(payloadCapacityKg) : 945,
          fuelType: fuelType || "DIESEL",
          currentOdometerKm: currentOdometerKm ? Number(currentOdometerKm) : 0,
          status: status || "ACTIVE",
          assignedDriverId: assignedDriverId || null,
          insuranceExpiryDate: insuranceExpiryDate ? new Date(insuranceExpiryDate) : null,
          registrationExpiryDate: registrationExpiryDate ? new Date(registrationExpiryDate) : null,
        },
        include: { assignedDriver: true },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    const created = await prisma.vehicle.create({
      data: {
        plateNumber,
        modelName: modelName || "Tera V6",
        manufacturer: manufacturer || "Daehan Motors",
        yearOfManufacture: yearOfManufacture ? Number(yearOfManufacture) : 2024,
        payloadCapacityKg: payloadCapacityKg ? Number(payloadCapacityKg) : 945,
        fuelType: fuelType || "DIESEL",
        currentOdometerKm: currentOdometerKm ? Number(currentOdometerKm) : 0,
        status: status || "ACTIVE",
        assignedDriverId: assignedDriverId || null,
        insuranceExpiryDate: insuranceExpiryDate ? new Date(insuranceExpiryDate) : null,
        registrationExpiryDate: registrationExpiryDate ? new Date(registrationExpiryDate) : null,
      },
      include: { assignedDriver: true },
    });
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
