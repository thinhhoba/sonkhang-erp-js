import { NextResponse } from "next/server";
import { SalesARService } from "@/services/sales-ar.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    const { action, note, employeeId } = body;

    if (action === "REJECT") {
      const order = await SalesARService.rejectCreditException(
        params.id,
        employeeId || "GIAM_DOC",
        note || "Từ chối duyệt vượt hạn mức công nợ"
      );
      return NextResponse.json({ success: true, data: order });
    }

    const order = await SalesARService.approveCreditException(
      params.id,
      employeeId || "GIAM_DOC",
      note || "Giám đốc phê duyệt cho phép xuất hàng dù vượt hạn mức công nợ"
    );
    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
