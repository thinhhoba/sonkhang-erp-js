import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ADMIN", "ACCOUNTANT"]);
    if (forbidden) return forbidden;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const query = searchParams.get("q")?.trim();

    const whereClause: any = {};

    if (status && status !== "ALL") {
      whereClause.deliveryStatus = status;
    }

    if (query) {
      whereClause.OR = [
        { orderCode: { contains: query, mode: "insensitive" } },
        { customerName: { contains: query, mode: "insensitive" } },
        { customerPhone: { contains: query, mode: "insensitive" } },
        { shippingAddress: { contains: query, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.salesOrder.findMany({
      where: whereClause,
      select: {
        id: true, orderCode: true, customerName: true, customerPhone: true,
        shippingAddress: true, totalWeightKg: true, totalAmount: true,
        codAmountRequired: true, deliveryStatus: true, misaSyncStatus: true,
        requiresCreditApproval: true, creditApprovalStatus: true, orderDate: true,
        items: {
          select: { id: true, orderedQty: true, deliveredQty: true, returnedQty: true, unitPrice: true, lineAmount: true,
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                baseUnit: true,
                weightKg: true,
              },
            },
          } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error("Sales orders list failed");
    return NextResponse.json(
      { success: false, error: "Không thể tải danh sách đơn hàng" },
      { status: 500 }
    );
  }
}
