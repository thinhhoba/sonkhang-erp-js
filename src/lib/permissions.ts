/**
 * Permission foundation for server-side authorization.  Roles are still stored
 * as strings in the current schema, so this mapping deliberately fails closed
 * for an unknown role.
 */
export type DataScope = "ALL" | "DEPARTMENT" | "ASSIGNED" | "OWN" | "NONE";

export type Permission =
  | "dashboard:view"
  | "dashboard:finance"
  | "dashboard:inventory_cost"
  | "dashboard:operations"
  | "trip:operate"
  | "trip:operate_assigned"
  | "inventory:view"
  | "finance:view"
  | "debt:view";

const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  ADMIN: [
    "dashboard:view",
    "dashboard:finance",
    "dashboard:inventory_cost",
    "dashboard:operations",
    "trip:operate",
    "trip:operate_assigned",
    "inventory:view",
    "finance:view",
    "debt:view",
  ],
  ACCOUNTANT: [
    "dashboard:view",
    "dashboard:finance",
    "dashboard:inventory_cost",
    "dashboard:operations",
    "finance:view",
    "debt:view",
  ],
  DISPATCHER: [
    "dashboard:view",
    "dashboard:operations",
    "trip:operate",
    "trip:operate_assigned",
    "inventory:view",
  ],
  WAREHOUSE: ["dashboard:view", "dashboard:operations", "inventory:view"],
  SALES: ["dashboard:view", "dashboard:operations"],
  DRIVER: ["dashboard:view", "trip:operate_assigned"],
};

export function hasPermission(role: string | undefined, permission: Permission): boolean {
  return Boolean(role && ROLE_PERMISSIONS[role]?.includes(permission));
}

export function dataScopeForRole(role: string | undefined): DataScope {
  if (role === "ADMIN") return "ALL";
  if (role === "DRIVER") return "OWN";
  if (role === "ACCOUNTANT" || role === "DISPATCHER") return "DEPARTMENT";
  if (role === "WAREHOUSE" || role === "SALES") return "ASSIGNED";
  return "NONE";
}

export function dashboardCapabilities(role: string | undefined) {
  return {
    operations: hasPermission(role, "dashboard:operations"),
    finance: hasPermission(role, "dashboard:finance"),
    inventoryCost: hasPermission(role, "dashboard:inventory_cost"),
    dataScope: dataScopeForRole(role),
  };
}

/** The present schema has no department membership or sale assignment relation. */
export function canAccessGlobalDashboard(role: string | undefined): boolean {
  return role === "ADMIN";
}

export function activeTripAccess(role: string | undefined): {
  allowed: boolean;
  scope: "ALL" | "OWN" | "NONE";
  includeCod: boolean;
} {
  if (role === "DRIVER") return { allowed: true, scope: "OWN", includeCod: true };
  if (hasPermission(role, "trip:operate")) return { allowed: true, scope: "ALL", includeCod: false };
  return { allowed: false, scope: "NONE", includeCod: false };
}

const PAGE_PREFIX_ROLES: readonly [string, readonly string[]][] = [
  ["/sales/credit-approvals", ["ADMIN"]],
  ["/overview", ["ADMIN", "ACCOUNTANT", "DISPATCHER", "WAREHOUSE", "SALES"]],
  ["/purchasing", ["ADMIN", "ACCOUNTANT", "WAREHOUSE"]],
  ["/delivery", ["ADMIN", "ACCOUNTANT", "DISPATCHER", "WAREHOUSE", "SALES"]],
  ["/settings", ["ADMIN"]],
  ["/finance", ["ADMIN", "ACCOUNTANT"]],
  ["/hr-misa", ["ADMIN", "ACCOUNTANT"]],
  ["/documents", ["ADMIN", "ACCOUNTANT"]],
  ["/procurement", ["ADMIN", "ACCOUNTANT", "WAREHOUSE"]],
  ["/inventory", ["ADMIN", "ACCOUNTANT", "WAREHOUSE"]],
  // The schema has no customer/order assignment relation yet. Keep the
  // desktop sales surface fail-closed until T-DATA can enforce ASSIGNED scope.
  ["/sales", ["ADMIN", "ACCOUNTANT"]],
  ["/debts", ["ADMIN", "ACCOUNTANT", "SALES"]],
  ["/logistics", ["ADMIN", "ACCOUNTANT", "DISPATCHER", "WAREHOUSE", "SALES"]],
  ["/workspace", ["ADMIN", "ACCOUNTANT", "DISPATCHER", "WAREHOUSE", "SALES"]],
  ["/profile", ["ADMIN", "ACCOUNTANT", "DISPATCHER", "WAREHOUSE", "SALES"]],
  ["/dashboard", ["ADMIN", "ACCOUNTANT", "DISPATCHER", "WAREHOUSE", "SALES"]],
];

/** Coarse page authorization for middleware. API handlers remain authoritative. */
export function canAccessPage(role: string | undefined, pathname: string): boolean {
  if (!role || role === "DRIVER") return false;
  const rule = PAGE_PREFIX_ROLES.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  return Boolean(rule?.[1].includes(role));
}

export function canAccessPwaPersona(role: string | undefined, pathname: string): boolean {
  if (pathname === "/pwa" || pathname === "/pwa/offline") return Boolean(role);
  const persona = pathname.split("/")[2];
  const allowed: Record<string, readonly string[]> = {
    executive: ["ADMIN", "EXECUTIVE"], accounting: ["ADMIN", "ACCOUNTANT"],
    sales: ["ADMIN", "SALES"], warehouse: ["ADMIN", "WAREHOUSE"],
    delivery: ["ADMIN", "DISPATCHER", "DRIVER"],
  };
  return Boolean(persona && allowed[persona]?.includes(role || ""));
}
