import { describe, expect, it } from "vitest";
import { redactWarehouseValuation } from "@/lib/warehouse-serialization";

describe("warehouse valuation redaction", () => {
  const payload = {
    totalAmount: 100_000,
    totalDifferenceValue: 20_000,
    items: [{ unitCost: 20_000, lineAmount: 100_000, product: { sku: "SKU-1", avgCostPrice: 20_000 }, quantity: 5 }],
  };

  it("removes valuation fields recursively for WAREHOUSE, including mutation responses", () => {
    const result = redactWarehouseValuation(payload, "WAREHOUSE");
    expect(JSON.stringify(result)).not.toMatch(/totalAmount|totalDifferenceValue|unitCost|lineAmount|avgCostPrice/);
    expect(result).toEqual({ items: [{ product: { sku: "SKU-1" }, quantity: 5 }] });
  });

  it("does not redact accountant/admin valuation required for reconciliation", () => {
    expect(redactWarehouseValuation(payload, "ACCOUNTANT")).toEqual(payload);
    expect(redactWarehouseValuation(payload, "ADMIN")).toEqual(payload);
  });
});
