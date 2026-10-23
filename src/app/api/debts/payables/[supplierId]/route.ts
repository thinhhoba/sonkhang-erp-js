import { NextResponse } from "next/server";
import { requireDebtApiAccess } from "@/lib/debt-route-guard";
import { DebtsService } from "@/services/debts.service";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { supplierId: string } }) {
  const auth = await requireDebtApiAccess("payable-detail");
  if ("error" in auth) return auth.error;
  const data = await DebtsService.payableById(params.supplierId);
  if (!data) return NextResponse.json({ success: false, error: "Không tìm thấy nhà cung cấp." }, { status: 404 });
  return NextResponse.json({ success: true, data });
}
