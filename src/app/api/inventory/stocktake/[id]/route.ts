import { NextResponse } from "next/server";
import { WarehouseService } from "@/services/warehouse.service";
import { requireSession, requireRole } from "@/lib/route-guard";
import { warehouseFailure } from "@/lib/warehouse-errors";
import { redactWarehouseValuation } from "@/lib/warehouse-serialization";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ADMIN", "ACCOUNTANT", "WAREHOUSE"]);
    if (forbidden) return forbidden;
    const { id } = params;
    const stocktake = await WarehouseService.getStocktakeById(id);

    if (!stocktake) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy phiếu kiểm kê: " + id },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: redactWarehouseValuation(stocktake, auth.user.role) });
  } catch (error) {
    console.error("[API Stocktake GET by ID]");
    return warehouseFailure(error, 500);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authPut = await requireSession();
    if ("error" in authPut) return authPut.error;
    const forbidden = requireRole(authPut.user, ["WAREHOUSE", "ADMIN"]);
    if (forbidden) return forbidden;
    const { id } = params;
    const body = await req.json();

    const updated = await WarehouseService.updateStocktakeActual({
      stocktakeId: id,
      actorId: authPut.user.id!,
      items: body.items,
    });

    return NextResponse.json({ success: true, data: redactWarehouseValuation(updated, authPut.user.role) });
  } catch (error) {
    console.error("[API Stocktake PUT items]");
    return warehouseFailure(error);
  }
}
