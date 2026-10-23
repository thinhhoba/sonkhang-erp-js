import { NextResponse } from "next/server";
import { WarehouseService } from "@/services/warehouse.service";
import { requireSession, requireRole } from "@/lib/route-guard";
import { warehouseFailure } from "@/lib/warehouse-errors";
import { redactWarehouseValuation } from "@/lib/warehouse-serialization";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ADMIN", "ACCOUNTANT", "WAREHOUSE"]);
    if (forbidden) return forbidden;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const issues = await WarehouseService.listWarehouseIssues(type);
    return NextResponse.json({ success: true, data: redactWarehouseValuation(issues, auth.user.role) });
  } catch (error) {
    console.error("[API Damaged Issues GET]");
    return warehouseFailure(error, 500);
  }
}

export async function POST(req: Request) {
  try {
    const authPost = await requireSession();
    if ("error" in authPost) return authPost.error;
    const forbidden = requireRole(authPost.user, ["WAREHOUSE", "ADMIN"]);
    if (forbidden) return forbidden;
    // WarehouseIssue has no requester/approver split or approval state in the
    // current schema. CONFIRMED cannot safely impersonate approval.
    return NextResponse.json({ success: false, error: "FEATURE_REQUIRES_MIGRATION: Phiếu xuất hủy chỉ đọc cho đến khi có quy trình phê duyệt" }, { status: 501 });
  } catch (error) {
    console.error("[API Damaged Issues POST]");
    return warehouseFailure(error);
  }
}
