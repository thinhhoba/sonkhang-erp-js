import { NextResponse } from "next/server";
import { LogisticsService } from "@/services/logistics.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    // Chỉ Thủ kho hoặc Admin được xác nhận nhận hàng hoàn. Điều phối không
    // được ghi checkpoint kho hay tạo audit thay Thủ kho.
    const forbidden = requireRole(auth.user, ["WAREHOUSE", "ADMIN"]);
    if (forbidden) return forbidden;

    const trip = await LogisticsService.settleReturnStock(params.id, auth.user.id!);
    return NextResponse.json({ success: true, data: trip });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
