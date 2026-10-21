import { NextResponse } from "next/server";
import { ProcurementService } from "@/services/procurement.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["DISPATCHER", "ADMIN"]);
    if (forbidden) return forbidden;
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const updated = await ProcurementService.approvePurchaseOrder(id, body.approvedById);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[API Purchase Order Approve] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
