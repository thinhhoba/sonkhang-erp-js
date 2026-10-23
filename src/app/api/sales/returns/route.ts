import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    // A return exposes customer, AR and order amounts. The schema does not
    // contain an assignment relation, so this remains fail-closed for SALES.
    const forbidden = requireRole(auth.user, ["ADMIN", "ACCOUNTANT"]);
    if (forbidden) return forbidden;
    const returns = await prisma.salesReturn.findMany({
      select: {
        id: true, returnCode: true, tripCode: true, returnDate: true, reason: true,
        totalReturnAmount: true, arDeductionAmount: true, status: true, note: true,
        customer: { select: { id: true, customerCode: true, name: true } },
        salesOrder: { select: { id: true, orderCode: true, deliveryStatus: true } },
        items: { select: { id: true, productId: true, quantity: true, condition: true, actionTaken: true, reason: true, unitPrice: true, lineAmount: true, product: { select: { id: true, sku: true, name: true, baseUnit: true } } } },
      }, orderBy: { returnDate: "desc" }, take: 100,
    });
    return NextResponse.json({ success: true, data: returns });
  } catch (error) {
    console.error("Sales returns list failed");
    return NextResponse.json({ success: false, error: "Không thể tải danh sách hàng trả" }, { status: 500 });
  }
}

export async function POST() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const forbidden = requireRole(auth.user, ["ADMIN"]);
  if (forbidden) return forbidden;
  return NextResponse.json({ success: false, error: "FEATURE_REQUIRES_MIGRATION: Hàng trả được đối soát khi khóa chuyến" }, { status: 501 });
}
