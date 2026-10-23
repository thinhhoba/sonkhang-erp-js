import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/route-guard";
import { canAccessProcurement, procurementErrorResponse } from "@/lib/procurement";

export const dynamic = "force-dynamic";

/** Read-only receipt detail backed by the imported purchase-invoice source record. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    if (!canAccessProcurement(auth.user.role, "receipts")) {
      return NextResponse.json({ success: false, error: "Không có quyền xem phiếu nhập" }, { status: 403 });
    }
    const receipt = await prisma.purchaseInvoice.findFirst({
      where: { id: params.id, status: { in: ["IMPORTED_STOCK", "EXPORTED_MISA"] } },
      include: { items: { include: { mappedProduct: { select: { sku: true, name: true, baseUnit: true } } } } },
    });
    if (!receipt) return NextResponse.json({ success: false, error: "Không tìm thấy phiếu nhập suy chiếu" }, { status: 404 });
    return NextResponse.json({ success: true, data: receipt, meta: { readOnlyProjection: true } });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}
