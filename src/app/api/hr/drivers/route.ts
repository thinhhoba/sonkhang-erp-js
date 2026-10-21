import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const drivers = await prisma.employee.findMany({
      where: {
        role: "DRIVER",
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        fullName: true,
        phone: true,
        role: true,
        ratePerTrip: true,
        ratePerStop: true,
        ratePerKg: true,
      },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({ success: true, data: drivers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
