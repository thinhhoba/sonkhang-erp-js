import { NextResponse } from "next/server";
import { ProcurementService } from "@/services/procurement.service";
import { requireSession } from "@/lib/route-guard";
import { canWriteProcurement } from "@/lib/procurement";
import { procurementErrorResponse } from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { id } = params;
    if (!canWriteProcurement(auth.user.role)) {
      return NextResponse.json({ success: false, error: "Không có quyền phê duyệt đơn mua hàng" }, { status: 403 });
    }
    const updated = await ProcurementService.approvePurchaseOrder(id, auth.user.id!);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    console.error("[API Purchase Order Approve]", failure.error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}
