import { NextResponse } from "next/server";
import { requireDebtApiAccess } from "@/lib/debt-route-guard";
import { DebtsService } from "@/services/debts.service";
import { parseDebtPagination, parseIsoDateOnly } from "@/lib/debts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireDebtApiAccess("aging");
  if ("error" in auth) return auth.error;
  const searchParams = new URL(request.url).searchParams;
  const pagination = parseDebtPagination(searchParams);
  if (!pagination) return NextResponse.json({ success: false, error: "Tham số phân trang không hợp lệ." }, { status: 400 });
  const requestedDate = searchParams.get("asOf");
  const asOf = requestedDate ? parseIsoDateOnly(requestedDate) : new Date();
  if (!asOf) {
    return NextResponse.json({ success: false, error: "Ngày chốt tuổi nợ không hợp lệ." }, { status: 400 });
  }
  const result = await DebtsService.aging(pagination, asOf);
  return NextResponse.json({
    success: true,
    data: result.items,
    pagination: result.pagination,
    meta: { asOf: asOf.toISOString(), projection: true },
  });
}
