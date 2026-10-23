import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
  overview: vi.fn(),
  receivables: vi.fn(),
  receivableById: vi.fn(),
  payables: vi.fn(),
  payableById: vi.fn(),
  aging: vi.fn(),
  creditLimits: vi.fn(),
}));

vi.mock("@/lib/route-guard", () => ({ requireSession: mocks.requireSession }));
vi.mock("@/services/debts.service", () => ({
  DebtsService: {
    overview: mocks.overview,
    receivables: mocks.receivables,
    receivableById: mocks.receivableById,
    payables: mocks.payables,
    payableById: mocks.payableById,
    aging: mocks.aging,
    creditLimits: mocks.creditLimits,
  },
}));

import { GET as getOverview } from "@/app/api/debts/overview/route";
import { GET as getReceivables } from "@/app/api/debts/receivables/route";
import { GET as getReceivable } from "@/app/api/debts/receivables/[customerId]/route";
import { GET as getPayables } from "@/app/api/debts/payables/route";
import { GET as getPayable } from "@/app/api/debts/payables/[supplierId]/route";
import { GET as getAging } from "@/app/api/debts/aging/route";
import { GET as getCreditLimits } from "@/app/api/debts/credit-limits/route";

const request = (path: string) => new Request(`http://localhost${path}`);

const unauthorized = () => ({
  error: NextResponse.json({ success: false, error: "Chưa đăng nhập!" }, { status: 401 }),
});
const session = (role: string) => ({ user: { id: "employee-1", role, isActive: true } });

describe("debt route authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.overview.mockResolvedValue({ receivables: {}, payables: null });
    mocks.receivables.mockResolvedValue([]);
    mocks.receivableById.mockResolvedValue({ id: "customer-1" });
    mocks.payables.mockResolvedValue([]);
    mocks.payableById.mockResolvedValue({ id: "supplier-1" });
    mocks.aging.mockResolvedValue({ items: [], pagination: {} });
    mocks.creditLimits.mockResolvedValue({ items: [], pagination: {} });
  });

  it("returns 401 on overview, lists and detail routes before querying debt services", async () => {
    mocks.requireSession.mockImplementation(async () => unauthorized());
    const responses = await Promise.all([
      getOverview(), getReceivables(request("/api/debts/receivables")),
      getPayables(request("/api/debts/payables")),
      getReceivable(new Request("http://localhost/api/debts/receivables/customer-1"), { params: { customerId: "customer-1" } }),
      getPayable(new Request("http://localhost/api/debts/payables/supplier-1"), { params: { supplierId: "supplier-1" } }),
      getAging(request("/api/debts/aging")),
      getCreditLimits(request("/api/debts/credit-limits")),
    ]);
    expect(responses.map((response) => response.status)).toEqual([401, 401, 401, 401, 401, 401, 401]);
    expect(mocks.overview).not.toHaveBeenCalled();
    expect(mocks.receivables).not.toHaveBeenCalled();
    expect(mocks.payables).not.toHaveBeenCalled();
    expect(mocks.receivableById).not.toHaveBeenCalled();
    expect(mocks.payableById).not.toHaveBeenCalled();
    expect(mocks.aging).not.toHaveBeenCalled();
    expect(mocks.creditLimits).not.toHaveBeenCalled();
  });

  it("denies SALES access to payable list and detail without calling services", async () => {
    mocks.requireSession.mockResolvedValue(session("SALES"));
    const list = await getPayables(request("/api/debts/payables"));
    const detail = await getPayable(new Request("http://localhost/api/debts/payables/supplier-1"), { params: { supplierId: "supplier-1" } });
    expect(list.status).toBe(403);
    expect(detail.status).toBe(403);
    expect(mocks.payables).not.toHaveBeenCalled();
    expect(mocks.payableById).not.toHaveBeenCalled();
  });

  it("fails closed for an unknown role before any overview query", async () => {
    mocks.requireSession.mockResolvedValue(session("UNKNOWN"));
    const response = await getOverview();
    expect(response.status).toBe(403);
    expect(mocks.overview).not.toHaveBeenCalled();
  });

  it("fails closed on aging and credit limits before querying services", async () => {
    mocks.requireSession.mockResolvedValue(session("UNKNOWN"));
    const responses = await Promise.all([
      getAging(request("/api/debts/aging")),
      getCreditLimits(request("/api/debts/credit-limits")),
    ]);
    expect(responses.map((response) => response.status)).toEqual([403, 403]);
    expect(mocks.aging).not.toHaveBeenCalled();
    expect(mocks.creditLimits).not.toHaveBeenCalled();
  });

  it("gives SALES an AR-only overview with no AP query", async () => {
    mocks.requireSession.mockResolvedValue(session("SALES"));
    const response = await getOverview();
    expect(response.status).toBe(200);
    expect(mocks.overview).toHaveBeenCalledWith(false);
    await expect(response.json()).resolves.toMatchObject({ data: { payables: null } });
  });
});

describe("aging route date validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireSession.mockResolvedValue(session("ACCOUNTANT"));
    mocks.aging.mockResolvedValue({ items: [], pagination: {} });
  });

  it.each(["2026-2-03", "2026-02-29", "2026-01-01T00:00:00Z", "not-a-date"])(
    "rejects invalid or non-strict asOf value %s",
    async (asOf) => {
      const response = await getAging(new Request(`http://localhost/api/debts/aging?asOf=${encodeURIComponent(asOf)}`));
      expect(response.status).toBe(400);
      expect(mocks.aging).not.toHaveBeenCalled();
    }
  );

  it("accepts a real YYYY-MM-DD calendar date", async () => {
    const response = await getAging(new Request("http://localhost/api/debts/aging?asOf=2024-02-29"));
    expect(response.status).toBe(200);
    expect(mocks.aging).toHaveBeenCalledWith(
      { page: 1, limit: 20 },
      new Date("2024-02-29T00:00:00.000Z")
    );
  });

  it.each([
    [getAging, "/api/debts/aging?limit=101"],
    [getAging, "/api/debts/aging?page=0"],
    [getCreditLimits, "/api/debts/credit-limits?limit=abc"],
  ])("rejects invalid pagination before querying services", async (handler, path) => {
    const response = await handler(request(path));
    expect(response.status).toBe(400);
    expect(mocks.aging).not.toHaveBeenCalled();
    expect(mocks.creditLimits).not.toHaveBeenCalled();
  });

  it("passes validated pagination to credit-limit service", async () => {
    mocks.creditLimits.mockResolvedValue({ items: [], pagination: { page: 2, limit: 50, total: 0 } });
    const response = await getCreditLimits(request("/api/debts/credit-limits?page=2&limit=50"));
    expect(response.status).toBe(200);
    expect(mocks.creditLimits).toHaveBeenCalledWith({ page: 2, limit: 50 });
  });
});
