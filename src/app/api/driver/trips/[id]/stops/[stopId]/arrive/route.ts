import { NextResponse } from "next/server";
import { LogisticsService } from "@/services/logistics.service";
import { requireSession, requireRole } from "@/lib/route-guard";
import { errorStatus } from "@/lib/http-errors";

export async function POST(
  req: Request,
  { params }: { params: { id: string; stopId: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["DRIVER", "ADMIN", "DISPATCHER"]);
    if (forbidden) return forbidden;

    const stop = await LogisticsService.arriveAtStop(params.id, params.stopId, {
      id: auth.user.id!,
      role: auth.user.role,
    });
    return NextResponse.json({ success: true, data: stop });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể cập nhật điểm giao";
    return NextResponse.json({ success: false, error: message }, { status: errorStatus(error) });
  }
}
