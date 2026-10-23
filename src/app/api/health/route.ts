import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Liveness endpoint for the container orchestrator.
 *
 * This intentionally does not connect to Prisma: a migration or database
 * outage must not make the HTTP process look dead and trigger a restart loop.
 * Database readiness is owned by the Postgres healthcheck and deployment
 * migration step.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "sonkhang-erp",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
