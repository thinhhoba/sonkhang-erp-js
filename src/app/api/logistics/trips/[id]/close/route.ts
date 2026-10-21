import { NextResponse } from "next/server";
import { LogisticsService } from "@/services/logistics.service";
import { requireSession } from "@/lib/route-guard";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;

    // Khóa sổ kiểm tra cả 2 chốt cashSettledAt + returnStockSettledAt
    // bên trong PayrollService.settleAndCloseTrip; AuditLog ghi đúng người bấm.
    const trip = await LogisticsService.closeTrip(params.id, auth.user.id!);
    return NextResponse.json({ success: true, data: trip });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
