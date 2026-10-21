import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const orders = await prisma.salesOrder.findMany({
      where: {
        deliveryStatus: "WAITING_DISPATCH",
      },
      select: {
        id: true,
        orderCode: true,
        customerName: true,
        customerPhone: true,
        shippingAddress: true,
        totalWeightKg: true,
        codAmountRequired: true,
        totalAmount: true,
        orderDate: true,
      },
      orderBy: { orderDate: "asc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
