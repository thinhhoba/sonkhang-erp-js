import { NextResponse } from "next/server";
import { InventoryService } from "@/services/inventory.service";
import { requireSession, requireRole } from "@/lib/route-guard";
import { procurementErrorResponse } from "@/lib/procurement";

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: "Thiếu invoiceId" },
        { status: 400 }
      );
    }

    const updatedInvoice = await InventoryService.importPurchaseInvoiceToStock(invoiceId, auth.user.id!);

    return NextResponse.json({ success: true, data: updatedInvoice });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}
