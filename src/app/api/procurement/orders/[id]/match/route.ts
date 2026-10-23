import { NextResponse } from "next/server";
import { ProcurementService } from "@/services/procurement.service";
import { requireSession } from "@/lib/route-guard";
import { canAccessProcurement, procurementErrorResponse } from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    if (!canAccessProcurement(auth.user.role, "three-way-match")) {
      return NextResponse.json({ success: false, error: "Không có quyền đối chiếu ba bên" }, { status: 403 });
    }
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId") || undefined;

    const result = await ProcurementService.performThreeWayMatching(id, invoiceId);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    console.error("[API 3-Way Matching GET]", failure.error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}
