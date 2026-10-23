import { NextResponse } from "next/server";
import { WarehouseService } from "@/services/warehouse.service";
import { requireSession, requireRole } from "@/lib/route-guard";
import { warehouseFailure } from "@/lib/warehouse-errors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ADMIN", "ACCOUNTANT", "WAREHOUSE"]);
    if (forbidden) return forbidden;
    const { searchParams } = new URL(req.url);
    const zone = searchParams.get("zone") || undefined;
    const locations = await WarehouseService.listLocations(zone);
    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    console.error("[API Locations GET]");
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
    const location = await WarehouseService.createLocation({ ...body, actorId: authPost.user.id! });
    return NextResponse.json({ success: true, data: location }, { status: 201 });
  } catch (error) {
    console.error("[API Locations POST]");
    return warehouseFailure(error);
  }
}
