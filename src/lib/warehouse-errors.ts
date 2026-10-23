import { NextResponse } from "next/server";
import { InventoryDomainError } from "@/services/inventory.service";

/** Never pass driver/database details from warehouse mutations to the browser. */
export function warehouseErrorResponse(error: unknown, fallback = 400) {
  if (error instanceof InventoryDomainError) return { error: error.message, status: error.status };
  return { error: "Không thể xử lý yêu cầu kho lúc này", status: fallback };
}

export function warehouseFailure(error: unknown, fallback = 400) {
  const result = warehouseErrorResponse(error, fallback);
  return NextResponse.json({ success: false, error: result.error }, { status: result.status });
}
