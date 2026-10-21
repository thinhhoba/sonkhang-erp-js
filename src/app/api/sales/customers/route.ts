import { NextResponse } from "next/server";
import { SalesARService } from "@/services/sales-ar.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const customers = await SalesARService.getCustomers(search);
    return NextResponse.json({ success: true, data: customers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["DISPATCHER", "ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    const customer = await SalesARService.upsertCustomer(body, body.id);
    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
