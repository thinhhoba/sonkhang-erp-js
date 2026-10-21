import { NextResponse } from "next/server";
import { WarehouseService } from "@/services/warehouse.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { id } = params;
    const stocktake = await WarehouseService.getStocktakeById(id);

    if (!stocktake) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy phiếu kiểm kê: " + id },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: stocktake });
  } catch (error: any) {
    console.error("[API Stocktake GET by ID] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authPut = await requireSession();
    if ("error" in authPut) return authPut.error;
    const forbidden = requireRole(authPut.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const { id } = params;
    const body = await req.json();

    const updated = await WarehouseService.updateStocktakeActual({
      stocktakeId: id,
      items: body.items,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[API Stocktake PUT items] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
