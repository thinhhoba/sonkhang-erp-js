import { NextResponse } from "next/server";
import { WarehouseService } from "@/services/warehouse.service";
import { requireSession, requireRole } from "@/lib/route-guard";
import { warehouseFailure } from "@/lib/warehouse-errors";
import { redactWarehouseValuation } from "@/lib/warehouse-serialization";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["WAREHOUSE", "ADMIN"]);
    if (forbidden) return forbidden;
    const { id } = params;
    const completed = await WarehouseService.completeStocktake(id, auth.user.id!);
    return NextResponse.json({ success: true, data: redactWarehouseValuation(completed, auth.user.role) });
  } catch (error) {
    console.error("[API Stocktake Complete]");
    return warehouseFailure(error);
  }
}
