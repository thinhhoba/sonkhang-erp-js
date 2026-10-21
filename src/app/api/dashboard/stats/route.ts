import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/route-guard";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const [
      ordersCount,
      waitingOrdersCount,
      approvedOrders,
      customers,
      trips,
      products,
      transactions,
      returnsCount,
      vehicles,
    ] = await Promise.all([
      prisma.salesOrder.count(),
      prisma.salesOrder.count({ where: { deliveryStatus: "WAITING_DISPATCH" } }),
      prisma.salesOrder.findMany({
        where: { deliveryStatus: { in: ["DELIVERED", "PARTIAL", "IN_TRANSIT"] } },
        select: { totalAmount: true, codAmountRequired: true },
      }),
      prisma.customer.findMany({
        select: { id: true, name: true, currentDebt: true, creditLimit: true, isBlocked: true },
      }),
      prisma.deliveryTrip.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { driver: true },
      }),
      prisma.product.findMany({
        select: { id: true, name: true, sku: true, currentStock: true, avgCostPrice: true },
      }),
      prisma.internalTransaction.findMany({
        where: { status: "APPROVED" },
      }),
      prisma.salesReturn.count(),
      prisma.vehicle.findMany({
        include: { assignedDriver: true },
      }),
    ]);

    // Financial calculations
    const totalRevenue = approvedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalArDebt = customers.reduce((sum, c) => sum + c.currentDebt, 0);
    const overCreditCustomers = customers.filter((c) => c.creditLimit > 0 && c.currentDebt > c.creditLimit);

    let cashFund = 0;
    let bankFund = 0;
    for (const t of transactions) {
      if (t.type === "RECEIPT") {
        if (t.paymentMethod === "CASH") cashFund += t.amount;
        else bankFund += t.amount;
      } else {
        if (t.paymentMethod === "CASH") cashFund -= t.amount;
        else bankFund -= t.amount;
      }
    }

    // Warehouse calculations
    const totalInventoryValue = products.reduce((sum, p) => sum + p.currentStock * p.avgCostPrice, 0);
    const lowStockProducts = products.filter((p) => p.currentStock < 50);

    // Pending actions
    const pendingOrdersApproval = await prisma.salesOrder.findMany({
      where: { requiresCreditApproval: true, creditApprovalStatus: "PENDING_APPROVAL" },
      take: 5,
    });

    const pendingExpenses = await prisma.internalTransaction.findMany({
      where: { status: "PENDING" },
      take: 5,
    });

    const waitingSettleTrips = await prisma.deliveryTrip.findMany({
      where: { status: "WAITING_SETTLE" },
      include: { driver: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalArDebt,
        cashFund,
        bankFund,
        totalFund: cashFund + bankFund,
        totalInventoryValue,
        ordersCount,
        waitingOrdersCount,
        overCreditCount: overCreditCustomers.length,
        lowStockCount: lowStockProducts.length,
        returnsCount,
        tripsCount: trips.length,
        vehiclesCount: vehicles.length,
        pendingOrdersApproval,
        pendingExpenses,
        waitingSettleTrips,
        recentTrips: trips,
        vehicles,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
