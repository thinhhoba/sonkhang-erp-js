import { NextResponse } from "next/server";
import { ProcurementService } from "@/services/procurement.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId") || undefined;

    const result = await ProcurementService.performThreeWayMatching(id, invoiceId);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[API 3-Way Matching GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
