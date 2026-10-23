import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/route-guard";
import { warehouseFailure } from "@/lib/warehouse-errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN", "WAREHOUSE"]);
    if (forbidden) return forbidden;
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    const where: any = {};
    if (productId) where.productId = productId;

    const ledgers = await prisma.inventoryLedger.findMany({
      where,
      include: {
        product: {
          select: {
            sku: true,
            name: true,
            baseUnit: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const data = auth.user.role === "WAREHOUSE" ? ledgers.map(({ unitCostAtTime, avgCostAfter, ...entry }) => entry) : ledgers;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return warehouseFailure(error, 500);
  }
}
