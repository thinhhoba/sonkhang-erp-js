import { NextResponse } from "next/server";
import { LogisticsService } from "@/services/logistics.service";
import { requireSession, requireRole } from "@/lib/route-guard";
import { errorStatus } from "@/lib/http-errors";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["DRIVER", "ADMIN", "DISPATCHER"]);
    if (forbidden) return forbidden;

    const trip = await LogisticsService.departTrip(params.id, {
      id: auth.user.id!,
      role: auth.user.role,
    });
    return NextResponse.json({ success: true, data: trip });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể xuất phát chuyến xe";
    return NextResponse.json({ success: false, error: message }, { status: errorStatus(error) });
  }
}
