import { NextResponse } from "next/server";
import { SalesCreditDomainError, SalesCreditService } from "@/services/sales-credit.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    if (body?.action !== "APPROVE" && body?.action !== "REJECT") {
      return NextResponse.json({ success: false, error: "Hành động duyệt không hợp lệ" }, { status: 400 });
    }
    const order = await SalesCreditService.decide(params.id, body.action, auth.user.id!, body.note);
    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    if (error instanceof SalesCreditDomainError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    console.error("Sales credit decision failed");
    return NextResponse.json({ success: false, error: "Không thể xử lý yêu cầu duyệt hạn mức" }, { status: 500 });
  }
}
