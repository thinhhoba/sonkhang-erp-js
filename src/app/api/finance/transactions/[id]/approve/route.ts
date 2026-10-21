import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/route-guard";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    const { action, approvedById, approvedByName, note } = body; // action: 'APPROVE' | 'REJECT'

    const status = action === "REJECT" ? "REJECTED" : "APPROVED";

    const updated = await prisma.internalTransaction.update({
      where: { id: params.id },
      data: {
        status,
        approvedById,
        approvedByName: approvedByName || "Giám Đốc / Kế Toán Trưởng",
        approvedAt: new Date(),
        note: note || undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
