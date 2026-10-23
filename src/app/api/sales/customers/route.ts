import { NextResponse } from "next/server";
import { SalesCustomerDomainError, SalesCustomerService } from "@/services/sales-customer.service";
import { requireRole, requireSession } from "@/lib/route-guard";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireSession(); if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ADMIN", "ACCOUNTANT"]); if (forbidden) return forbidden;
    const search = new URL(req.url).searchParams.get("search") || undefined;
    const customers = await prisma.customer.findMany({ where: search ? { OR: [{ customerCode: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }, { phone: { contains: search, mode: "insensitive" } }] } : undefined, select: { id: true, customerCode: true, name: true, phone: true, email: true, address: true, district: true, ward: true, city: true, creditLimit: true, currentDebt: true, paymentTerms: true, maxOverdueDays: true, isBlocked: true, updatedAt: true, _count: { select: { salesOrders: true, salesReturns: true } } }, orderBy: { updatedAt: "desc" }, take: 100 });
    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error("Sales customers list failed");
    return NextResponse.json({ success: false, error: "Không thể tải danh sách khách hàng" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession(); if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ADMIN"]); if (forbidden) return forbidden;
    const body = await req.json();
    const customer = body?.id ? await SalesCustomerService.update(body.id, body, auth.user.id!) : await SalesCustomerService.create(body, auth.user.id!);
    return NextResponse.json({ success: true, data: customer }, { status: body?.id ? 200 : 201 });
  } catch (error) {
    if (error instanceof SalesCustomerDomainError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    console.error("Sales customer mutation failed");
    return NextResponse.json({ success: false, error: "Không thể lưu khách hàng" }, { status: 500 });
  }
}
