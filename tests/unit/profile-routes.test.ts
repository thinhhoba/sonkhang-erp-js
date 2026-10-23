import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({ requireSession: vi.fn(), findUnique: vi.fn(), update: vi.fn(), auditCreate: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/route-guard", () => ({ requireSession: mocks.requireSession }));
vi.mock("@/lib/prisma", () => ({ default: { employee: { findUnique: mocks.findUnique }, $transaction: mocks.transaction } }));
import { GET, PUT } from "@/app/api/profile/route";

const user = (id = "sales-1", role = "SALES") => ({ user: { id, role } });
const employee = { id: "sales-1", code: "NV-1", fullName: "Sales", email: "sales@example.com", phone: "0900000000", avatarUrl: null, role: "SALES", isActive: true, createdAt: new Date(), updatedAt: new Date() };

describe("profile routes", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.transaction.mockImplementation(async (callback: any) => callback({ employee: { findUnique: mocks.findUnique, update: mocks.update }, auditLog: { create: mocks.auditCreate } })); });
  it("returns 401 before persistence without a session", async () => {
    mocks.requireSession.mockResolvedValue({ error: NextResponse.json({}, { status: 401 }) });
    expect((await GET()).status).toBe(401); expect((await PUT(new Request("http://localhost/api/profile", { method: "PUT", body: "{}" }))).status).toBe(401); expect(mocks.findUnique).not.toHaveBeenCalled();
  });
  it("reads only the session employee using a safe DTO", async () => {
    mocks.requireSession.mockResolvedValue(user()); mocks.findUnique.mockResolvedValue(employee);
    const response = await GET(); const payload = await response.json();
    expect(response.status).toBe(200); expect(mocks.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "sales-1" }, select: expect.any(Object) })); expect(JSON.stringify(payload.data)).not.toMatch(/baseSalary|ratePerTrip|auditLogs/);
  });
  it("rejects role, salary, foreign-id and malformed known fields before a transaction", async () => {
    mocks.requireSession.mockResolvedValue(user());
    for (const body of [{ id: "admin-1", fullName: "X" }, { baseSalary: 1 }, { role: "ADMIN" }, { fullName: 123 }, { phone: null }, { avatarUrl: 8 }]) expect((await PUT(new Request("http://localhost/api/profile", { method: "PUT", body: JSON.stringify(body) }))).status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
    mocks.findUnique.mockResolvedValue({ id: "sales-1", fullName: "Sales", phone: "0900000000", avatarUrl: null }); mocks.update.mockResolvedValue(employee); mocks.auditCreate.mockResolvedValue({ id: "a-1" });
    expect((await PUT(new Request("http://localhost/api/profile", { method: "PUT", body: JSON.stringify({ fullName: "Sales mới", phone: "0911111111" }) }))).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "sales-1" }, data: expect.objectContaining({ fullName: "Sales mới" }) })); expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ employeeId: "sales-1", action: "UPDATE_OWN_PROFILE" }) }));
  });
  it("returns generic 500 when audit fails, allowing the transaction to roll back", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.requireSession.mockResolvedValue(user()); mocks.findUnique.mockResolvedValue({ id: "sales-1", fullName: "Sales", phone: "0900000000", avatarUrl: null }); mocks.update.mockResolvedValue(employee); mocks.auditCreate.mockRejectedValue(new Error("audit-secret"));
    const response = await PUT(new Request("http://localhost/api/profile", { method: "PUT", body: JSON.stringify({ fullName: "Sales mới" }) }));
    expect(response.status).toBe(500); expect(JSON.stringify(await response.json())).not.toContain("audit-secret"); expect(errorSpy).toHaveBeenCalledWith("Profile PUT failed"); errorSpy.mockRestore();
  });
});
