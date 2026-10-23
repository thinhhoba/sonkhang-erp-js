import { NextResponse } from "next/server";
import { requireDebtApiAccess } from "@/lib/debt-route-guard";
import { DebtsService } from "@/services/debts.service";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { customerId: string } }) {
  const auth = await requireDebtApiAccess("receivable-detail");
  if ("error" in auth) return auth.error;
  const data = await DebtsService.receivableById(params.customerId);
  if (!data) return NextResponse.json({ success: false, error: "Không tìm thấy khách hàng." }, { status: 404 });
  return NextResponse.json({ success: true, data });
}
