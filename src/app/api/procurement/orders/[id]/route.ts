import { NextResponse } from "next/server";
import { ProcurementService } from "@/services/procurement.service";
import { requireSession } from "@/lib/route-guard";
import { canAccessProcurement, canWriteProcurement, procurementErrorResponse, validatePurchaseOrderInput } from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    if (!canAccessProcurement(auth.user.role, "purchase-orders")) {
      return NextResponse.json({ success: false, error: "Không có quyền xem đơn mua hàng" }, { status: 403 });
    }
    const { id } = params;
    const order = await ProcurementService.getPurchaseOrderById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy đơn đặt hàng: " + id },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    console.error("[API Purchase Order GET by ID]", failure.error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    if (!canWriteProcurement(auth.user.role)) {
      return NextResponse.json({ success: false, error: "Không có quyền sửa PO" }, { status: 403 });
    }
    const input = validatePurchaseOrderInput(await request.json());
    const updated = await ProcurementService.updateDraftPurchaseOrder(params.id, input, auth.user.id!);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}
