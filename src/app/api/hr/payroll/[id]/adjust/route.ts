import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/route-guard";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const payrollId = params.id;
    const body = await req.json();

    const allowanceAmount = Number(body.allowanceAmount) || 0;
    const bonusAmount = Number(body.bonusAmount) || 0;
    const advanceDeducted = Number(body.advanceDeducted) || 0;
    const penaltyDeducted = Number(body.penaltyDeducted) || 0;

    const existing = await prisma.monthlyPayroll.findUnique({
      where: { id: payrollId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Bản ghi lương không tồn tại" }, { status: 404 });
    }

    if (existing.status === "PAID") {
      return NextResponse.json({ success: false, error: "Bảng lương đã chi trả, không thể sửa đổi" }, { status: 400 });
    }

    const netSalary =
      existing.baseSalaryEarned +
      existing.totalTripSalary +
      allowanceAmount +
      bonusAmount -
      advanceDeducted -
      penaltyDeducted;

    const updated = await prisma.monthlyPayroll.update({
      where: { id: payrollId },
      data: {
        allowanceAmount,
        bonusAmount,
        advanceDeducted,
        penaltyDeducted,
        netSalary,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
