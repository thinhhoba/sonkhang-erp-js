import { NextResponse } from "next/server";
import { ProcurementService } from "@/services/procurement.service";
import { requireSession } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { id } = params;
    const order = await ProcurementService.getPurchaseOrderById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy đơn đặt hàng: " + id },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error("[API Purchase Order GET by ID] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
