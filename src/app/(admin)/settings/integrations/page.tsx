import { Alert, Card, Col, Row, Tag, Typography } from "antd";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdminPage } from "@/lib/admin-page-guard";

const integrations = [
  { name: "Sapo", purpose: "Đồng bộ đơn hàng bán và khách hàng", status: "Cấu hình qua biến môi trường", color: "blue" },
  { name: "meInvoice", purpose: "Tiếp nhận hóa đơn đầu vào", status: "Cấu hình qua biến môi trường", color: "blue" },
  { name: "MISA", purpose: "Xuất dữ liệu kế toán", status: "Cấu hình qua biến môi trường", color: "blue" },
];

export default async function SettingsIntegrationsPage() {
  await requireAdminPage();
  return <><PageHeader title="Tích hợp hệ thống" description="Theo dõi điểm kết nối nghiệp vụ. Token và webhook secret không được hiển thị hoặc chỉnh sửa trên giao diện." breadcrumbs={[{ title: "Thiết lập hệ thống", href: "/settings" }, { title: "Tích hợp" }]} />
    <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Thông tin bí mật chỉ được quản lý qua môi trường triển khai an toàn. Trạng thái kết nối sẽ được bổ sung từ health check riêng trong workstream tích hợp." />
    <Row gutter={[16, 16]}>{integrations.map((item) => <Col xs={24} md={8} key={item.name}><Card title={item.name}><Typography.Paragraph>{item.purpose}</Typography.Paragraph><Tag color={item.color}>{item.status}</Tag></Card></Col>)}</Row>
  </>;
}
