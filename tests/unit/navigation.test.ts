import { describe, expect, it } from "vitest";
import { canOpenDriverApp, isAdminShellRole, navigationForRole } from "@/config/navigation";
import { ERP_ROUTES, getRouteForPathname } from "@/config/routes";

describe("ERP navigation", () => {
  it("shows exactly the nine approved ERP modules to an administrator", () => {
    expect(navigationForRole("ADMIN").map((item) => item.key)).toEqual([
      "overview", "purchasing", "inventory", "sales", "delivery", "debt", "finance", "workspace", "settings",
    ]);
  });

  it("fails closed for an unknown role", () => {
    expect(navigationForRole("UNKNOWN")).toEqual([]);
    expect(navigationForRole()).toEqual([]);
  });

  it("resolves a deep legacy page to its mounted route", () => {
    expect(getRouteForPathname("/inventory/invoices/inv-123")).toEqual(ERP_ROUTES.inventoryInvoices);
  });

  it("gives every navigation destination a unique mounted URL", () => {
    const hrefs = navigationForRole("ADMIN").flatMap((module) =>
      module.items.flatMap((item) => (item.route ? [ERP_ROUTES[item.route].href] : []))
    );
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs).toContain("/debts");
    expect(hrefs).toContain("/purchasing/suppliers");
    expect(hrefs).toContain("/delivery/trips");
    expect(hrefs).toContain("/workspace");
    expect(hrefs).toContain("/settings");
  });

  it("allows only office roles into the admin shell", () => {
    expect(isAdminShellRole("ADMIN")).toBe(true);
    expect(isAdminShellRole("ACCOUNTANT")).toBe(true);
    expect(isAdminShellRole("DRIVER")).toBe(false);
    expect(isAdminShellRole("UNKNOWN")).toBe(false);
  });

  it("limits the driver app shortcut to operational roles", () => {
    expect(canOpenDriverApp("ADMIN")).toBe(true);
    expect(canOpenDriverApp("DISPATCHER")).toBe(true);
    expect(canOpenDriverApp("ACCOUNTANT")).toBe(false);
    expect(canOpenDriverApp("WAREHOUSE")).toBe(false);
    expect(canOpenDriverApp()).toBe(false);
  });
});
