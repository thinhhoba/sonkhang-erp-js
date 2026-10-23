import { NextResponse } from "next/server";
import { ProcurementService } from "@/services/procurement.service";
import { requireSession } from "@/lib/route-guard";
import { canAccessProcurement, canWriteProcurement, procurementErrorResponse, validateSupplierInput } from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    if (!canAccessProcurement(auth.user.role, "suppliers")) {
      return NextResponse.json({ success: false, error: "Không có quyền xem nhà cung cấp" }, { status: 403 });
    }
    const suppliers = await ProcurementService.listSuppliers();
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    console.error("[API Suppliers GET]", failure.error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    if (!canWriteProcurement(auth.user.role)) {
      return NextResponse.json({ success: false, error: "Không có quyền tạo nhà cung cấp" }, { status: 403 });
    }
    const body = validateSupplierInput(await req.json());
    const supplier = await ProcurementService.createSupplier(body, auth.user.id);
    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    console.error("[API Suppliers POST]", failure.error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}
