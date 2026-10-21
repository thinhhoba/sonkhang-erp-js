import { NextResponse } from "next/server";
import { ProcurementService } from "@/services/procurement.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const suppliers = await ProcurementService.listSuppliers();
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    console.error("[API Suppliers GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["DISPATCHER", "ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    const supplier = await ProcurementService.createSupplier(body);
    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    console.error("[API Suppliers POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
