import type { ErpRouteKey } from "@/config/routes";

export type AppRole =
  | "ADMIN"
  | "ACCOUNTANT"
  | "DISPATCHER"
  | "WAREHOUSE"
  | "SALES"
  | "DRIVER";

export interface NavigationItem {
  key: string;
  label: string;
  route?: ErpRouteKey;
  roles?: readonly AppRole[];
}

export interface NavigationModule {
  key: string;
  label: string;
  description: string;
  defaultRoute: ErpRouteKey;
  roles?: readonly AppRole[];
  items: readonly NavigationItem[];
}

const ALL_OFFICE_ROLES: readonly AppRole[] = [
  "ADMIN",
  "ACCOUNTANT",
  "DISPATCHER",
  "WAREHOUSE",
  "SALES",
];

export function isAdminShellRole(role?: string): role is Exclude<AppRole, "DRIVER"> {
  return Boolean(role && ALL_OFFICE_ROLES.includes(role as AppRole));
}

export function canOpenDriverApp(role?: string): boolean {
  return role === "ADMIN" || role === "DISPATCHER" || role === "DRIVER";
}

/**
 * Navigation only points to pages mounted today. Dedicated routes are staged
 * separately, preventing a redesigned menu from creating dead links.
 */
export const ERP_NAVIGATION: readonly NavigationModule[] = [
  {
    key: "overview",
    label: "Tổng quan",
    description: "Điều hành và cảnh báo",
    defaultRoute: "overview",
    roles: ALL_OFFICE_ROLES,
    items: [{ key: "overview-dashboard", label: "Bảng điều hành", route: "overview" }],
  },
  {
    key: "purchasing",
    label: "Mua hàng",
    description: "Nhà cung cấp và đơn mua",
    defaultRoute: "suppliers",
    roles: ["ADMIN", "ACCOUNTANT", "WAREHOUSE"],
    items: [
      { key: "purchasing-suppliers", label: "Nhà cung cấp", route: "suppliers" },
      { key: "purchasing-orders", label: "Đơn mua hàng", route: "purchaseOrders" },
    ],
  },
  {
    key: "inventory",
    label: "Kho hàng",
    description: "Tồn kho, kiểm kê và giá vốn",
    defaultRoute: "inventoryInvoices",
    roles: ["ADMIN", "ACCOUNTANT", "DISPATCHER", "WAREHOUSE"],
    items: [
      { key: "inventory-receipts", label: "Nhập kho & hóa đơn", route: "inventoryInvoices" },
      { key: "inventory-stocktakes", label: "Kiểm kê", route: "stocktakes" },
      { key: "inventory-damaged", label: "Hàng hỏng", route: "damagedStock" },
    ],
  },
  {
    key: "sales",
    label: "Bán hàng",
    description: "Khách hàng và hàng trả",
    defaultRoute: "customers",
    roles: ["ADMIN", "ACCOUNTANT"],
    items: [
      { key: "sales-customers", label: "Khách hàng", route: "customers" },
      { key: "sales-returns", label: "Hàng trả", route: "salesReturns" },
    ],
  },
  {
    key: "delivery",
    label: "Giao hàng",
    description: "Điều phối và chuyến xe",
    defaultRoute: "dispatchOrders",
    roles: ["ADMIN", "ACCOUNTANT", "DISPATCHER", "WAREHOUSE", "SALES"],
    items: [
      { key: "delivery-orders", label: "Đơn chờ giao", route: "dispatchOrders" },
      { key: "delivery-trips", label: "Chuyến giao hàng", route: "trips" },
      { key: "delivery-vehicles", label: "Phương tiện", route: "vehicles" },
    ],
  },
  {
    key: "debt",
    label: "Công nợ",
    description: "Phải thu và hạn mức",
    defaultRoute: "debtOverview",
    roles: ["ADMIN", "ACCOUNTANT", "SALES"],
    items: [{ key: "debt-overview", label: "Tổng quan công nợ", route: "debtOverview" }],
  },
  {
    key: "finance",
    label: "Tài chính, kế toán",
    description: "Thu chi, chứng từ và lương",
    defaultRoute: "transactions",
    roles: ["ADMIN", "ACCOUNTANT"],
    items: [
      { key: "finance-transactions", label: "Thu chi", route: "transactions" },
      { key: "finance-documents", label: "Chứng từ", route: "documents" },
      { key: "finance-payroll", label: "Bảng lương", route: "payroll" },
    ],
  },
  {
    key: "workspace",
    label: "Không gian làm việc",
    description: "Hồ sơ và phối hợp nội bộ",
    defaultRoute: "workspaceOverview",
    roles: ALL_OFFICE_ROLES,
    items: [{ key: "workspace-overview", label: "Không gian làm việc", route: "workspaceOverview" }],
  },
  {
    key: "settings",
    label: "Thiết lập hệ thống",
    description: "Quản trị người dùng và cấu hình",
    defaultRoute: "settingsOverview",
    roles: ["ADMIN"],
    items: [{ key: "settings-overview", label: "Quản trị hệ thống", route: "settingsOverview" }],
  },
] as const;

export const DRIVER_NAVIGATION: readonly NavigationItem[] = [
  { key: "driver-active-trip", label: "Chuyến được giao", route: "driverApp", roles: ["DRIVER"] },
];

export function navigationForRole(role?: string): readonly NavigationModule[] {
  if (!role) return [];
  return ERP_NAVIGATION.filter((module) => !module.roles || module.roles.includes(role as AppRole)).map(
    (module) => ({
      ...module,
      items: module.items.filter((item) => !item.roles || item.roles.includes(role as AppRole)),
    })
  );
}
