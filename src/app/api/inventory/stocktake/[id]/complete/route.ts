import { NextResponse } from "next/server";
import { WarehouseService } from "@/services/warehouse.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const { id } = params;
    const completed = await WarehouseService.completeStocktake(id);
    return NextResponse.json({ success: true, data: completed });
  } catch (error: any) {
    console.error("[API Stocktake Complete] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
