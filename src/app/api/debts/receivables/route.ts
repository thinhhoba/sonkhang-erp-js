import { NextResponse } from "next/server";
import { requireDebtApiAccess } from "@/lib/debt-route-guard";
import { DebtsService } from "@/services/debts.service";
import { parseDebtPagination } from "@/lib/debts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireDebtApiAccess("receivables");
  if ("error" in auth) return auth.error;
  const pagination = parseDebtPagination(new URL(request.url).searchParams);
  if (!pagination) return NextResponse.json({ success: false, error: "Tham số phân trang không hợp lệ." }, { status: 400 });
  const result = await DebtsService.receivables(pagination);
  return NextResponse.json({ success: true, data: result.items, pagination: result.pagination });
}
