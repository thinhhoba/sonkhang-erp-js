import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { canAccessGlobalDashboard, dashboardCapabilities, hasPermission } from "@/lib/permissions";
import { requirePermission, requireSession } from "@/lib/route-guard";

/**
 * Dashboard data is selected by scope at the database boundary.  The current
 * schema has no department/assignment relation for SALES and WAREHOUSE, so
 * those roles deliberately receive no aggregate fallback until that scope is
 * modelled; returning all-company figures would be an authorization failure.
 */
export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const forbidden = requirePermission(auth.user, "dashboard:view");
    if (forbidden) return forbidden;

    const { role, id: employeeId } = auth.user;
    const capabilities = dashboardCapabilities(role);

    if (role === "DRIVER") {
      const trips = await prisma.deliveryTrip.findMany({
        where: { driverId: employeeId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          tripCode: true,
          status: true,
          vehiclePlate: true,
          departedAt: true,
          returnedAt: true,
        },
      });
      return NextResponse.json({
        success: true,
        data: { capabilities, ordersCount: 0, tripsCount: trips.length, recentTrips: trips },
      });
    }

    if (!canAccessGlobalDashboard(role)) {
      return NextResponse.json({
        success: true,
        data: { capabilities, restricted: true },
      });
    }

    const [ordersCount, waitingOrdersCount, trips, returnsCount, vehiclesCount] = await Promise.all([
      prisma.salesOrder.count(),
      prisma.salesOrder.count({ where: { deliveryStatus: "WAITING_DISPATCH" } }),
      prisma.deliveryTrip.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          tripCode: true,
          status: true,
          vehiclePlate: true,
          departedAt: true,
          returnedAt: true,
          driver: { select: { id: true, fullName: true, code: true } },
        },
      }),
      prisma.salesReturn.count(),
      prisma.vehicle.count(),
    ]);

    const data: Record<string, unknown> = {
      capabilities,
      ordersCount,
      waitingOrdersCount,
      returnsCount,
      tripsCount: trips.length,
      vehiclesCount,
      recentTrips: trips,
    };

    if (hasPermission(role, "inventory:view")) {
      const products = await prisma.product.findMany({ select: { currentStock: true } });
      data.lowStockCount = products.filter((product) => product.currentStock < 50).length;
    }

    if (capabilities.inventoryCost) {
      const productsWithCost = await prisma.product.findMany({
        select: { currentStock: true, avgCostPrice: true },
      });
      data.totalInventoryValue = productsWithCost.reduce(
        (sum, product) => sum + product.currentStock * product.avgCostPrice,
        0
      );
    }

    if (capabilities.finance) {
      const [approvedOrders, customers, transactions, pendingOrdersApproval, pendingExpenses, waitingSettleTrips] =
        await Promise.all([
          prisma.salesOrder.findMany({
            where: { deliveryStatus: { in: ["DELIVERED", "PARTIAL", "IN_TRANSIT"] } },
            select: { totalAmount: true },
          }),
          prisma.customer.findMany({ select: { currentDebt: true, creditLimit: true } }),
          prisma.internalTransaction.findMany({
            where: { status: "APPROVED" },
            select: { type: true, paymentMethod: true, amount: true },
          }),
          prisma.salesOrder.findMany({
            where: { requiresCreditApproval: true, creditApprovalStatus: "PENDING_APPROVAL" },
            take: 5,
          }),
          prisma.internalTransaction.findMany({ where: { status: "PENDING" }, take: 5 }),
          prisma.deliveryTrip.findMany({
            where: { status: "WAITING_SETTLE" },
            select: {
              id: true,
              tripCode: true,
              status: true,
              totalCashCollected: true,
              driver: { select: { id: true, fullName: true, code: true } },
            },
          }),
        ]);

      let cashFund = 0;
      let bankFund = 0;
      for (const transaction of transactions) {
        const signedAmount = transaction.type === "RECEIPT" ? transaction.amount : -transaction.amount;
        if (transaction.paymentMethod === "CASH") cashFund += signedAmount;
        else bankFund += signedAmount;
      }

      data.totalRevenue = approvedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      data.totalArDebt = customers.reduce((sum, customer) => sum + customer.currentDebt, 0);
      data.overCreditCount = customers.filter(
        (customer) => customer.creditLimit > 0 && customer.currentDebt > customer.creditLimit
      ).length;
      data.cashFund = cashFund;
      data.bankFund = bankFund;
      data.totalFund = cashFund + bankFund;
      data.pendingOrdersApproval = pendingOrdersApproval;
      data.pendingExpenses = pendingExpenses;
      data.waitingSettleTrips = waitingSettleTrips;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể tải dữ liệu tổng quan";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
