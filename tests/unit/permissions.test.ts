import { describe, expect, it } from "vitest";
import {
  activeTripAccess,
  canAccessPage,
  canAccessPwaPersona,
  canAccessGlobalDashboard,
  dashboardCapabilities,
  dataScopeForRole,
  hasPermission,
} from "@/lib/permissions";

describe("permission foundation", () => {
  it("fails closed for an unknown role", () => {
    expect(hasPermission("UNKNOWN", "dashboard:finance")).toBe(false);
    expect(dataScopeForRole("UNKNOWN")).toBe("NONE");
  });

  it("keeps financial dashboard fields limited to accounting roles", () => {
    expect(dashboardCapabilities("ACCOUNTANT").finance).toBe(true);
    expect(dashboardCapabilities("DISPATCHER").finance).toBe(false);
    expect(dashboardCapabilities("DRIVER").inventoryCost).toBe(false);
  });

  it("limits driver data to their own resources", () => {
    expect(dataScopeForRole("DRIVER")).toBe("OWN");
    expect(hasPermission("DRIVER", "trip:operate_assigned")).toBe(true);
    expect(hasPermission("DRIVER", "trip:operate")).toBe(false);
  });

  it("fails closed when department-scoped dashboard data has no schema-backed scope", () => {
    expect(canAccessGlobalDashboard("ADMIN")).toBe(true);
    expect(canAccessGlobalDashboard("ACCOUNTANT")).toBe(false);
    expect(canAccessGlobalDashboard("DISPATCHER")).toBe(false);
    expect(dashboardCapabilities("ACCOUNTANT").dataScope).toBe("DEPARTMENT");
  });

  it("projects active-trip data by permission and scope", () => {
    expect(activeTripAccess("DRIVER")).toEqual({ allowed: true, scope: "OWN", includeCod: true });
    expect(activeTripAccess("DISPATCHER")).toEqual({ allowed: true, scope: "ALL", includeCod: false });
    expect(activeTripAccess("ACCOUNTANT")).toEqual({ allowed: false, scope: "NONE", includeCod: false });
  });

  it("fails closed for direct ERP page access", () => {
    expect(canAccessPage("ACCOUNTANT", "/finance/transactions")).toBe(true);
    expect(canAccessPage("DISPATCHER", "/finance/transactions")).toBe(false);
    expect(canAccessPage("SALES", "/sales/customers")).toBe(false);
    expect(canAccessPage("ADMIN", "/sales/credit-approvals")).toBe(true);
    expect(canAccessPage("ACCOUNTANT", "/sales/credit-approvals")).toBe(false);
    expect(canAccessPage("WAREHOUSE", "/procurement/orders")).toBe(true);
    expect(canAccessPage("DRIVER", "/dashboard")).toBe(false);
    expect(canAccessPage("UNKNOWN", "/dashboard")).toBe(false);
  });

  it("isolates PWA persona routes", () => {
    expect(canAccessPwaPersona("ACCOUNTANT", "/pwa/accounting")).toBe(true);
    expect(canAccessPwaPersona("ACCOUNTANT", "/pwa/executive")).toBe(false);
    expect(canAccessPwaPersona("DRIVER", "/pwa/delivery/trips")).toBe(true);
    expect(canAccessPwaPersona("SALES", "/pwa/warehouse")).toBe(false);
  });
});
