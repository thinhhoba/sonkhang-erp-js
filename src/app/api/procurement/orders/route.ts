import { NextResponse } from "next/server";
import { ProcurementService } from "@/services/procurement.service";
import { requireSession } from "@/lib/route-guard";
import { canAccessProcurement, canWriteProcurement, procurementErrorResponse, validatePurchaseOrderInput } from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    if (!canAccessProcurement(auth.user.role, "purchase-orders")) {
      return NextResponse.json({ success: false, error: "Không có quyền xem đơn mua hàng" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const orders = await ProcurementService.listPurchaseOrders(status);
    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    console.error("[API Purchase Orders GET]", failure.error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    if (!canWriteProcurement(auth.user.role)) {
      return NextResponse.json({ success: false, error: "Không có quyền tạo đơn mua hàng" }, { status: 403 });
    }
    const body = validatePurchaseOrderInput(await req.json());
    const order = await ProcurementService.createPurchaseOrder({ ...body, createdById: auth.user.id }, auth.user.id);
    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    console.error("[API Purchase Orders POST]", failure.error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}
