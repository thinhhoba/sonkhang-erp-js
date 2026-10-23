import { NextResponse } from "next/server";
import { LogisticsService } from "@/services/logistics.service";
import { requireSession, requireRole } from "@/lib/route-guard";
import { errorStatus } from "@/lib/http-errors";

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

    const stop = await LogisticsService.completeStop(params.id, params.stopId, {
      status: body.status,
      actualDeliveredKg: body.actualDeliveredKg,
      cashCollected: body.cashCollected,
      transferCollected: body.transferCollected,
      debtSigned: body.debtSigned,
      proofImageUrl: body.proofImageUrl,
      failOrPartialReason: body.failOrPartialReason,
      itemsReturned: body.itemsReturned,
    }, {
      id: auth.user.id!,
      role: auth.user.role,
    });

    return NextResponse.json({ success: true, data: stop });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể hoàn thành điểm giao";
    return NextResponse.json({ success: false, error: message }, { status: errorStatus(error) });
  }
}
