import { NextResponse } from "next/server";
import { MeInvoiceService } from "@/services/meinvoice.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    const { invoiceItemId, productId, conversionRate = 1 } = body;

    if (!invoiceItemId || !productId) {
      return NextResponse.json(
        { success: false, error: "Thiếu invoiceItemId hoặc productId" },
        { status: 400 }
      );
    }

    const updatedItem = await MeInvoiceService.mapItemProduct(
      invoiceItemId,
      productId,
      Number(conversionRate) || 1
    );

    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
