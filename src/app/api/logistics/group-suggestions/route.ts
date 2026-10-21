import { NextResponse } from "next/server";
import { SalesARService } from "@/services/sales-ar.service";
import { requireSession } from "@/lib/route-guard";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const suggestions = await SalesARService.suggestDeliveryTripGroups();
    return NextResponse.json({ success: true, data: suggestions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
