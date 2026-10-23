import { Card, Table, Tag, Typography } from "antd";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdminPage } from "@/lib/admin-page-guard";

const rows = [
  { role: "ADMIN", scope: "ALL", access: "Toàn bộ phân hệ, thiết lập, audit và quản trị whitelist" },
  { role: "ACCOUNTANT", scope: "DEPARTMENT", access: "Tài chính, công nợ, payroll và dashboard tài chính" },
  { role: "DISPATCHER", scope: "DEPARTMENT", access: "Điều phối và vận hành chuyến xe" },
  { role: "WAREHOUSE", scope: "ASSIGNED", access: "Nghiệp vụ kho trong phạm vi được phân công" },
  { role: "SALES", scope: "ASSIGNED", access: "Bán hàng, khách hàng và công nợ được phân công" },
  { role: "DRIVER", scope: "OWN", access: "Chỉ chuyến giao được giao cho chính mình qua ứng dụng giao hàng" },
];

export default async function SettingsRolesPage() {
  await requireAdminPage();
  return <><PageHeader title="Vai trò và phạm vi dữ liệu" description="Ma trận quyền hiện đang được thực thi bởi session, middleware và API guard." breadcrumbs={[{ title: "Thiết lập hệ thống", href: "/settings" }, { title: "Vai trò & phạm vi" }]} />
    <Card><Typography.Paragraph type="secondary">Vai trò được chuẩn hóa trong code hiện tại. Thay đổi ma trận quyền cần đi qua review bảo mật, không chỉnh trực tiếp từ giao diện.</Typography.Paragraph><Table rowKey="role" size="middle" pagination={false} dataSource={rows} columns={[{ title: "Vai trò", dataIndex: "role", width: 180, render: (value) => <Tag color={value === "ADMIN" ? "purple" : "blue"}>{value}</Tag> }, { title: "Phạm vi", dataIndex: "scope", width: 180 }, { title: "Quyền chính", dataIndex: "access" }]} /></Card>
  </>;
}
