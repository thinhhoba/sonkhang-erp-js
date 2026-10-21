import { NextResponse } from "next/server";
import { LogisticsService } from "@/services/logistics.service";
import { requireSession, requireRole } from "@/lib/route-guard";

// Endpoint chuẩn hoàn thành điểm giao:
// POST /api/driver/trips/[id]/stops/[stopId]/complete
export async function POST(
  req: Request,
  { params }: { params: { id: string; stopId: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["DRIVER", "ADMIN", "DISPATCHER"]);
    if (forbidden) return forbidden;

    const body = await req.json();

    const stop = await LogisticsService.completeStop(params.stopId, {
      status: body.status,
      actualDeliveredKg: body.actualDeliveredKg,
      cashCollected: body.cashCollected,
      transferCollected: body.transferCollected,
      debtSigned: body.debtSigned,
      proofImageUrl: body.proofImageUrl,
      failOrPartialReason: body.failOrPartialReason,
      itemsReturned: body.itemsReturned,
    });

    return NextResponse.json({ success: true, data: stop });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
