import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ updateMany: vi.fn(), findUnique: vi.fn(), auditCreate: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ default: { $transaction: mocks.transaction } }));

import { SalesCreditDomainError, SalesCreditService } from "@/services/sales-credit.service";

describe("SalesCreditService", () => {
  const tx = { salesOrder: { updateMany: mocks.updateMany, findUnique: mocks.findUnique }, auditLog: { create: mocks.auditCreate } };
  beforeEach(() => { vi.clearAllMocks(); mocks.transaction.mockImplementation(async (callback: any) => callback(tx)); });

  it("requires a nonempty decision note before starting a transaction", async () => {
    await expect(SalesCreditService.decide("order-1", "APPROVE", "admin-1", " ")).rejects.toMatchObject({ status: 400 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("writes a conditional approval and an audit with the authenticated actor in one serializable transaction", async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.findUnique.mockResolvedValue({ id: "order-1", orderCode: "SO-1", creditApprovalStatus: "APPROVED", requiresCreditApproval: false, creditApprovalNote: "Ngoại lệ", creditApprovedById: "admin-1" });
    await expect(SalesCreditService.decide("order-1", "APPROVE", "admin-1", "Ngoại lệ")).resolves.toMatchObject({ id: "order-1" });
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "order-1", requiresCreditApproval: true, creditApprovalStatus: "PENDING_APPROVAL" }, data: expect.objectContaining({ creditApprovedById: "admin-1", creditApprovalStatus: "APPROVED" }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ employeeId: "admin-1", action: "APPROVE_SALES_CREDIT", targetId: "order-1" }) });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ isolationLevel: "Serializable" }));
  });

  it("fails replay or concurrent decision without creating a second audit event", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 }); mocks.findUnique.mockResolvedValue({ id: "order-1", creditApprovalStatus: "APPROVED", requiresCreditApproval: false });
    await expect(SalesCreditService.decide("order-1", "APPROVE", "admin-2", "Replay")).rejects.toBeInstanceOf(SalesCreditDomainError);
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });
});
