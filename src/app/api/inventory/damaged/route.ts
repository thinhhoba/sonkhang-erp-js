import { NextResponse } from "next/server";
import { WarehouseService } from "@/services/warehouse.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const issues = await WarehouseService.listWarehouseIssues(type);
    return NextResponse.json({ success: true, data: issues });
  } catch (error: any) {
    console.error("[API Damaged Issues GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authPost = await requireSession();
    if ("error" in authPost) return authPost.error;
    const forbidden = requireRole(authPost.user, ["DISPATCHER", "ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    const issue = await WarehouseService.createWarehouseIssue(body);
    return NextResponse.json({ success: true, data: issue }, { status: 201 });
  } catch (error: any) {
    console.error("[API Damaged Issues POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
