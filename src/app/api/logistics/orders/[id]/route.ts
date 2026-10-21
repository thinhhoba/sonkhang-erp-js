import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Chi tiết đơn chứa avgCostPrice → chỉ ACCOUNTANT/ADMIN.
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const { id } = params;

    const order = await prisma.salesOrder.findFirst({
      where: {
        OR: [{ id: id }, { orderCode: id }],
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                baseUnit: true,
                weightKg: true,
                avgCostPrice: true,
                currentStock: true,
              },
            },
          },
        },
        tripStops: {
          include: {
            trip: {
              include: {
                driver: {
                  select: {
                    id: true,
                    code: true,
                    fullName: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy đơn hàng!" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error("[API Order Detail GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
