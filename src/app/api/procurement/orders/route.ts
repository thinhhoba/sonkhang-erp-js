import { NextResponse } from "next/server";
import { ProcurementService } from "@/services/procurement.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const orders = await ProcurementService.listPurchaseOrders(status);
    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error("[API Purchase Orders GET] Error:", error);
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
    const order = await ProcurementService.createPurchaseOrder(body);
    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error: any) {
    console.error("[API Purchase Orders POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
