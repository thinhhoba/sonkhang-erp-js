import Link from "next/link";
import { Card, Col, Row, Tag, Typography } from "antd";
import { AuditOutlined, ApiOutlined, SafetyCertificateOutlined, TeamOutlined } from "@ant-design/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdminPage } from "@/lib/admin-page-guard";

const destinations = [
  { href: "/settings/users", icon: <TeamOutlined />, title: "Người dùng", description: "Whitelist Google, kích hoạt tài khoản và vai trò nhân viên.", tag: "Quản trị" },
  { href: "/settings/roles", icon: <SafetyCertificateOutlined />, title: "Vai trò & phạm vi", description: "Xem ma trận quyền hiện hành và phạm vi dữ liệu được áp dụng.", tag: "RBAC" },
  { href: "/settings/integrations", icon: <ApiOutlined />, title: "Tích hợp", description: "Theo dõi trạng thái kết nối Sapo, meInvoice và MISA mà không hiển thị bí mật.", tag: "Kết nối" },
  { href: "/settings/audit-logs", icon: <AuditOutlined />, title: "Nhật ký hệ thống", description: "Theo dõi các thay đổi quản trị và thao tác nhạy cảm đã được audit.", tag: "Kiểm toán" },
];

export default async function SettingsLandingPage() {
  await requireAdminPage();
  return <>
    <PageHeader title="Thiết lập hệ thống" description="Quản trị quyền truy cập, tích hợp và nhật ký vận hành Sơn Khang ERP." breadcrumbs={[{ title: "Tổng quan", href: "/overview" }, { title: "Thiết lập hệ thống" }]} />
    <Row gutter={[16, 16]}>
      {destinations.map((item) => <Col xs={24} md={12} key={item.href}><Link href={item.href} style={{ display: "block" }}><Card hoverable style={{ minHeight: 178 }}><div style={{ color: "#2563eb", fontSize: 28, marginBottom: 12 }}>{item.icon}</div><Typography.Title level={4} style={{ margin: "0 0 8px" }}>{item.title}</Typography.Title><Typography.Paragraph type="secondary" style={{ minHeight: 46 }}>{item.description}</Typography.Paragraph><Tag color="blue">{item.tag}</Tag></Card></Link></Col>)}
    </Row>
  </>;
}
