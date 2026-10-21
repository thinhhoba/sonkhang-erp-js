import { NextResponse } from "next/server";
import { SalesARService } from "@/services/sales-ar.service";
import { requireSession } from "@/lib/route-guard";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const customer = await SalesARService.getCustomerById(params.id);
    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 404 });
  }
}
