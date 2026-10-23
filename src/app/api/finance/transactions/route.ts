import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/route-guard";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requireRole(auth.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // RECEIPT | PAYMENT
    const status = searchParams.get("status"); // PENDING | APPROVED | REJECTED

    const where: any = {};
    if (type && type !== "ALL") where.type = type;
    if (status && status !== "ALL") where.status = status;

    const transactions = await prisma.internalTransaction.findMany({
      where,
      orderBy: { transactionDate: "desc" },
    });

    // Calculate cash and bank balances from approved transactions
    const allApproved = await prisma.internalTransaction.findMany({
      where: { status: "APPROVED" },
    });

    let cashBalance = 0;
    let bankBalance = 0;
    let totalReceipts = 0;
    let totalPayments = 0;

    for (const t of allApproved) {
      if (t.type === "RECEIPT") {
        totalReceipts += t.amount;
        if (t.paymentMethod === "CASH") cashBalance += t.amount;
        else bankBalance += t.amount;
      } else if (t.type === "PAYMENT") {
        totalPayments += t.amount;
        if (t.paymentMethod === "CASH") cashBalance -= t.amount;
        else bankBalance -= t.amount;
      }
    }

    const pendingCount = await prisma.internalTransaction.count({
      where: { status: "PENDING" },
    });

    return NextResponse.json({
      success: true,
      data: transactions,
      summary: {
        cashBalance,
        bankBalance,
        totalBalance: cashBalance + bankBalance,
        totalReceipts,
        totalPayments,
        pendingCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const authPost = await requireSession();
    if ("error" in authPost) return authPost.error;
    const forbidden = requireRole(authPost.user, ["ACCOUNTANT", "ADMIN"]);
    if (forbidden) return forbidden;
    const body = await req.json();
    const {
      type, // RECEIPT | PAYMENT
      category,
      amount,
      paymentMethod,
      recipientOrPayer,
      submittedById,
      submittedByName,
      note,
      attachmentUrl,
    } = body;

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = type === "RECEIPT" ? "PT" : "PC";
    const count = await prisma.internalTransaction.count({
      where: { voucherCode: { startsWith: `${prefix}-${todayStr}` } },
    });
    const voucherCode = `${prefix}-${todayStr}-${String(count + 1).padStart(3, "0")}`;

    const transaction = await prisma.internalTransaction.create({
      data: {
        voucherCode,
        type: type || "PAYMENT",
        category: category || "OTHER",
        amount: Number(amount) || 0,
        paymentMethod: paymentMethod || "CASH",
        recipientOrPayer: recipientOrPayer || "Nhân viên đề xuất",
        submittedById,
        submittedByName: submittedByName || "Kế toán / Nhân viên",
        status: "PENDING",
        note,
        attachmentUrl,
        transactionDate: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: transaction });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
