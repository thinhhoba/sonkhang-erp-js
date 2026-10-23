/** Fields that expose inventory valuation. Warehouse operators only receive quantities and operational state. */
const COST_FIELDS = new Set([
  "avgCostPrice", "avgCostAfter", "unitCost", "unitCostAtTime", "effectiveUnitCost",
  "differenceValue", "totalDifferenceValue", "lineAmount", "totalAmount",
]);

export function redactWarehouseValuation<T>(value: T, role?: string): T {
  if (role !== "WAREHOUSE" || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => redactWarehouseValuation(item, role)) as T;
  if (typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !COST_FIELDS.has(key))
    .map(([key, child]) => [key, redactWarehouseValuation(child, role)])) as T;
}
