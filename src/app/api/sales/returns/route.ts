import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SalesARService } from "@/services/sales-ar.service";
import { requireSession, requireRole } from "@/lib/route-guard";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const returns = await prisma.salesReturn.findMany({
      include: {
        customer: true,
        salesOrder: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { returnDate: "desc" },
    });
    return NextResponse.json({ success: true, data: returns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["DISPATCHER", "ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    const result = await SalesARService.processSalesReturn(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
