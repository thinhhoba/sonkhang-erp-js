import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ADMIN", "ACCOUNTANT"]);
    if (forbidden) return forbidden;
    const order = await prisma.salesOrder.findUnique({
      where: { id: params.id },
      select: { id: true, orderCode: true, customerName: true, customerPhone: true, shippingAddress: true, totalWeightKg: true, totalAmount: true, codAmountRequired: true, deliveryStatus: true, misaSyncStatus: true, requiresCreditApproval: true, creditApprovalStatus: true, creditApprovalNote: true, orderDate: true, customer: { select: { id: true, customerCode: true, name: true, phone: true, address: true } }, items: { select: { id: true, productId: true, orderedQty: true, deliveredQty: true, returnedQty: true, unitPrice: true, lineAmount: true, lineWeightKg: true, product: { select: { id: true, sku: true, name: true, baseUnit: true, weightKg: true } } } } },
    });
    if (!order) return NextResponse.json({ success: false, error: "Không tìm thấy đơn hàng" }, { status: 404 });
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Sales order detail failed");
    return NextResponse.json({ success: false, error: "Không thể tải đơn hàng" }, { status: 500 });
  }
}
