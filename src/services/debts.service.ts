import prisma from "@/lib/prisma";
import { legacyMoneyToVnd, projectAging, serializeVnd, type DebtPagination } from "@/lib/debts";

const salesOrderProjection = {
  id: true, orderCode: true, totalAmount: true, codAmountRequired: true,
  deliveryStatus: true, orderDate: true,
} as const;
const SUMMARY_BATCH_SIZE = 250;

function vnd(value: number, field: string): string {
  return serializeVnd(legacyMoneyToVnd(value, field));
}

function pageResult<T>(items: T[], total: number, options: DebtPagination) {
  return {
    items,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
      hasNextPage: options.page * options.limit < total,
    },
  };
}

const customerListSelect = {
  id: true, customerCode: true, name: true, phone: true, district: true,
  creditLimit: true, currentDebt: true, paymentTerms: true, maxOverdueDays: true,
  isBlocked: true, updatedAt: true,
  _count: { select: { salesOrders: true } },
  salesOrders: {
    where: { deliveryStatus: { not: "CANCELLED" } },
    select: { orderDate: true, deliveryStatus: true },
    orderBy: { orderDate: "asc" as const },
    take: 1,
  },
} as const;

function mapCustomerRow(row: any) {
  const { salesOrders, _count, creditLimit, currentDebt, ...customer } = row;
  return {
    ...customer,
    creditLimitVnd: vnd(creditLimit, "Customer.creditLimit"),
    currentDebtVnd: vnd(currentDebt, "Customer.currentDebt"),
    oldestOrderDate: salesOrders[0]?.orderDate || null,
    orderCount: _count.salesOrders,
    balanceSource: "CACHED_CUSTOMER_BALANCE" as const,
  };
}

/** Read-only projections over legacy cached balances; no AR/AP ledger is implied. */
export class DebtsService {
  static async receivables(options: DebtPagination) {
    const [total, customers] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.findMany({
        select: customerListSelect,
        orderBy: [{ currentDebt: "desc" }, { name: "asc" }, { id: "asc" }],
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
    ]);
    return pageResult(customers.map(mapCustomerRow), total, options);
  }

