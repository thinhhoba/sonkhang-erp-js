import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ default: {} }));
vi.mock("@/services/inventory.service", () => ({ InventoryService: {} }));

import { assertTripCloseable, planTransitClose } from "@/services/payroll.service";

describe("trip close transit conservation", () => {
  const sumTransit = (plan: ReturnType<typeof planTransitClose>) => plan.reduce((sum, item) => sum + item.inTransitChange, 0);
  it("consumes all dispatched truck stock for success, partial, and failed stops", () => {
    expect(sumTransit(planTransitClose("SUCCESS", 10))).toBe(-10);
    expect(sumTransit(planTransitClose("PARTIAL", 10, 3))).toBe(-10);
    expect(sumTransit(planTransitClose("FAILED", 10))).toBe(-10);
    expect(planTransitClose("PARTIAL", 10, 3)).toEqual([
      { type: "OUT_DISPATCH", qtyChange: 0, inTransitChange: -7 },
      { type: "IN_RETURN_TRIP", qtyChange: 3, inTransitChange: -3 },
    ]);
  });

  it("rejects impossible return quantities before posting any ledger movement", () => {
    expect(() => planTransitClose("PARTIAL", 10, 11)).toThrow("không hợp lệ");
  });

  it("rejects non-settlement trips and PENDING stops before any close movement plan", () => {
    expect(() => assertTripCloseable("ON_ROAD", [{ status: "SUCCESS" }])).toThrow("chờ đối soát");
    expect(() => assertTripCloseable("WAITING_SETTLE", [{ status: "PENDING" }])).toThrow("hoàn tất tất cả điểm giao");
  });
});
