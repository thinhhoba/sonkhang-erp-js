import { NextResponse } from "next/server";
import { WarehouseService } from "@/services/warehouse.service";
import { requireSession, requireRole } from "@/lib/route-guard";
import { warehouseFailure } from "@/lib/warehouse-errors";
import { redactWarehouseValuation } from "@/lib/warehouse-serialization";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ADMIN", "ACCOUNTANT", "WAREHOUSE"]);
    if (forbidden) return forbidden;
    const stocktakes = await WarehouseService.listStocktakes();
    return NextResponse.json({ success: true, data: redactWarehouseValuation(stocktakes, auth.user.role) });
  } catch (error) {
    console.error("[API Stocktake GET]");
    return warehouseFailure(error, 500);
  }
}

export async function POST(req: Request) {
  try {
    const authPost = await requireSession();
    if ("error" in authPost) return authPost.error;
    const forbidden = requireRole(authPost.user, ["WAREHOUSE", "ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    const stocktake = await WarehouseService.createStocktake({ ...body, conductedById: authPost.user.id });
    return NextResponse.json({ success: true, data: redactWarehouseValuation(stocktake, authPost.user.role) }, { status: 201 });
  } catch (error) {
    console.error("[API Stocktake POST]");
    return warehouseFailure(error);
  }
}
