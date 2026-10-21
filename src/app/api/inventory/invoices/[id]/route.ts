import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const { id } = params;

    const invoice = await prisma.purchaseInvoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
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
                currentStock: true,
              },
            },
          },
          orderBy: { rawProductName: "asc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hóa đơn meInvoice với ID/Số: " + id },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (error: any) {
    console.error("[API Invoices GET by ID] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
