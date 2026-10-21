"use client";

import React, { useState } from "react";
import {
  Layout,
  Menu,
  Typography,
  Space,
  Tag,
  Button,
  Avatar,
  Input,
  Badge,
  Dropdown,
  Select,
  Popover,
  List,
  Divider,
} from "antd";
import {
  InboxOutlined,
  CarOutlined,
  DollarCircleOutlined,
  MobileOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  AuditOutlined,
  DashboardOutlined,
  FileTextOutlined,
  WalletOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SearchOutlined,
  LogoutOutlined,
  SettingOutlined,
  CheckCircleTwoTone,
  CrownOutlined,
  TeamOutlined,
  AccountBookOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text } = Typography;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [currentRole, setCurrentRole] = useState("CEO");

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined style={{ fontSize: 16 }} />,
      label: "Dashboard (Bộ phận)",
    },
    {
      key: "procurement-grp",
      icon: <ShopOutlined style={{ fontSize: 16 }} />,
      label: "Mua hàng & Kho",
      children: [
        {
          key: "/procurement/suppliers",
          label: "Hồ sơ Nhà cung cấp",
        },
        {
          key: "/procurement/orders",
          label: "Đơn mua (PO) & 3-Way Match",
        },
        {
          key: "/inventory/invoices",
          label: "Hóa đơn meInvoice & Giá vốn",
        },
        {
          key: "/inventory/stocktake",
          label: "Kiểm kê kho định kỳ",
        },
        {
          key: "/inventory/damaged",
          label: "Xuất hủy hàng hỏng/vỡ",
        },
      ],
    },
    {
      key: "sales-grp",
      icon: <DollarCircleOutlined style={{ fontSize: 16 }} />,
      label: "Bán hàng & Công nợ",
      children: [
        {
          key: "/sales/customers",
          label: "Khách hàng & Hạn mức",
        },
        {
          key: "/sales/returns",
          label: "Hàng đổi trả (Returns)",
        },
      ],
    },
    {
      key: "logistics-grp",
      icon: <CarOutlined style={{ fontSize: 16 }} />,
      label: "Giao vận & Phương tiện",
      children: [
        {
          key: "/logistics/orders",
          label: "Đơn hàng Sapo & Cân nặng",
        },
        {
          key: "/logistics/trips",
          label: "Quản lý Chuyến xe Tera V6",
        },
        {
          key: "/logistics/vehicles",
          label: "Đội xe & Lịch bảo dưỡng",
        },
      ],
    },
    {
      key: "finance-grp",
      icon: <WalletOutlined style={{ fontSize: 16 }} />,
      label: "Tài chính & Chứng từ",
      children: [
        {
          key: "/finance/transactions",
          label: "Thu - Chi nội bộ (Quỹ)",
        },
        {
          key: "/documents",
          label: "Kho Chứng từ Số hóa",
        },
      ],
    },
    {
      key: "hr-grp",
      icon: <AuditOutlined style={{ fontSize: 16 }} />,
      label: "Lương & MISA",
      children: [
        {
          key: "/hr-misa/payroll",
          label: "Bảng lương & Xuất file MISA",
        },
      ],
    },
    {
      type: "divider" as const,
      style: { borderColor: "rgba(255, 255, 255, 0.08)", margin: "8px 0" },
    },
    {
      key: "/profile",
      icon: <UserOutlined style={{ fontSize: 16 }} />,
      label: "Hồ sơ & Mạng xã hội",
    },
    {
      key: "/driver-app",
      icon: <MobileOutlined style={{ fontSize: 16 }} />,
      label: "Ứng dụng Tài xế (PWA)",
    },
  ];

  const getSelectedKey = () => {
    if (pathname === "/" || pathname.startsWith("/dashboard")) return "/dashboard";
    if (pathname.startsWith("/procurement/suppliers")) return "/procurement/suppliers";
    if (pathname.startsWith("/procurement/orders")) return "/procurement/orders";
    if (pathname.startsWith("/inventory/invoices")) return "/inventory/invoices";
    if (pathname.startsWith("/inventory/stocktake")) return "/inventory/stocktake";
    if (pathname.startsWith("/inventory/damaged")) return "/inventory/damaged";
    if (pathname.startsWith("/sales/customers")) return "/sales/customers";
    if (pathname.startsWith("/sales/returns")) return "/sales/returns";
    if (pathname.startsWith("/logistics/orders")) return "/logistics/orders";
    if (pathname.startsWith("/logistics/trips")) return "/logistics/trips";
    if (pathname.startsWith("/logistics/vehicles")) return "/logistics/vehicles";
    if (pathname.startsWith("/finance/transactions")) return "/finance/transactions";
    if (pathname.startsWith("/hr-misa/payroll")) return "/hr-misa/payroll";
    if (pathname.startsWith("/documents")) return "/documents";
    if (pathname.startsWith("/profile")) return "/profile";
    if (pathname.startsWith("/driver-app")) return "/driver-app";
    return pathname;
  };

  const notifications = [
    {
      id: 1,
      title: "Chuyến xe Tera V6 hoàn tất",
      desc: "Chuyến xe TRIP-20261021-01 đã giao xong 18 điểm, chờ khóa sổ COD.",
      time: "10 phút trước",
      type: "success",
    },
    {
      id: 2,
      title: "Cảnh báo vượt hạn mức nợ",
      desc: "Đại lý Bách Hóa Xanh vượt hạn mức 15.000.000đ cần phê duyệt.",
      time: "25 phút trước",
      type: "warning",
    },
    {
      id: 3,
      title: "Đồng bộ hóa đơn meInvoice",
      desc: "Đã nhận 2 hóa đơn mới từ nhà cung cấp Indofood VN.",
      time: "1 giờ trước",
      type: "info",
    },
  ];

  const notificationContent = (
    <div style={{ width: 320 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 8,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Text strong style={{ fontSize: 14 }}>
          Thông Báo Hoạt Động (3)
        </Text>
        <Button type="link" size="small" style={{ padding: 0 }}>
          Đánh dấu đã đọc
        </Button>
      </div>
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item style={{ padding: "10px 0" }}>
            <List.Item.Meta
              avatar={
                item.type === "success" ? (
                  <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 18 }} />
                ) : (
                  <ExclamationCircleOutlined style={{ fontSize: 18, color: "#faad14" }} />
                )
              }
              title={<span style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</span>}
              description={
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{item.desc}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{item.time}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Hồ sơ cá nhân",
      onClick: () => router.push("/profile"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cấu hình hệ thống",
      onClick: () => router.push("/profile"),
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      danger: true,
      label: "Đăng xuất",
      onClick: () => router.push("/profile"),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Scoped CSS for Modern SaaS Sidebar & Theme */}
      <style jsx global>{`
        .modern-saas-sidebar {
          background: #0f172a !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .modern-saas-sidebar .ant-layout-sider-children {
          display: flex;
          flex-direction: column;
          background: #0f172a;
        }
        .modern-saas-sidebar .ant-menu-dark {
          background: #0f172a !important;
          color: #94a3b8 !important;
        }
        .modern-saas-sidebar .ant-menu-dark .ant-menu-item,
        .modern-saas-sidebar .ant-menu-dark .ant-menu-submenu-title {
          color: #94a3b8 !important;
          border-radius: 8px !important;
          margin: 4px 8px !important;
          width: calc(100% - 16px) !important;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .modern-saas-sidebar .ant-menu-dark .ant-menu-item:hover,
        .modern-saas-sidebar .ant-menu-dark .ant-menu-submenu-title:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .modern-saas-sidebar .ant-menu-dark .ant-menu-item-selected {
          background: #2563eb !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35) !important;
        }
        .modern-saas-sidebar .ant-menu-dark .ant-menu-sub {
          background: #0b1120 !important;
          border-radius: 8px !important;
        }
        .modern-saas-sidebar .ant-layout-sider-trigger {
          background: #0b1120 !important;
          color: #94a3b8 !important;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .global-search-input input {
          background: #f8fafc !important;
          border-radius: 20px !important;
        }
      `}</style>

      {/* 1. SIDEBAR (Bên trái: Nền tối hiện đại #0f172a, chữ #94a3b8, active #2563eb bo góc 8px) */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(val) => setCollapsed(val)}
        width={264}
        className="modern-saas-sidebar"
        style={{
          boxShadow: "2px 0 12px rgba(0, 0, 0, 0.15)",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 100,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: collapsed ? "18px 8px" : "18px 16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 18,
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.4)",
              flexShrink: 0,
            }}
          >
            SK
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  lineHeight: "1.2",
                  whiteSpace: "nowrap",
                }}
              >
                SƠN KHANG ERP
              </div>
              <div
                style={{
                  color: "#38bdf8",
                  fontSize: 11,
                  fontWeight: 500,
                  marginTop: 2,
                  whiteSpace: "nowrap",
                }}
              >
                Operations Hub • Bản 6
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 0" }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            defaultOpenKeys={["procurement-grp", "sales-grp", "logistics-grp"]}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
            style={{ borderRight: 0 }}
          />
        </div>

        {/* Bottom Driver App Quick Link */}
        {!collapsed && (
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              background: "#0b1120",
            }}
          >
            <div
              style={{
                background: "rgba(37, 99, 235, 0.15)",
                border: "1px solid rgba(37, 99, 235, 0.3)",
                borderRadius: 8,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ color: "#93c5fd", fontSize: 12, fontWeight: 600 }}>
                  Tera V6 Dispatch
                </div>
                <div style={{ color: "#64748b", fontSize: 11 }}>Sẵn sàng nhận lệnh</div>
              </div>
              <Link href="/driver-app">
                <Tag color="blue" style={{ margin: 0, cursor: "pointer", borderRadius: 4 }}>
                  Mở App
                </Tag>
              </Link>
            </div>
          </div>
        )}
      </Sider>

      {/* Main Content Area */}
      <Layout style={{ background: "#f8fafc" }}>
        {/* 2. HEADER (Phía trên: Nền trắng, thu gọn sidebar, search nhanh, switch bộ phận, chuông badge, avatar) */}
        <Header
          style={{
            padding: "0 24px",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #e2e8f0",
            height: 64,
            position: "sticky",
            top: 0,
            zIndex: 90,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* Left: Collapse toggle + Global Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: 16,
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#475569",
              }}
            />

            {/* Global Search Bar bo tròn */}
            <Input.Search
              placeholder="Tìm nhanh mã đơn, hóa đơn, khách hàng, xe..."
              allowClear
              className="global-search-input"
              style={{
                width: 340,
                borderRadius: 20,
              }}
              onSearch={(value) => {
                if (value.trim()) {
                  router.push(`/logistics/orders?q=${encodeURIComponent(value.trim())}`);
                }
              }}
            />
          </div>

          {/* Right: Role Switcher + Notifications + User Avatar */}
          <Space direction="horizontal" size={16} align="center">
            {/* Chuyển đổi nhanh góc nhìn Bộ phận */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#f1f5f9",
                padding: "4px 10px",
                borderRadius: 20,
                border: "1px solid #e2e8f0",
              }}
            >
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                Góc nhìn:
              </Text>
              <Select
                value={currentRole}
                onChange={(val) => {
                  setCurrentRole(val);
                  router.push(`/dashboard?role=${val}`);
                }}
                size="small"
                variant="borderless"
                style={{ width: 145, fontWeight: 600, color: "#1e293b" }}
                options={[
                  { label: "👑 Giám Đốc (CEO)", value: "CEO" },
                  { label: "💼 Kinh Doanh", value: "SALES" },
                  { label: "📊 Kế Toán", value: "ACCOUNTANT" },
                  { label: "📦 Thủ Kho", value: "WAREHOUSE" },
                  { label: "🚚 Lái Xe (Tera)", value: "DRIVER" },
                ]}
              />
            </div>

            {/* Chuông thông báo có Badge */}
            <Popover
              content={notificationContent}
              trigger="click"
              placement="bottomRight"
              arrow={{ pointAtCenter: true }}
            >
              <Badge count={3} offset={[-2, 4]} size="small">
                <Button
                  type="text"
                  shape="circle"
                  icon={<BellOutlined style={{ fontSize: 18, color: "#475569" }} />}
                  style={{ width: 40, height: 40 }}
                />
              </Badge>
            </Popover>

            <Divider orientationMargin={0} type="vertical" style={{ height: 24, margin: "0 4px" }} />

            {/* User Profile Avatar with Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 8,
                  transition: "background 0.2s",
                }}
              >
                <Avatar
                  size={36}
                  style={{
                    backgroundColor: "#2563eb",
                    fontWeight: 700,
                    fontSize: 14,
                    boxShadow: "0 2px 6px rgba(37, 99, 235, 0.35)",
                  }}
                  icon={<UserOutlined />}
                />
                <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                    Vũ Sơn Khang
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Admin Whitelist</div>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* Main Page Content */}
        <Content
          style={{
            margin: "24px 24px 0 24px",
            minHeight: "calc(100vh - 145px)",
            maxWidth: "1600px",
            width: "calc(100% - 48px)",
            alignSelf: "center",
          }}
        >
          {children}
        </Content>

        {/* 5. FOOTER (Chân trang: Cố định đáy nội dung, bản quyền bên trái, liên kết bên phải) */}
        <Footer
          style={{
            background: "#ffffff",
            borderTop: "1px solid #e2e8f0",
            padding: "16px 32px",
            marginTop: 32,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            color: "#64748b",
            fontSize: 13,
          }}
        >
          <div>
            © 2026 <strong style={{ color: "#0f172a" }}>CÔNG TY TNHH THỰC PHẨM SƠN KHANG</strong>.
            All rights reserved.
          </div>
          <Space split={<span style={{ color: "#cbd5e1" }}>•</span>} size={12}>
            <Link
              href="/documents"
              style={{ color: "#64748b", textDecoration: "none" }}
              className="hover:text-blue-600"
            >
              Quy chế nội bộ
            </Link>
            <Link
              href="/logistics/orders"
              style={{ color: "#64748b", textDecoration: "none" }}
              className="hover:text-blue-600"
            >
              Trạng thái Webhook Sapo/MISA
            </Link>
            <Link
              href="/profile"
              style={{ color: "#64748b", textDecoration: "none" }}
              className="hover:text-blue-600"
            >
              Hỗ trợ kỹ thuật
            </Link>
          </Space>
        </Footer>
      </Layout>
    </Layout>
  );
}
