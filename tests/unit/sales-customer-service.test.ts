import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ transaction: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), auditCreate: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ default: { $transaction: mocks.transaction } }));
import { SalesCustomerDomainError, SalesCustomerService } from "@/services/sales-customer.service";

const customer = { id: "c-1", customerCode: "KH-1", name: "Khách", phone: "090", email: null, address: "A", district: null, ward: null, city: "HCM", creditLimit: 100_000, paymentTerms: "NET30", maxOverdueDays: 30, isBlocked: false };

describe("SalesCustomerService", () => {
  const tx = { customer: { create: mocks.create, findUnique: mocks.findUnique, update: mocks.update }, auditLog: { create: mocks.auditCreate } };
  beforeEach(() => { vi.clearAllMocks(); mocks.transaction.mockImplementation(async (callback: any) => callback(tx)); });

  it("rejects unsupported payment terms and fractional VND before a transaction", async () => {
    await expect(SalesCustomerService.create({ name: "Khách", paymentTerms: "NET90" }, "admin-1")).rejects.toBeInstanceOf(SalesCustomerDomainError);
    await expect(SalesCustomerService.create({ name: "Khách", creditLimit: 10.5 }, "admin-1")).rejects.toBeInstanceOf(SalesCustomerDomainError);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("audits every editable customer field, including blocked status, in the transaction", async () => {
    mocks.findUnique.mockResolvedValue(customer); mocks.update.mockResolvedValue({ ...customer, phone: "091", address: "B", isBlocked: true }); mocks.auditCreate.mockResolvedValue({ id: "a-1" });
    await SalesCustomerService.update("c-1", { phone: "091", address: "B", isBlocked: true }, "admin-1");
    const audit = mocks.auditCreate.mock.calls[0][0].data;
    expect(audit.employeeId).toBe("admin-1"); expect(JSON.parse(audit.oldValue)).toMatchObject({ phone: "090", address: "A", isBlocked: false }); expect(JSON.parse(audit.newValue)).toMatchObject({ phone: "091", address: "B", isBlocked: true });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ isolationLevel: "Serializable" }));
  });

  it("propagates audit failure so the enclosing transaction rolls back the customer write", async () => {
    mocks.findUnique.mockResolvedValue(customer); mocks.update.mockResolvedValue(customer); mocks.auditCreate.mockRejectedValue(new Error("audit unavailable"));
    await expect(SalesCustomerService.update("c-1", { name: "Đổi tên" }, "admin-1")).rejects.toThrow("audit unavailable");
  });
});
