import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/route-guard", () => ({
  requireSession: vi.fn(async () => ({ user: { id: "driver-a", role: "DRIVER" } })),
  requireRole: vi.fn(() => null),
}));

vi.mock("@/services/logistics.service", async () => {
  const { ForbiddenError } = await import("@/lib/http-errors");
  return {
    LogisticsService: {
      completeStop: vi.fn(async () => {
        throw new ForbiddenError("Không có quyền thao tác chuyến xe này!");
      }),
    },
  };
});

import { POST } from "@/app/api/driver/trips/[id]/stops/[stopId]/complete/route";

describe("driver mutation route authorization", () => {
  it("maps service ownership denial to HTTP 403 instead of a validation 400", async () => {
    const response = await POST(
      new Request("http://localhost/api/driver/trips/trip-b/stops/stop-b/complete", {
        method: "POST",
        body: JSON.stringify({ status: "SUCCESS" }),
      }),
      { params: { id: "trip-b", stopId: "stop-b" } }
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });
});
