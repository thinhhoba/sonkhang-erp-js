import { NextResponse } from "next/server";
import { ProcurementService } from "@/services/procurement.service";
import { requireSession } from "@/lib/route-guard";
import { canWriteProcurement, procurementErrorResponse } from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    if (!canWriteProcurement(auth.user.role)) {
      return NextResponse.json({ success: false, error: "Không có quyền trình duyệt đơn mua hàng" }, { status: 403 });
    }
    const submitted = await ProcurementService.submitPurchaseOrder(params.id, auth.user.id!);
    return NextResponse.json({ success: true, data: submitted });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}
