import { NextResponse } from "next/server";
import { WarehouseService } from "@/services/warehouse.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const stocktakes = await WarehouseService.listStocktakes();
    return NextResponse.json({ success: true, data: stocktakes });
  } catch (error: any) {
    console.error("[API Stocktake GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authPost = await requireSession();
    if ("error" in authPost) return authPost.error;
    const forbidden = requireRole(authPost.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    const stocktake = await WarehouseService.createStocktake(body);
    return NextResponse.json({ success: true, data: stocktake }, { status: 201 });
  } catch (error: any) {
    console.error("[API Stocktake POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
