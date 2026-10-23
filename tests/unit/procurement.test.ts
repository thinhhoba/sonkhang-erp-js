import { describe, expect, it } from "vitest";
import { calculatePurchaseOrderVnd, canAccessProcurement, canWriteProcurement, invoiceMayMatchPurchaseOrder, validatePurchaseOrderInput, validateSupplierInput, vndDifference } from "@/lib/procurement";

describe("procurement access control", () => {
  it("fails closed and keeps invoice data out of warehouse role", () => {
    expect(canAccessProcurement(undefined, "suppliers")).toBe(false);
    expect(canAccessProcurement("UNKNOWN", "purchase-orders")).toBe(false);
    expect(canAccessProcurement("WAREHOUSE", "purchase-orders")).toBe(true);
    expect(canAccessProcurement("WAREHOUSE", "invoices")).toBe(false);
    expect(canWriteProcurement("ACCOUNTANT")).toBe(true);
    expect(canWriteProcurement("DISPATCHER")).toBe(false);
  });
});

describe("procurement input validation", () => {
  it("rejects duplicate products and non-finite monetary values", () => {
    expect(() => validatePurchaseOrderInput({ supplierId: "s1", items: [
      { productId: "p1", orderedQty: 1, unitPrice: 100 },
      { productId: "p1", orderedQty: 2, unitPrice: 200 },
    ] })).toThrow(/một sản phẩm/i);
    expect(() => validatePurchaseOrderInput({ supplierId: "s1", items: [{ productId: "p1", orderedQty: 1, unitPrice: Number.NaN }] })).toThrow(/Đơn giá/i);
  });

  it("calculates VND with integer arithmetic", () => {
    expect(calculatePurchaseOrderVnd([{ orderedQty: 3, unitPrice: 100_001 }], 8)).toEqual({
      lineAmounts: [300_003], totalAmount: 300_003, vatAmount: 24_000, grandTotal: 324_003,
    });
    expect(() => validatePurchaseOrderInput({ supplierId: "s1", items: [{ productId: "p1", orderedQty: 1.5, unitPrice: 100 }] })).toThrow(/số nguyên/i);
    expect(vndDifference(200_001, 100_000)).toBe(100_001);
    expect(() => vndDifference(1.5, 1)).toThrow(/số nguyên VND/i);
  });

  it("normalizes bounded supplier input", () => {
    expect(validateSupplierInput({ code: " ncc-01 ", name: "Nhà cung cấp", taxCode: "0101", paymentTerms: "net30" })).toMatchObject({
      code: "NCC-01", paymentTerms: "NET30", creditLimit: 0,
    });
  });
});

describe("three-way-match invoice ownership", () => {
  it("accepts only an explicit PO link or the supplier tax-code rule", () => {
    const po = { id: "po-1", supplierTaxCode: "031" };
    expect(invoiceMayMatchPurchaseOrder({ poId: "po-1", supplierTaxCode: "999" }, po)).toBe(true);
    expect(invoiceMayMatchPurchaseOrder({ poId: null, supplierTaxCode: "031" }, po)).toBe(true);
    expect(invoiceMayMatchPurchaseOrder({ poId: "po-other", supplierTaxCode: "999" }, po)).toBe(false);
    expect(invoiceMayMatchPurchaseOrder({ poId: "po-other", supplierTaxCode: "031" }, po)).toBe(false);
  });
});
