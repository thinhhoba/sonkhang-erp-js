import { NextResponse } from "next/server";
import { SalesCustomerDomainError, SalesCustomerService } from "@/services/sales-customer.service";
import { requireRole, requireSession } from "@/lib/route-guard";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession(); if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ADMIN", "ACCOUNTANT"]); if (forbidden) return forbidden;
    const customer = await prisma.customer.findUnique({ where: { id: params.id }, select: { id: true, customerCode: true, name: true, phone: true, email: true, address: true, district: true, ward: true, city: true, creditLimit: true, currentDebt: true, paymentTerms: true, maxOverdueDays: true, isBlocked: true, createdAt: true, updatedAt: true, salesOrders: { take: 10, orderBy: { orderDate: "desc" }, select: { id: true, orderCode: true, orderDate: true, totalAmount: true, deliveryStatus: true, codAmountRequired: true } }, salesReturns: { take: 10, orderBy: { returnDate: "desc" }, select: { id: true, returnCode: true, returnDate: true, status: true, reason: true, totalReturnAmount: true, arDeductionAmount: true } } } });
    if (!customer) return NextResponse.json({ success: false, error: "Không tìm thấy khách hàng" }, { status: 404 });
    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error("Sales customer detail failed");
    return NextResponse.json({ success: false, error: "Không thể tải khách hàng" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession(); if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ADMIN"]); if (forbidden) return forbidden;
    const customer = await SalesCustomerService.update(params.id, await req.json(), auth.user.id!);
    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof SalesCustomerDomainError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    console.error("Sales customer update failed");
    return NextResponse.json({ success: false, error: "Không thể cập nhật khách hàng" }, { status: 500 });
  }
}
