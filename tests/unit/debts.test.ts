import { describe, expect, it } from "vitest";
import { agingBucketForDaysPastDue, canAccessDebtSurface, legacyMoneyToVnd, parseIsoDateOnly, paymentTermDays, projectAging, serializeVnd } from "@/lib/debts";

describe("debt surface permissions", () => {
  it("keeps supplier payables inaccessible to sales", () => {
    expect(canAccessDebtSurface("SALES", "receivables")).toBe(true);
    expect(canAccessDebtSurface("SALES", "credit-limits")).toBe(true);
    expect(canAccessDebtSurface("SALES", "payables")).toBe(false);
    expect(canAccessDebtSurface("SALES", "payable-detail")).toBe(false);
  });

  it("fails closed for unknown roles and permits accounting roles", () => {
    expect(canAccessDebtSurface("UNKNOWN", "overview")).toBe(false);
    expect(canAccessDebtSurface(undefined, "receivables")).toBe(false);
    expect(canAccessDebtSurface("ACCOUNTANT", "payables")).toBe(true);
    expect(canAccessDebtSurface("ADMIN", "payable-detail")).toBe(true);
  });
});

describe("aging projection", () => {
  it("parses supported payment terms without depending on browser locale", () => {
    expect(paymentTermDays("COD")).toBe(0);
    expect(paymentTermDays("NET15")).toBe(15);
    expect(paymentTermDays("NET60")).toBe(60);
    expect(paymentTermDays("unexpected")).toBe(30);
  });

  it("places a cached balance in the deterministic overdue bucket", () => {
    const projection = projectAging({
      id: "customer-1", code: "KH-001", name: "Khách A", balanceVnd: "1250000",
      paymentTerms: "NET30", orderDate: "2026-01-01T00:00:00.000Z",
    }, new Date("2026-03-17T00:00:00.000Z"));

    expect(projection.dueDate?.toISOString()).toBe("2026-01-31T00:00:00.000Z");
    expect(projection.daysPastDue).toBe(45);
    expect(projection.bucket).toBe("DUE_31_60");
    expect(projection.balanceVnd).toBe("1250000");
  });

  it("keeps records without an order-date in current because this is only a projection", () => {
    const projection = projectAging({ id: "customer-2", code: "KH-002", name: "Khách B", balanceVnd: "500000" }, new Date("2026-03-17T00:00:00.000Z"));
    expect(projection.dueDate).toBeNull();
    expect(projection.bucket).toBe("CURRENT");
    expect(agingBucketForDaysPastDue(91)).toBe("DUE_90_PLUS");
  });

  it("accepts only strict real YYYY-MM-DD dates", () => {
    expect(parseIsoDateOnly("2024-02-29")?.toISOString()).toBe("2024-02-29T00:00:00.000Z");
    expect(parseIsoDateOnly("2026-02-29")).toBeNull();
    expect(parseIsoDateOnly("2026-2-03")).toBeNull();
    expect(parseIsoDateOnly("2026-01-01T00:00:00Z")).toBeNull();
  });
});

describe("integer VND boundary", () => {
  it("preserves exact integer VND through BigInt serialization", () => {
    expect(serializeVnd(legacyMoneyToVnd(9_007_199_254_740_991, "amount"))).toBe("9007199254740991");
  });

  it("rejects fractional and unsafe legacy Float money", () => {
    expect(() => legacyMoneyToVnd(1000.5, "amount")).toThrow(RangeError);
    expect(() => legacyMoneyToVnd(Number.MAX_SAFE_INTEGER + 1, "amount")).toThrow(RangeError);
  });
});
