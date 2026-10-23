import { NextResponse } from "next/server";
import { ProcurementService } from "@/services/procurement.service";
import { requireSession } from "@/lib/route-guard";
import { canAccessProcurement, canWriteProcurement, procurementErrorResponse, validateSupplierInput } from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    if (!canAccessProcurement(auth.user.role, "suppliers")) {
      return NextResponse.json({ success: false, error: "Không có quyền xem nhà cung cấp" }, { status: 403 });
    }
    const supplier = await ProcurementService.getSupplierById(params.id);
    if (!supplier) return NextResponse.json({ success: false, error: "Không tìm thấy nhà cung cấp" }, { status: 404 });
    return NextResponse.json({ success: true, data: supplier });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    if (!canWriteProcurement(auth.user.role)) {
      return NextResponse.json({ success: false, error: "Không có quyền cập nhật nhà cung cấp" }, { status: 403 });
    }
    const input = validateSupplierInput(await request.json());
    const supplier = await ProcurementService.updateSupplier(params.id, input, auth.user.id);
    return NextResponse.json({ success: true, data: supplier });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}
