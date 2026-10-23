import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({ requireSession: vi.fn(), requireRole: vi.fn(), findMany: vi.fn(), createLocation: vi.fn(), closeTrip: vi.fn() }));
vi.mock("@/lib/route-guard", () => ({ requireSession: mocks.requireSession, requireRole: mocks.requireRole }));
vi.mock("@/lib/prisma", () => ({ default: { salesReturn: { findMany: mocks.findMany } } }));
vi.mock("@/services/warehouse.service", () => ({ WarehouseService: { createLocation: mocks.createLocation } }));
vi.mock("@/services/logistics.service", () => ({ LogisticsService: { closeTrip: mocks.closeTrip } }));

import { GET as getReturns } from "@/app/api/sales/returns/route";
import { POST as createLocation } from "@/app/api/inventory/locations/route";
import { POST as closeTrip } from "@/app/api/logistics/trips/[id]/close/route";

describe("final warehouse and close-route guards", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.requireRole.mockReturnValue(null); });

  it("fails closed for warehouse access to global sales-return data", async () => {
    mocks.requireSession.mockResolvedValue({ user: { id: "w-1", role: "WAREHOUSE" } });
    mocks.findMany.mockResolvedValue([{ id: "r-1", totalReturnAmount: 100, arDeductionAmount: 50, customer: { name: "private" }, salesOrder: { totalAmount: 100 }, items: [{ unitPrice: 20, lineAmount: 100, product: { sku: "SKU" } }] }]);
    mocks.requireRole.mockReturnValueOnce(NextResponse.json({}, { status: 403 }));
    const response = await getReturns();
    expect(response.status).toBe(403); expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("binds location audit actor to the authenticated warehouse user", async () => {
    mocks.requireSession.mockResolvedValue({ user: { id: "w-1", role: "WAREHOUSE" } }); mocks.createLocation.mockResolvedValue({ id: "loc-1" });
    const response = await createLocation(new Request("http://localhost/api/inventory/locations", { method: "POST", body: JSON.stringify({ code: "A-01", name: "Kệ A", zone: "MAIN", actorId: "attacker" }) }));
    expect(response.status).toBe(201); expect(mocks.createLocation).toHaveBeenCalledWith(expect.objectContaining({ actorId: "w-1" }));
  });

  it("rejects unauthenticated and non-accountant trip closure before service mutation", async () => {
    mocks.requireSession.mockResolvedValue({ error: NextResponse.json({}, { status: 401 }) });
    expect((await closeTrip(new Request("http://localhost/api/logistics/trips/t-1/close", { method: "POST" }), { params: { id: "t-1" } })).status).toBe(401);
    expect(mocks.closeTrip).not.toHaveBeenCalled();
    mocks.requireSession.mockResolvedValue({ user: { id: "w-1", role: "WAREHOUSE" } }); mocks.requireRole.mockReturnValueOnce(NextResponse.json({}, { status: 403 }));
    expect((await closeTrip(new Request("http://localhost/api/logistics/trips/t-1/close", { method: "POST" }), { params: { id: "t-1" } })).status).toBe(403);
    expect(mocks.closeTrip).not.toHaveBeenCalled();
  });
});
