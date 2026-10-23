import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRawMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    $queryRaw: queryRawMock,
  },
}));

import { GET as getLiveness } from "@/app/api/health/route";
import { GET as getReadiness } from "@/app/api/ready/route";

describe("health endpoints", () => {
  beforeEach(() => {
    queryRawMock.mockReset();
  });

  it("reports process liveness without querying the database", async () => {
    const response = await getLiveness();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok" });
    expect(queryRawMock).not.toHaveBeenCalled();
  });

  it("reports ready when the database and core schema are available", async () => {
    queryRawMock.mockResolvedValue([
      { employee: '"Employee"', inventoryLedger: '"InventoryLedger"' },
    ]);

    const response = await getReadiness();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ready" });
  });

  it("fails readiness when core tables are missing", async () => {
    queryRawMock.mockResolvedValue([
      { employee: '"Employee"', inventoryLedger: null },
    ]);

    const response = await getReadiness();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: "not_ready",
      reason: "database_schema_missing",
    });
  });

  it("fails readiness when PostgreSQL is unavailable", async () => {
    queryRawMock.mockRejectedValue(new Error("connection refused"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await getReadiness();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: "not_ready",
      reason: "database_unavailable",
    });
    consoleSpy.mockRestore();
  });
});
