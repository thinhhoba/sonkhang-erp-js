export interface RouteMetadata {
  /** A stable internal URL that exists in the current application. */
  href: string;
  label: string;
  module: string;
  /** Legacy paths are intentionally kept while the dedicated-route migration is staged. */
  legacy?: boolean;
}

export const ERP_ROUTES = {
  overview: { href: "/overview", label: "Tổng quan", module: "overview" },
  suppliers: { href: "/purchasing/suppliers", label: "Nhà cung cấp", module: "purchasing" },
  purchaseOrders: { href: "/purchasing/purchase-orders", label: "Đơn mua hàng", module: "purchasing" },
  inventoryInvoices: { href: "/purchasing/invoices", label: "Nhập kho & hóa đơn", module: "inventory" },
  stocktakes: { href: "/inventory/stocktakes", label: "Kiểm kê", module: "inventory" },
  damagedStock: { href: "/inventory/issues", label: "Hàng hỏng", module: "inventory" },
  customers: { href: "/sales/customers", label: "Khách hàng", module: "sales", legacy: true },
  salesReturns: { href: "/sales/returns", label: "Hàng trả", module: "sales", legacy: true },
  dispatchOrders: { href: "/delivery/dispatch", label: "Đơn chờ giao", module: "delivery" },
  trips: { href: "/delivery/trips", label: "Chuyến giao hàng", module: "delivery" },
  vehicles: { href: "/delivery/vehicles", label: "Phương tiện", module: "delivery" },
  driverApp: { href: "/driver-app", label: "Ứng dụng giao hàng", module: "delivery", legacy: true },
  debtOverview: { href: "/debts", label: "Tổng quan công nợ", module: "debt" },
  transactions: { href: "/finance/transactions", label: "Thu chi", module: "finance", legacy: true },
  documents: { href: "/finance/documents", label: "Chứng từ", module: "finance" },
  payroll: { href: "/finance/payroll", label: "Bảng lương", module: "finance" },
  profile: { href: "/workspace/profile", label: "Hồ sơ cá nhân", module: "workspace" },
  workspaceOverview: { href: "/workspace", label: "Không gian làm việc", module: "workspace" },
  settingsOverview: { href: "/settings", label: "Thiết lập hệ thống", module: "settings" },
} as const satisfies Record<string, RouteMetadata>;

export type ErpRouteKey = keyof typeof ERP_ROUTES;

export const DEDICATED_ROUTE_TARGETS = {
  overview: "/overview",
  purchasing: "/purchasing",
  inventory: "/inventory",
  sales: "/sales",
  delivery: "/delivery",
  debt: "/debts",
  finance: "/finance",
  workspace: "/workspace",
  settings: "/settings",
} as const;

const LEGACY_ROUTE_ALIASES: readonly [string, ErpRouteKey][] = [
  ["/dashboard", "overview"], ["/procurement/suppliers", "suppliers"],
  ["/procurement/orders", "purchaseOrders"], ["/inventory/invoices", "inventoryInvoices"],
  ["/inventory/stocktake", "stocktakes"], ["/inventory/damaged", "damagedStock"],
  ["/logistics/orders", "dispatchOrders"], ["/logistics/trips", "trips"],
  ["/logistics/vehicles", "vehicles"], ["/documents", "documents"],
  ["/hr-misa/payroll", "payroll"], ["/profile", "profile"],
];

/** Returns the deepest currently mounted navigation route for a pathname. */
export function getRouteForPathname(pathname: string): RouteMetadata | undefined {
  const canonical = Object.values(ERP_ROUTES)
    .filter((route) => pathname === route.href || pathname.startsWith(`${route.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (canonical) return canonical;
  const legacy = LEGACY_ROUTE_ALIASES
    .filter(([href]) => pathname === href || pathname.startsWith(`${href}/`))
    .sort(([a], [b]) => b.length - a.length)[0];
  return legacy ? ERP_ROUTES[legacy[1]] : undefined;
}
