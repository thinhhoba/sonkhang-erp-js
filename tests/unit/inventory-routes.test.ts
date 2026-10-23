import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(), requireRole: vi.fn(),
  createStocktake: vi.fn(), updateStocktakeActual: vi.fn(), completeStocktake: vi.fn(), listStocktakes: vi.fn(),
  createWarehouseIssue: vi.fn(), listWarehouseIssues: vi.fn(),
}));

vi.mock("@/lib/route-guard", () => ({ requireSession: mocks.requireSession, requireRole: mocks.requireRole }));
vi.mock("@/services/warehouse.service", () => ({ WarehouseService: {
  createStocktake: mocks.createStocktake, updateStocktakeActual: mocks.updateStocktakeActual,
  completeStocktake: mocks.completeStocktake, listStocktakes: mocks.listStocktakes,
  createWarehouseIssue: mocks.createWarehouseIssue, listWarehouseIssues: mocks.listWarehouseIssues,
} }));
vi.mock("@/services/inventory.service", () => ({
  InventoryDomainError: class InventoryDomainError extends Error { constructor(message: string, readonly status = 400) { super(message); } },
}));

import { POST as createStocktake } from "@/app/api/inventory/stocktake/route";
import { PUT as updateStocktake } from "@/app/api/inventory/stocktake/[id]/route";
import { POST as completeStocktake } from "@/app/api/inventory/stocktake/[id]/complete/route";
import { POST as createIssue, GET as listIssues } from "@/app/api/inventory/damaged/route";

describe("inventory warehouse routes", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.requireRole.mockReturnValue(null); });

  it("rejects unauthenticated stocktake creation before persistence", async () => {
    mocks.requireSession.mockResolvedValue({ error: NextResponse.json({}, { status: 401 }) });
    const response = await createStocktake(new Request("http://localhost/api/inventory/stocktake", { method: "POST", body: JSON.stringify({ title: "Kỳ 1" }) }));
    expect(response.status).toBe(401);
    expect(mocks.createStocktake).not.toHaveBeenCalled();
  });

  it("limits stocktake write to Warehouse/Admin and binds the session actor", async () => {
    mocks.requireSession.mockResolvedValue({ user: { id: "warehouse-1", role: "WAREHOUSE" } });
    mocks.createStocktake.mockResolvedValue({ id: "st-1" });
    expect((await createStocktake(new Request("http://localhost/api/inventory/stocktake", { method: "POST", body: JSON.stringify({ title: "Kỳ 1", conductedById: "attacker" }) }))).status).toBe(201);
    expect(mocks.createStocktake).toHaveBeenCalledWith(expect.objectContaining({ conductedById: "warehouse-1" }));
    mocks.requireRole.mockReturnValueOnce(NextResponse.json({}, { status: 403 }));
    expect((await createStocktake(new Request("http://localhost/api/inventory/stocktake", { method: "POST", body: JSON.stringify({ title: "Kỳ 2" }) }))).status).toBe(403);
  });

  it("binds stocktake post audit actor to the session", async () => {
    mocks.requireSession.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mocks.completeStocktake.mockResolvedValue({ id: "st-1", status: "COMPLETED" });
    const response = await completeStocktake(new Request("http://localhost/api/inventory/stocktake/st-1/complete", { method: "POST" }), { params: { id: "st-1" } });
    expect(response.status).toBe(200);
    expect(mocks.completeStocktake).toHaveBeenCalledWith("st-1", "admin-1");
  });

  it("binds stocktake count updates to the authenticated actor", async () => {
    mocks.requireSession.mockResolvedValue({ user: { id: "warehouse-1", role: "WAREHOUSE" } });
    mocks.updateStocktakeActual.mockResolvedValue({ id: "st-1", status: "IN_PROGRESS" });
    const response = await updateStocktake(new Request("http://localhost/api/inventory/stocktake/st-1", { method: "PUT", body: JSON.stringify({ actorId: "attacker", items: [{ productId: "p1", actualQty: 3 }] }) }), { params: { id: "st-1" } });
    expect(response.status).toBe(200);
    expect(mocks.updateStocktakeActual).toHaveBeenCalledWith(expect.objectContaining({ actorId: "warehouse-1" }));
  });

  it("keeps issue mutation protected and fail-safe disabled until approval migration", async () => {
    mocks.requireSession.mockResolvedValue({ user: { id: "warehouse-1", role: "WAREHOUSE" } });
    const response = await createIssue(new Request("http://localhost/api/inventory/damaged", { method: "POST", body: JSON.stringify({ type: "DAMAGED", createdById: "attacker", items: [{ productId: "p1", quantity: 1 }] }) }));
    expect(response.status).toBe(501);
    expect(mocks.createWarehouseIssue).not.toHaveBeenCalled();
    mocks.requireSession.mockResolvedValue({ user: { id: "sales-1", role: "SALES" } }); mocks.requireRole.mockReturnValueOnce(NextResponse.json({}, { status: 403 }));
    expect((await listIssues(new Request("http://localhost/api/inventory/damaged"))).status).toBe(403);
  });

  it("redacts nested valuation from warehouse issue reads", async () => {
    mocks.requireSession.mockResolvedValue({ user: { id: "warehouse-1", role: "WAREHOUSE" } });
    mocks.listWarehouseIssues.mockResolvedValue([{ id: "issue-1", totalAmount: 100_000, items: [{ unitCost: 50_000, lineAmount: 100_000, product: { sku: "SKU-1", avgCostPrice: 50_000 } }] }]);
    const response = await listIssues(new Request("http://localhost/api/inventory/damaged"));
    expect(response.status).toBe(200);
    const body = JSON.stringify(await response.json());
    expect(body).not.toMatch(/totalAmount|unitCost|lineAmount|avgCostPrice/);
    expect(body).toContain("SKU-1");
  });
});
