import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(), requireRole: vi.fn(), createCustomer: vi.fn(), updateCustomer: vi.fn(), decideCredit: vi.fn(),
  customerFindMany: vi.fn(), customerFindUnique: vi.fn(), orderFindMany: vi.fn(), orderFindUnique: vi.fn(), returnFindMany: vi.fn(),
}));
vi.mock("@/lib/route-guard", () => ({ requireSession: mocks.requireSession, requireRole: mocks.requireRole }));
vi.mock("@/services/sales-customer.service", () => ({ SalesCustomerService: { create: mocks.createCustomer, update: mocks.updateCustomer }, SalesCustomerDomainError: class SalesCustomerDomainError extends Error { constructor(message: string, public status = 400) { super(message); } } }));
vi.mock("@/services/sales-credit.service", () => ({ SalesCreditService: { decide: mocks.decideCredit }, SalesCreditDomainError: class SalesCreditDomainError extends Error { constructor(message: string, public status = 400) { super(message); } } }));
vi.mock("@/lib/prisma", () => ({ default: { customer: { findMany: mocks.customerFindMany, findUnique: mocks.customerFindUnique }, salesOrder: { findMany: mocks.orderFindMany, findUnique: mocks.orderFindUnique }, salesReturn: { findMany: mocks.returnFindMany } } }));

import { GET as customersGet, POST as customersPost } from "@/app/api/sales/customers/route";
import { GET as customerGet, PATCH as customerPatch } from "@/app/api/sales/customers/[id]/route";
import { GET as ordersGet } from "@/app/api/sales/orders/route";
import { GET as orderGet } from "@/app/api/sales/orders/[id]/route";
import { GET as approvalsGet } from "@/app/api/sales/credit-approvals/route";
import { POST as creditPost } from "@/app/api/sales/orders/[id]/credit-approve/route";
import { GET as returnsGet, POST as returnsPost } from "@/app/api/sales/returns/route";

const user = (role = "SALES") => ({ user: { id: "emp-session", role } });
const forbidden = () => NextResponse.json({ success: false }, { status: 403 });

describe("sales routes", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.requireRole.mockImplementation((current: any, allowed: string[]) => allowed.includes(current.role) ? null : forbidden()); });

  it("rejects unauthenticated reads/mutations before persistence", async () => {
    mocks.requireSession.mockResolvedValue({ error: NextResponse.json({}, { status: 401 }) });
    const calls = [() => customersGet(new Request("http://localhost/api/sales/customers")), () => customerGet(new Request("http://localhost/api/sales/customers/c-1"), { params: { id: "c-1" } }), () => ordersGet(new Request("http://localhost/api/sales/orders") as any), () => orderGet(new Request("http://localhost/api/sales/orders/o-1"), { params: { id: "o-1" } }), () => returnsGet(), () => returnsPost(), () => customersPost(new Request("http://localhost/api/sales/customers", { method: "POST", body: "{}" }))];
    for (const call of calls) expect((await call()).status).toBe(401);
    expect(mocks.customerFindMany).not.toHaveBeenCalled(); expect(mocks.orderFindMany).not.toHaveBeenCalled(); expect(mocks.returnFindMany).not.toHaveBeenCalled(); expect(mocks.createCustomer).not.toHaveBeenCalled();
  });

  it("fails closed for SALES global customer/order/return reads before DB access", async () => {
    mocks.requireSession.mockResolvedValue(user("SALES"));
    const calls = [() => customersGet(new Request("http://localhost/api/sales/customers")), () => customerGet(new Request("http://localhost/api/sales/customers/c-1"), { params: { id: "c-1" } }), () => ordersGet(new Request("http://localhost/api/sales/orders") as any), () => orderGet(new Request("http://localhost/api/sales/orders/o-1"), { params: { id: "o-1" } }), () => returnsGet()];
    for (const call of calls) expect((await call()).status).toBe(403);
    expect(mocks.customerFindMany).not.toHaveBeenCalled(); expect(mocks.customerFindUnique).not.toHaveBeenCalled(); expect(mocks.orderFindMany).not.toHaveBeenCalled(); expect(mocks.orderFindUnique).not.toHaveBeenCalled(); expect(mocks.returnFindMany).not.toHaveBeenCalled();
  });

  it("allows customer mutation only for ADMIN and binds audit actor to the session", async () => {
    mocks.requireSession.mockResolvedValue(user("ADMIN")); mocks.createCustomer.mockResolvedValue({ id: "c-1" }); mocks.updateCustomer.mockResolvedValue({ id: "c-1" });
    expect((await customersPost(new Request("http://localhost/api/sales/customers", { method: "POST", body: JSON.stringify({ name: "Khách", actorId: "attacker" }) }))).status).toBe(201);
    expect(mocks.createCustomer).toHaveBeenCalledWith(expect.objectContaining({ name: "Khách" }), "emp-session");
    expect((await customerPatch(new Request("http://localhost/api/sales/customers/c-1", { method: "PATCH", body: JSON.stringify({ name: "Mới" }) }), { params: { id: "c-1" } })).status).toBe(200);
    mocks.requireSession.mockResolvedValue(user("SALES"));
    expect((await customersPost(new Request("http://localhost/api/sales/customers", { method: "POST", body: "{}" }))).status).toBe(403); expect(mocks.createCustomer).toHaveBeenCalledTimes(1);
  });

  it("keeps credit queue and decision ADMIN-only and binds approval actor to session", async () => {
    mocks.requireSession.mockResolvedValue(user("ACCOUNTANT")); expect((await approvalsGet()).status).toBe(403); expect(mocks.orderFindMany).not.toHaveBeenCalled();
    mocks.requireSession.mockResolvedValue(user("ADMIN")); mocks.decideCredit.mockResolvedValue({ id: "o-1" });
    expect((await creditPost(new Request("http://localhost/api/sales/orders/o-1/credit-approve", { method: "POST", body: JSON.stringify({ action: "APPROVE", note: "Ngoại lệ", employeeId: "attacker" }) }), { params: { id: "o-1" } })).status).toBe(200);
    expect(mocks.decideCredit).toHaveBeenCalledWith("o-1", "APPROVE", "emp-session", "Ngoại lệ");
  });

  it("uses explicit DTOs and does not leak raw persistence errors", async () => {
    mocks.requireSession.mockResolvedValue(user("ADMIN")); mocks.orderFindMany.mockRejectedValue(new Error("db-password=secret"));
    const failed = await ordersGet(new Request("http://localhost/api/sales/orders") as any); expect(failed.status).toBe(500); expect(JSON.stringify(await failed.json())).not.toContain("secret");
    mocks.returnFindMany.mockResolvedValue([{ id: "r-1", customer: { name: "C" }, totalReturnAmount: 1 }]);
    const response = await returnsGet(); expect(response.status).toBe(200); expect(mocks.returnFindMany.mock.calls[0][0]).toHaveProperty("select");
  });

  it("keeps returns creation migration-gated after session and RBAC", async () => {
    mocks.requireSession.mockResolvedValue(user("ACCOUNTANT")); expect((await returnsPost()).status).toBe(403);
    mocks.requireSession.mockResolvedValue(user("ADMIN")); const response = await returnsPost(); expect(response.status).toBe(501); expect(mocks.returnFindMany).not.toHaveBeenCalled();
  });
});
