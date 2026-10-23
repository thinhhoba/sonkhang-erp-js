import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/route-guard";
import { procurementErrorResponse } from "@/lib/procurement";

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
    const failure = procurementErrorResponse(error);
    console.error("[API Invoices GET]", failure.error);
    return NextResponse.json({ success: false, error: failure.error }, { status: failure.status });
  }
}
