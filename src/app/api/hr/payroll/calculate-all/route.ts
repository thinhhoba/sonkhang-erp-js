import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PayrollService } from "@/services/payroll.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    const { monthYear } = body;

    if (!monthYear) {
      return NextResponse.json({ success: false, error: "Thiếu tham số monthYear" }, { status: 400 });
    }

    const employees = await prisma.employee.findMany({
      where: { isActive: true },
    });

    const results = [];
    for (const emp of employees) {
      const p = await PayrollService.generateMonthlyPayroll(emp.id, monthYear);
      results.push(p);
    }

    return NextResponse.json({
      success: true,
      message: `Đã tính toán bảng lương cho ${results.length} nhân sự trong tháng ${monthYear}!`,
      data: results,
    });
  } catch (error: any) {
    console.error("[API Payroll Calculate Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
