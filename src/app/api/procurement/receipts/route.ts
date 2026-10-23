import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/route-guard";
import { canAccessProcurement, procurementErrorResponse } from "@/lib/procurement";

export const dynamic = "force-dynamic";

/** Read-only projection: the current schema has no goods-receipt entity. */
export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    if (!canAccessProcurement(auth.user.role, "receipts")) {
      return NextResponse.json({ success: false, error: "Không có quyền xem phiếu nhập" }, { status: 403 });
    }
    const receipts = await prisma.purchaseInvoice.findMany({
      where: { status: { in: ["IMPORTED_STOCK", "EXPORTED_MISA"] } },
      select: { id: true, invoiceNumber: true, invoiceSymbol: true, invoiceDate: true, supplierName: true, grandTotal: true, status: true, poId: true },
      orderBy: { invoiceDate: "desc" },
    });
    return NextResponse.json({
      success: true,
      data: receipts,
      meta: { readOnlyProjection: true, note: "Schema hiện chưa có thực thể Phiếu nhập; danh sách được suy chiếu từ hóa đơn đã nhập kho." },
    });
  } catch (error: any) {
    const failure = procurementErrorResponse(error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}
