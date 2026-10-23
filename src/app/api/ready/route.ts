import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SchemaProbe = {
  employee: string | null;
  inventoryLedger: string | null;
};

/**
 * Readiness endpoint: the process is ready only when PostgreSQL is reachable
 * and the two core security/inventory tables exist.
 */
export async function GET() {
  try {
    const [probe] = await prisma.$queryRaw<SchemaProbe[]>`
      SELECT
        to_regclass('"Employee"')::text AS "employee",
        to_regclass('"InventoryLedger"')::text AS "inventoryLedger"
    `;

    if (!probe?.employee || !probe.inventoryLedger) {
      return NextResponse.json(
        {
          status: "not_ready",
          reason: "database_schema_missing",
        },
        {
          status: 503,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    return NextResponse.json(
      {
        status: "ready",
        service: "sonkhang-erp",
        timestamp: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[Readiness] Database probe failed", error);
    return NextResponse.json(
      {
        status: "not_ready",
        reason: "database_unavailable",
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }
}
