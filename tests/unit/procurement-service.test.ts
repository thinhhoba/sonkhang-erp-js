import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    purchaseOrder: { updateMany: vi.fn(), findUniqueOrThrow: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    purchaseOrderItem: { deleteMany: vi.fn() },
    supplier: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  return { tx, transaction: vi.fn(async (callback: any) => callback(tx)) };
});

vi.mock("@/lib/prisma", () => ({ default: { $transaction: mocks.transaction } }));

import { ProcurementService } from "@/services/procurement.service";

describe("purchase-order state claims", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tx.auditLog.create.mockResolvedValue({ id: "audit-1" });
    mocks.tx.purchaseOrderItem.deleteMany.mockResolvedValue({ count: 1 });
    mocks.tx.purchaseOrder.findUniqueOrThrow.mockResolvedValue({ id: "po-1", status: "SUBMITTED", supplier: {}, items: [] });
    mocks.tx.purchaseOrder.findUnique.mockResolvedValue({ id: "po-1", status: "DRAFT", supplierId: "supplier-1", grandTotal: 100 });
    mocks.tx.supplier.findUnique.mockResolvedValue({ id: "supplier-1", paymentTerms: "NET30", name: "NCC", creditLimit: 0 });
    mocks.tx.purchaseOrder.update.mockResolvedValue({ id: "po-1", supplierId: "supplier-1", grandTotal: 108, supplier: {}, items: [] });
    mocks.tx.supplier.update.mockResolvedValue({ id: "supplier-1", name: "NCC mới", paymentTerms: "NET30", creditLimit: 0 });
  });

  it("claims DRAFT -> SUBMITTED and writes one audit event in the same transaction", async () => {
    mocks.tx.purchaseOrder.updateMany.mockResolvedValue({ count: 1 });
    await ProcurementService.submitPurchaseOrder("po-1", "employee-1");
    expect(mocks.tx.purchaseOrder.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "po-1", status: "DRAFT" } }));
    expect(mocks.tx.auditLog.create).toHaveBeenCalledTimes(1);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });

  it("rejects a concurrent replay before audit persistence", async () => {
    mocks.tx.purchaseOrder.updateMany.mockResolvedValue({ count: 0 });
    await expect(ProcurementService.submitPurchaseOrder("po-1", "employee-1")).rejects.toMatchObject({ status: 409 });
    expect(mocks.tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("does not return success when the transactional audit write fails", async () => {
    mocks.tx.purchaseOrder.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.auditLog.create.mockRejectedValue(new Error("audit unavailable"));
    await expect(ProcurementService.submitPurchaseOrder("po-1", "employee-1")).rejects.toThrow("audit unavailable");
    expect(mocks.tx.purchaseOrder.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("claims SUBMITTED -> APPROVED and audits the correct old status", async () => {
    mocks.tx.purchaseOrder.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.purchaseOrder.findUniqueOrThrow.mockResolvedValue({ id: "po-1", status: "APPROVED", supplier: {}, items: [] });
    await ProcurementService.approvePurchaseOrder("po-1", "employee-1");
    expect(mocks.tx.purchaseOrder.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "po-1", status: "SUBMITTED" } }));
    expect(mocks.tx.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "APPROVE_PURCHASE_ORDER", oldValue: JSON.stringify({ status: "SUBMITTED" }) }) });
    expect(mocks.tx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("rejects approval replay without a second audit", async () => {
    mocks.tx.purchaseOrder.updateMany.mockResolvedValue({ count: 0 });
    await expect(ProcurementService.approvePurchaseOrder("po-1", "employee-1")).rejects.toMatchObject({ status: 409 });
    expect(mocks.tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("does not return approved when approval audit persistence fails", async () => {
    mocks.tx.purchaseOrder.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.auditLog.create.mockRejectedValue(new Error("audit unavailable"));
    await expect(ProcurementService.approvePurchaseOrder("po-1", "employee-1")).rejects.toThrow("audit unavailable");
  });

  it("updates only DRAFT PO and rolls the transaction result back on audit failure", async () => {
    const input = { supplierId: "supplier-1", items: [{ productId: "product-1", orderedQty: 1, unitPrice: 100 }], vatRate: 8 };
    mocks.tx.auditLog.create.mockRejectedValue(new Error("audit unavailable"));
    await expect(ProcurementService.updateDraftPurchaseOrder("po-1", input, "employee-1")).rejects.toThrow("audit unavailable");
    mocks.tx.purchaseOrder.findUnique.mockResolvedValueOnce({ id: "po-1", status: "SUBMITTED" });
    await expect(ProcurementService.updateDraftPurchaseOrder("po-1", input, "employee-1")).rejects.toMatchObject({ status: 409 });
  });

  it("keeps supplier update and audit in one transaction", async () => {
    mocks.tx.auditLog.create.mockRejectedValue(new Error("audit unavailable"));
    await expect(ProcurementService.updateSupplier("supplier-1", { name: "NCC mới" }, "employee-1")).rejects.toThrow("audit unavailable");
    expect(mocks.tx.supplier.update).toHaveBeenCalled();
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});
