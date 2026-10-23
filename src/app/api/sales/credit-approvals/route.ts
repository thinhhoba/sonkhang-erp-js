import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ADMIN"]);
    if (forbidden) return forbidden;
    const rows = await prisma.salesOrder.findMany({
      where: { requiresCreditApproval: true, creditApprovalStatus: "PENDING_APPROVAL" },
      select: { id: true, orderCode: true, customerName: true, totalAmount: true, codAmountRequired: true, orderDate: true, creditApprovalNote: true },
      orderBy: { orderDate: "asc" },
      take: 100,
    });
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Sales credit approvals failed");
    return NextResponse.json({ success: false, error: "Không thể tải danh sách chờ duyệt hạn mức" }, { status: 500 });
  }
}