  static async receivableById(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true, customerCode: true, name: true, phone: true, email: true, address: true,
        district: true, city: true, creditLimit: true, currentDebt: true, paymentTerms: true,
        maxOverdueDays: true, isBlocked: true, updatedAt: true,
        salesOrders: { select: salesOrderProjection, orderBy: { orderDate: "desc" }, take: 50 },
        salesReturns: {
          select: { id: true, returnCode: true, returnDate: true, arDeductionAmount: true, status: true },
          orderBy: { returnDate: "desc" }, take: 50,
        },
      },
    });
    if (!customer) return null;
    const { creditLimit, currentDebt, salesOrders, salesReturns, ...rest } = customer;
    return {
      ...rest,
      creditLimitVnd: vnd(creditLimit, "Customer.creditLimit"),
      currentDebtVnd: vnd(currentDebt, "Customer.currentDebt"),
      salesOrders: salesOrders.map(({ totalAmount, codAmountRequired, ...order }) => ({
        ...order,
        totalAmountVnd: vnd(totalAmount, "SalesOrder.totalAmount"),
        codAmountRequiredVnd: vnd(codAmountRequired, "SalesOrder.codAmountRequired"),
      })),
      salesReturns: salesReturns.map(({ arDeductionAmount, ...item }) => ({
        ...item,
        arDeductionAmountVnd: vnd(arDeductionAmount, "SalesReturn.arDeductionAmount"),
      })),
      balanceSource: "CACHED_CUSTOMER_BALANCE" as const,
    };
  }

  static async payables(options: DebtPagination) {
    const [total, suppliers] = await Promise.all([
      prisma.supplier.count(),
      prisma.supplier.findMany({
        select: {
          id: true, code: true, name: true, taxCode: true, contactPerson: true, phone: true,
          paymentTerms: true, creditLimit: true, currentDebt: true, isActive: true, updatedAt: true,
          _count: { select: { purchaseOrders: true } },
          purchaseOrders: { select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 },
        },
        orderBy: [{ currentDebt: "desc" }, { name: "asc" }, { id: "asc" }],
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
    ]);
    const items = suppliers.map(({ purchaseOrders, _count, creditLimit, currentDebt, ...supplier }) => ({
      ...supplier,
      creditLimitVnd: vnd(creditLimit, "Supplier.creditLimit"),
      currentDebtVnd: vnd(currentDebt, "Supplier.currentDebt"),
      oldestPurchaseOrderDate: purchaseOrders[0]?.createdAt || null,
      orderCount: _count.purchaseOrders,
      balanceSource: "CACHED_SUPPLIER_BALANCE" as const,
    }));
    return pageResult(items, total, options);
  }

  static async payableById(supplierId: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: {
        id: true, code: true, name: true, taxCode: true, contactPerson: true, phone: true, email: true,
        address: true, paymentTerms: true, creditLimit: true, currentDebt: true, bankName: true,
        bankAccount: true, isActive: true, updatedAt: true,
        purchaseOrders: {
          select: { id: true, poCode: true, status: true, totalAmount: true, vatAmount: true, grandTotal: true, expectedDeliveryDate: true, createdAt: true },
          orderBy: { createdAt: "desc" }, take: 50,
        },
      },
    });
    if (!supplier) return null;
    const { creditLimit, currentDebt, purchaseOrders, ...rest } = supplier;
    return {
      ...rest,
      creditLimitVnd: vnd(creditLimit, "Supplier.creditLimit"),
      currentDebtVnd: vnd(currentDebt, "Supplier.currentDebt"),
      purchaseOrders: purchaseOrders.map(({ totalAmount, vatAmount, grandTotal, ...order }) => ({
        ...order,
        totalAmountVnd: vnd(totalAmount, "PurchaseOrder.totalAmount"),
        vatAmountVnd: vnd(vatAmount, "PurchaseOrder.vatAmount"),
        grandTotalVnd: vnd(grandTotal, "PurchaseOrder.grandTotal"),
      })),
      balanceSource: "CACHED_SUPPLIER_BALANCE" as const,
    };
  }

  static async aging(options: DebtPagination, asOf: Date = new Date()) {
    const where = { currentDebt: { gt: 0 } } as const;
    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        select: customerListSelect,
        orderBy: [{ currentDebt: "desc" }, { name: "asc" }, { id: "asc" }],
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
    ]);
    const items = customers.map(mapCustomerRow).map((row) => projectAging({
      id: row.id, code: row.customerCode, name: row.name, balanceVnd: row.currentDebtVnd,
      paymentTerms: row.paymentTerms, orderDate: row.oldestOrderDate,
    }, asOf));
    return pageResult(items, total, options);
  }

  static async creditLimits(options: DebtPagination) {
    const page = await this.receivables(options);
    return {
      ...page,
      items: page.items.map((row) => {
        const limit = BigInt(row.creditLimitVnd);
        const debt = BigInt(row.currentDebtVnd);
        return {
          id: row.id, customerCode: row.customerCode, name: row.name, district: row.district,
          creditLimitVnd: row.creditLimitVnd, currentDebtVnd: row.currentDebtVnd,
          remainingCreditVnd: limit > BigInt(0) ? serializeVnd(limit - debt) : null,
          utilizationPercent: limit > BigInt(0) ? ((debt * BigInt(100)) / limit).toString(10) : null,
          isBlocked: row.isBlocked, balanceSource: row.balanceSource,
        };
      }),
    };
  }

  static async overview(includePayables: boolean) {
    let customerCursor: string | undefined;
    let supplierCursor: string | undefined;
    let receivableBalance = BigInt(0);
    let payableBalance = BigInt(0);
    let counterparties = 0;
    let blocked = 0;
    let overLimit = 0;
    let projectedPastDue = 0;
    let payableCounterparties = 0;
    const now = new Date();

    do {
      const rows = await prisma.customer.findMany({
        select: customerListSelect,
        orderBy: { id: "asc" }, take: SUMMARY_BATCH_SIZE,
        ...(customerCursor ? { cursor: { id: customerCursor }, skip: 1 } : {}),
      });
      for (const raw of rows) {
        const row = mapCustomerRow(raw);
        const debt = BigInt(row.currentDebtVnd);
        const limit = BigInt(row.creditLimitVnd);
        receivableBalance += debt;
        counterparties += 1;
        if (row.isBlocked) blocked += 1;
        if (limit > BigInt(0) && debt > limit) overLimit += 1;
        if (debt > BigInt(0) && projectAging({ id: row.id, code: row.customerCode, name: row.name, balanceVnd: row.currentDebtVnd, paymentTerms: row.paymentTerms, orderDate: row.oldestOrderDate }, now).daysPastDue > 0) projectedPastDue += 1;
      }
      customerCursor = rows.length === SUMMARY_BATCH_SIZE ? rows[rows.length - 1].id : undefined;
    } while (customerCursor);

    if (includePayables) {
      do {
        const rows = await prisma.supplier.findMany({
          select: { id: true, currentDebt: true }, orderBy: { id: "asc" }, take: SUMMARY_BATCH_SIZE,
          ...(supplierCursor ? { cursor: { id: supplierCursor }, skip: 1 } : {}),
        });
        for (const row of rows) {
          payableBalance += legacyMoneyToVnd(row.currentDebt, "Supplier.currentDebt");
          payableCounterparties += 1;
        }
        supplierCursor = rows.length === SUMMARY_BATCH_SIZE ? rows[rows.length - 1].id : undefined;
      } while (supplierCursor);
    }

    return {
      sourceNotice: "Số dư là cached balance từ danh mục đối tác, không phải sổ AR/AP hay payment allocation.",
      receivables: { counterparties, balanceVnd: serializeVnd(receivableBalance), blocked, overLimit, projectedPastDue },
      payables: includePayables ? { counterparties: payableCounterparties, balanceVnd: serializeVnd(payableBalance) } : null,
      aggregation: { complete: true, batchSize: SUMMARY_BATCH_SIZE },
    };
  }
}
