import Link from "next/link";
import { Card, Col, Row, Tag, Typography } from "antd";
import { FileSearchOutlined, InboxOutlined, SafetyCertificateOutlined, ShoppingCartOutlined, ShopOutlined } from "@ant-design/icons";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const { Title, Paragraph } = Typography;

const surfaces = [
  { href: "/purchasing/suppliers", title: "Nhà cung cấp", description: "Hồ sơ, điều khoản thanh toán và hạn mức đối tác.", icon: <ShopOutlined />, tone: "blue", roles: ["ADMIN", "ACCOUNTANT", "WAREHOUSE"] },
  { href: "/purchasing/purchase-orders", title: "Đơn mua hàng", description: "Soạn thảo, duyệt PO và theo dõi số lượng nhận.", icon: <ShoppingCartOutlined />, tone: "geekblue", roles: ["ADMIN", "ACCOUNTANT", "WAREHOUSE"] },
  { href: "/purchasing/receipts", title: "Phiếu nhập", description: "Suy chiếu chỉ đọc từ hóa đơn đã nhập kho; không tạo dữ liệu giả.", icon: <InboxOutlined />, tone: "green", roles: ["ADMIN", "ACCOUNTANT"] },
  { href: "/purchasing/invoices", title: "Hóa đơn đầu vào", description: "Hóa đơn meInvoice, mapping hàng hóa và trạng thái nhập kho.", icon: <FileSearchOutlined />, tone: "gold", roles: ["ADMIN", "ACCOUNTANT"] },
  { href: "/purchasing/three-way-match", title: "Đối chiếu 3 bên", description: "Đối chiếu PO, thực nhập và hóa đơn theo từng đơn.", icon: <SafetyCertificateOutlined />, tone: "purple", roles: ["ADMIN", "ACCOUNTANT"] },
];

export async function PurchasingHub() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const visibleSurfaces = surfaces.filter((surface) => role && surface.roles.includes(role));
  return (
    <main>
      <Title level={2}>Mua hàng</Title>
      <Paragraph type="secondary">Luồng kiểm soát mua hàng: nhà cung cấp → PO → hóa đơn/nhập kho → đối chiếu ba bên.</Paragraph>
      <Row gutter={[16, 16]}>
        {visibleSurfaces.map((surface) => (
          <Col key={surface.href} xs={24} sm={12} xl={8}>
            <Link href={surface.href} aria-label={surface.title}>
              <Card hoverable style={{ minHeight: 172 }}>
                <Tag color={surface.tone} icon={surface.icon}>{surface.title}</Tag>
                <Paragraph style={{ marginTop: 18, marginBottom: 0 }}>{surface.description}</Paragraph>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </main>
  );
}
