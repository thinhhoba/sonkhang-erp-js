import { NextResponse } from "next/server";
import { LogisticsService } from "@/services/logistics.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export async function POST(
  req: Request,
  { params }: { params: { id: string; stopId: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["DRIVER", "ADMIN", "DISPATCHER"]);
    if (forbidden) return forbidden;

    const stop = await LogisticsService.arriveAtStop(params.stopId);
    return NextResponse.json({ success: true, data: stop });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
