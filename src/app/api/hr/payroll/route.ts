import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const { searchParams } = new URL(req.url);
    const monthYear = searchParams.get("monthYear");

    if (!monthYear) {
      return NextResponse.json({ success: false, error: "Thiếu tham số monthYear" }, { status: 400 });
    }

    const payrolls = await prisma.monthlyPayroll.findMany({
      where: { monthYear },
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            fullName: true,
            phone: true,
            role: true,
            baseSalary: true,
          },
        },
      },
      orderBy: { employee: { code: "asc" } },
    });

    return NextResponse.json({ success: true, data: payrolls });
  } catch (error: any) {
    console.error("[API Payroll GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
