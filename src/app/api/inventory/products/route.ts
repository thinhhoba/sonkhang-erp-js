import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN", "WAREHOUSE"]);
    if (forbidden) return forbidden;
    const products = await prisma.product.findMany({
      orderBy: { sku: "asc" },
      select: auth.user.role === "WAREHOUSE" ? {
        id: true, sku: true, name: true, baseUnit: true, currentStock: true, inTransitStock: true,
        location: { select: { code: true, name: true } }, _count: { select: { inventoryLogs: true } },
      } : {
        id: true, sku: true, name: true, baseUnit: true, currentStock: true, inTransitStock: true, avgCostPrice: true,
        location: { select: { code: true, name: true } }, _count: { select: { inventoryLogs: true } },
      },
    });

    return NextResponse.json({ success: true, data: products });
  } catch {
    return NextResponse.json({ success: false, error: "Không thể tải danh mục sản phẩm" }, { status: 500 });
  }
}
