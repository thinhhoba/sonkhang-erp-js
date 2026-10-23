import { NextResponse } from "next/server";
import { requireDebtApiAccess } from "@/lib/debt-route-guard";
import { DebtsService } from "@/services/debts.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireDebtApiAccess("overview");
  if ("error" in auth) return auth.error;
  const data = await DebtsService.overview(auth.user.role !== "SALES");
  return NextResponse.json({ success: true, data });
}
