"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  AccountBookOutlined,
  AppstoreOutlined,
  CarOutlined,
  DollarOutlined,
  HomeOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Drawer, Dropdown, Input, Layout, Menu, Space } from "antd";
import type { MenuProps } from "antd";
import { canOpenDriverApp, DRIVER_NAVIGATION, navigationForRole, type NavigationModule } from "@/config/navigation";
import { ERP_ROUTES, getRouteForPathname, type ErpRouteKey } from "@/config/routes";

const { Header, Sider, Content, Footer } = Layout;

export interface ShellUser {
  id: string;
  name: string;
  email?: string;
  image?: string;
  role: string;
  code?: string;
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  overview: <HomeOutlined />,
  purchasing: <ShopOutlined />,
  inventory: <InboxOutlined />,
  sales: <DollarOutlined />,
  delivery: <CarOutlined />,
  debt: <AccountBookOutlined />,
  finance: <WalletOutlined />,
  workspace: <TeamOutlined />,
  settings: <SettingOutlined />,
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị hệ thống",
  ACCOUNTANT: "Kế toán",
  DISPATCHER: "Điều phối",
  WAREHOUSE: "Kho hàng",
  SALES: "Kinh doanh",
  DRIVER: "Giao hàng",
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function menuItemsForModules(modules: readonly NavigationModule[]): MenuProps["items"] {
  return modules.map((module) => ({
    key: `module-${module.key}`,
    icon: MODULE_ICONS[module.key] || <AppstoreOutlined />,
    label: module.label,
    children: module.items.map((item) => ({
      key: item.key,
      label: item.route ? ERP_ROUTES[item.route].label : item.label,
    })),
  }));
}

function routeKeyForMenuItem(modules: readonly NavigationModule[], key: string): ErpRouteKey | undefined {
  for (const module of modules) {
    const item = module.items.find((candidate) => candidate.key === key);
    if (item?.route) return item.route;
  }
  return undefined;
}

function selectedMenuKey(pathname: string, modules: readonly NavigationModule[]) {
  const route = getRouteForPathname(pathname);
  if (!route) return undefined;
  for (const module of modules) {
    const item = module.items.find((candidate) => candidate.route && ERP_ROUTES[candidate.route].href === route.href);
    if (item) return item.key;
  }
  return undefined;
}

function openModuleKeys(pathname: string, modules: readonly NavigationModule[]) {
  const selected = selectedMenuKey(pathname, modules);
  const module = modules.find((candidate) => candidate.items.some((item) => item.key === selected));
  return module ? [`module-${module.key}`] : [];
}

export function ErpShell({ children, user }: { children: React.ReactNode; user: ShellUser | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const modules = useMemo(() => navigationForRole(user?.role), [user?.role]);
  const isDriver = user?.role === "DRIVER";
  const driverItems = useMemo(
    () => DRIVER_NAVIGATION.map((item) => ({ key: item.key, icon: <CarOutlined />, label: item.label })),
    []
  );
  const navigationItems = isDriver ? driverItems : menuItemsForModules(modules);
  const selectedKey = isDriver
    ? pathname.startsWith(ERP_ROUTES.driverApp.href)
      ? "driver-active-trip"
      : undefined
    : selectedMenuKey(pathname, modules);

  const navigate = (key: string) => {
    const routeKey = isDriver
      ? DRIVER_NAVIGATION.find((item) => item.key === key)?.route
      : routeKeyForMenuItem(modules, key);
    if (routeKey) {
      router.push(ERP_ROUTES[routeKey].href);
      setMobileOpen(false);
    }
  };

  const sidebar = (
    <>
      <Link href={isDriver ? ERP_ROUTES.driverApp.href : ERP_ROUTES.overview.href} className="erp-brand" aria-label="Sơn Khang ERP">
        <span className="erp-brand__mark">SK</span>
        {!collapsed && <span className="erp-brand__copy"><strong>SƠN KHANG ERP</strong><small>{isDriver ? "Giao hàng" : "Hệ điều hành doanh nghiệp"}</small></span>}
      </Link>
      <nav className="erp-nav" aria-label="Điều hướng chính">
        <Menu
          mode="inline"
          theme="dark"
          items={navigationItems}
          selectedKeys={selectedKey ? [selectedKey] : []}
          defaultOpenKeys={isDriver ? [] : openModuleKeys(pathname, modules)}
          onClick={({ key }) => navigate(String(key))}
        />
      </nav>
      {!collapsed && canOpenDriverApp(user?.role) && (
        <Link className="erp-driver-link" href={ERP_ROUTES.driverApp.href}>
          <CarOutlined />
          <span><strong>Ứng dụng giao hàng</strong><small>Mở giao diện tài xế</small></span>
        </Link>
      )}
    </>
  );

  const userMenu: MenuProps["items"] = [
    { key: "profile", icon: <UserOutlined />, label: "Hồ sơ cá nhân", onClick: () => router.push(ERP_ROUTES.profile.href) },
    { key: "signout", icon: <LogoutOutlined />, danger: true, label: "Đăng xuất", onClick: () => void signOut({ callbackUrl: "/auth/signin" }) },
  ];

  return (
    <Layout className="erp-shell">
      <Sider
        className="erp-sider erp-sider--desktop"
        width={272}
        collapsedWidth={76}
        collapsible
        collapsed={collapsed}
        trigger={null}
      >
        {sidebar}
      </Sider>
      <Drawer
        className="erp-mobile-nav"
        placement="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        width={286}
        closable={false}
        styles={{ body: { padding: 0, background: "#0f172a" } }}
      >
        <div className="erp-mobile-nav__content">{sidebar}</div>
      </Drawer>
      <Layout className="erp-main-layout">
        <Header className="erp-header">
          <div className="erp-header__left">
            <Button className="erp-header__mobile-menu" type="text" icon={<MenuUnfoldOutlined />} onClick={() => setMobileOpen(true)} aria-label="Mở menu" />
            <Button className="erp-header__collapse" type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"} />
            <Input
              className="erp-global-search"
              prefix={<SearchOutlined />}
              placeholder="Tìm đơn, khách hàng, chứng từ..."
              aria-label="Tìm kiếm toàn hệ thống"
              onPressEnter={(event) => {
                const query = event.currentTarget.value.trim();
                if (query) router.push(`${ERP_ROUTES.dispatchOrders.href}?q=${encodeURIComponent(query)}`);
              }}
            />
          </div>
          <Space size={12} align="center">
            {user ? (
              <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={["click"]}>
                <button type="button" className="erp-user-menu" aria-label="Mở menu tài khoản">
                  <Avatar src={user.image} className="erp-user-menu__avatar">{initials(user.name)}</Avatar>
                  <span className="erp-user-menu__copy"><strong>{user.name}</strong><small>{ROLE_LABELS[user.role] || user.role || "Tài khoản"}</small></span>
                </button>
              </Dropdown>
            ) : (
              <Link className="erp-signin-link" href="/auth/signin">Đăng nhập</Link>
            )}
          </Space>
        </Header>
        <Content className="erp-content">{children}</Content>
        <Footer className="erp-footer">
          <span>© 2026 Công ty TNHH Thực phẩm Sơn Khang</span>
          <span>ERP vận hành nội bộ</span>
        </Footer>
      </Layout>
    </Layout>
  );
}
