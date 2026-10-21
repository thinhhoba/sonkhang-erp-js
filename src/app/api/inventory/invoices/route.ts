import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const invoices = await prisma.purchaseInvoice.findMany({
      include: {
        items: {
          include: {
            mappedProduct: {
              select: {
                id: true,
                sku: true,
                name: true,
                baseUnit: true,
                weightKg: true,
                avgCostPrice: true,
              },
            },
          },
        },
      },
      orderBy: { invoiceDate: "desc" },
    });

    return NextResponse.json({ success: true, data: invoices });
  } catch (error: any) {
    console.error("[API Invoices GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
