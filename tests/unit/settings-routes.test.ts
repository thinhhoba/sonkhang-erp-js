import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const transaction = vi.fn();
  const employee = { create: vi.fn(), findUnique: vi.fn(), count: vi.fn(), update: vi.fn() };
  const auditLog = { create: vi.fn() };
  return {
    transaction,
    employee,
    auditLog,
    requireSession: vi.fn(),
    requireRole: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  default: { $transaction: mocks.transaction, employee: mocks.employee, auditLog: mocks.auditLog },
}));
vi.mock("@/lib/route-guard", () => ({
  requireSession: mocks.requireSession,
  requireRole: mocks.requireRole,
}));

import { POST as createEmployee } from "@/app/api/settings/employees/route";
import { PATCH as updateEmployee } from "@/app/api/settings/employees/[employeeId]/route";

const existingEmployee = {
  id: "employee-b", code: "SK-002", fullName: "Nhân viên B", email: "b@sonkhang.vn", phone: "0900000002", avatarUrl: null,
  role: "DRIVER", isActive: true, baseSalary: 0, ratePerTrip: 30_000, ratePerStop: 5_000, ratePerKg: 250,
  createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"),
};

const request = (body: unknown) => new Request("http://localhost/api/settings/employees", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const patchRequest = (body: unknown) => new Request("http://localhost/api/settings/employees/employee-b", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("settings employee routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireSession.mockResolvedValue({ user: { id: "admin-a", role: "ADMIN", isActive: true } });
    mocks.requireRole.mockReturnValue(null);
    mocks.employee.create.mockResolvedValue(existingEmployee);
    mocks.employee.findUnique.mockResolvedValue(existingEmployee);
    mocks.employee.count.mockResolvedValue(2);
    mocks.employee.update.mockResolvedValue({ ...existingEmployee, fullName: "Nhân viên B mới" });
    mocks.auditLog.create.mockResolvedValue({ id: "audit-1" });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({ employee: mocks.employee, auditLog: mocks.auditLog }));
  });

  it("returns 401 before touching persistence when unauthenticated", async () => {
    mocks.requireSession.mockResolvedValue({ error: new Response(JSON.stringify({ success: false }), { status: 401 }) });
    const response = await createEmployee(request({}));
    expect(response.status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns 403 before touching persistence when not an admin", async () => {
    mocks.requireRole.mockReturnValue(new Response(JSON.stringify({ success: false }), { status: 403 }));
    const response = await createEmployee(request({}));
    expect(response.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns 401 and 403 for the detail mutation before reading a target", async () => {
    mocks.requireSession.mockResolvedValue({ error: new Response(JSON.stringify({ success: false }), { status: 401 }) });
    expect((await updateEmployee(patchRequest({ fullName: "X" }), { params: { employeeId: "employee-b" } })).status).toBe(401);
    expect(mocks.employee.findUnique).not.toHaveBeenCalled();
    mocks.requireSession.mockResolvedValue({ user: { id: "accountant", role: "ACCOUNTANT" } });
    mocks.requireRole.mockReturnValue(new Response(JSON.stringify({ success: false }), { status: 403 }));
    expect((await updateEmployee(patchRequest({ fullName: "X" }), { params: { employeeId: "employee-b" } })).status).toBe(403);
    expect(mocks.employee.findUnique).not.toHaveBeenCalled();
  });

  it("creates employee and complete audit snapshots in the same transaction", async () => {
    const response = await createEmployee(request({ code: "SK-002", fullName: "Nhân viên B", email: "b@sonkhang.vn", phone: "0900000002", role: "DRIVER", isActive: true }));
    expect(response.status).toBe(201);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    const audit = mocks.auditLog.create.mock.calls[0][0].data;
    expect(JSON.parse(audit.oldValue)).toEqual({ code: null, fullName: null, email: null, phone: null, avatarUrl: null, role: null, isActive: null });
    expect(JSON.parse(audit.newValue)).toEqual({ code: "SK-002", fullName: "Nhân viên B", email: "b@sonkhang.vn", phone: "0900000002", avatarUrl: null, role: "DRIVER", isActive: true });
  });

  it("does not commit a created employee when its audit write fails", async () => {
    let committed = false;
    mocks.auditLog.create.mockRejectedValue(new Error("audit unavailable"));
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      await callback({ employee: mocks.employee, auditLog: mocks.auditLog });
      committed = true;
    });
    const response = await createEmployee(request({ code: "SK-002", fullName: "Nhân viên B", email: "b@sonkhang.vn", phone: "0900000002" }));
    expect(response.status).toBe(409);
    expect(committed).toBe(false);
  });

  it("rejects a self-demotion before updating an account", async () => {
    mocks.employee.findUnique.mockResolvedValue({ ...existingEmployee, id: "admin-a", role: "ADMIN" });
    const response = await updateEmployee(patchRequest({ role: "DRIVER" }), { params: { employeeId: "admin-a" } });
    expect(response.status).toBe(409);
    expect(mocks.employee.update).not.toHaveBeenCalled();
  });

  it("prevents the only reachable admin from changing their own whitelist email", async () => {
    mocks.employee.findUnique.mockResolvedValue({ ...existingEmployee, id: "admin-a", role: "ADMIN" });
    const response = await updateEmployee(patchRequest({ email: "new-admin@sonkhang.vn" }), { params: { employeeId: "admin-a" } });
    expect(response.status).toBe(409);
    expect(mocks.employee.update).not.toHaveBeenCalled();
  });

  it("allows a self profile update when submitted security values are unchanged", async () => {
    const currentAdmin = { ...existingEmployee, id: "admin-a", role: "ADMIN", email: "admin@sonkhang.vn", fullName: "Admin cũ" };
    mocks.employee.findUnique.mockResolvedValue(currentAdmin);
    mocks.employee.update.mockResolvedValue({ ...currentAdmin, fullName: "Admin mới", phone: "0900999999" });
    const response = await updateEmployee(patchRequest({
      code: currentAdmin.code,
      fullName: "Admin mới",
      email: currentAdmin.email,
      phone: "0900999999",
      role: currentAdmin.role,
      isActive: currentAdmin.isActive,
    }), { params: { employeeId: "admin-a" } });
    expect(response.status).toBe(200);
    expect(mocks.employee.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "admin-a" },
      data: expect.objectContaining({ fullName: "Admin mới", phone: "0900999999", email: "admin@sonkhang.vn", role: "ADMIN", isActive: true }),
    }));
  });

  it("protects the last active admin from concurrent demotion or deactivation", async () => {
    mocks.employee.findUnique.mockResolvedValue({ ...existingEmployee, id: "admin-b", role: "ADMIN" });
    mocks.employee.count.mockResolvedValue(1);
    const response = await updateEmployee(patchRequest({ isActive: false }), { params: { employeeId: "admin-b" } });
    expect(response.status).toBe(409);
    expect(mocks.employee.update).not.toHaveBeenCalled();
  });

  it("uses serializable isolation, retries a serialization conflict, and records complete update snapshots", async () => {
    let calls = 0;
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown, options: unknown) => {
      calls += 1;
      expect(options).toMatchObject({ isolationLevel: "Serializable" });
      if (calls === 1) throw { code: "P2034" };
      return callback({ employee: mocks.employee, auditLog: mocks.auditLog });
    });
    const response = await updateEmployee(patchRequest({ fullName: "Nhân viên B mới" }), { params: { employeeId: "employee-b" } });
    expect(response.status).toBe(200);
    expect(calls).toBe(2);
    const audit = mocks.auditLog.create.mock.calls[0][0].data;
    expect(JSON.parse(audit.oldValue)).toMatchObject({ code: "SK-002", email: "b@sonkhang.vn", phone: "0900000002", avatarUrl: null, role: "DRIVER", isActive: true });
    expect(JSON.parse(audit.newValue)).toMatchObject({ code: "SK-002", fullName: "Nhân viên B mới", email: "b@sonkhang.vn", phone: "0900000002", avatarUrl: null, role: "DRIVER", isActive: true });
  });

  it("rolls back an update when its audit write fails", async () => {
    let committed = false;
    mocks.auditLog.create.mockRejectedValue(new Error("audit unavailable"));
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      await callback({ employee: mocks.employee, auditLog: mocks.auditLog });
      committed = true;
    });
    const response = await updateEmployee(patchRequest({ fullName: "Nhân viên B mới" }), { params: { employeeId: "employee-b" } });
    expect(response.status).toBe(409);
    expect(committed).toBe(false);
  });
});
