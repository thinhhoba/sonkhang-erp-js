import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  customerFindMany: vi.fn(),
  supplierFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    customer: { findMany: prismaMocks.customerFindMany },
    supplier: { findMany: prismaMocks.supplierFindMany },
  },
}));

import { DebtsService } from "@/services/debts.service";

const customer = (id: string) => ({
  id,
  customerCode: `KH-${id}`,
  name: `Khách ${id}`,
  phone: null,
  district: null,
  creditLimit: 10,
  currentDebt: 1,
  paymentTerms: "NET30",
  maxOverdueDays: 30,
  isBlocked: false,
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  _count: { salesOrders: 0 },
  salesOrders: [],
});

describe("debt overview batching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates every customer across cursor batches without truncating totals", async () => {
    const first = Array.from({ length: 250 }, (_, index) => customer(String(index).padStart(3, "0")));
    prismaMocks.customerFindMany
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce([customer("250")]);

    const result = await DebtsService.overview(false);

    expect(prismaMocks.customerFindMany).toHaveBeenCalledTimes(2);
    expect(prismaMocks.customerFindMany.mock.calls[1][0]).toMatchObject({
      cursor: { id: "249" },
      skip: 1,
      take: 250,
    });
    expect(result.receivables.counterparties).toBe(251);
    expect(result.receivables.balanceVnd).toBe("251");
    expect(result.aggregation.complete).toBe(true);
    expect(prismaMocks.supplierFindMany).not.toHaveBeenCalled();
  });
});
