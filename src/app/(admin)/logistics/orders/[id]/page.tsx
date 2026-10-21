"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Breadcrumb,
  Row,
  Col,
  Statistic,
  Spin,
  Alert,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  ShoppingOutlined,
  CarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  InboxOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface ProductInfo {
  id: string;
  sku: string;
  name: string;
  baseUnit: string;
  weightKg: number;
  avgCostPrice: number;
  currentStock: number;
}

interface OrderItem {
  id: string;
  orderedQty: number;
  deliveredQty: number;
  returnedQty: number;
  unitPrice: number;
  lineAmount: number;
  lineWeightKg: number;
  product: ProductInfo;
}

interface TripInfo {
  id: string;
  tripCode: string;
  vehiclePlate: string | null;
  status: string;
  departedAt: string | null;
  returnedAt: string | null;
  driver: {
    id: string;
    code: string;
    fullName: string;
    phone: string;
  };
}

interface TripStopInfo {
  id: string;
  stopSequence: number;
  status: string;
  arrivedAt: string | null;
  completedAt: string | null;
  actualDeliveredKg: number;
  cashCollected: number;
  transferCollected: number;
  debtSigned: number;
  failOrPartialReason: string | null;
  proofImageUrl: string | null;
  trip: TripInfo;
}

interface OrderDetail {
  id: string;
  sapoOrderId: string;
  orderCode: string;
  sapoCustomerId: string | null;
  misaCustomerCode: string | null;
  customerName: string;
  customerPhone: string | null;
  shippingAddress: string;
  totalWeightKg: number;
  totalAmount: number;
  codAmountRequired: number;
  deliveryStatus: "WAITING_DISPATCH" | "IN_TRANSIT" | "DELIVERED" | "PARTIAL" | "CANCELLED";
  misaSyncStatus: string;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  tripStops: TripStopInfo[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrderDetail = async () => {
    if (!orderId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/logistics/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
      } else {
        setErrorMsg(data.error || "Không tìm thấy dữ liệu đơn hàng!");
      }
    } catch (err: any) {
      setErrorMsg("Lỗi khi kết nối máy chủ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải thông tin chi tiết đơn hàng...</div>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Không tìm thấy đơn hàng"
          description={errorMsg || "Đơn hàng không tồn tại hoặc đã bị xóa."}
          type="error"
          showIcon
          action={
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/logistics/orders")}>
              Quay lại danh sách đơn hàng
            </Button>
          }
        />
      </div>
    );
  }

  const latestStop = order.tripStops?.[0];
  const linkedTrip = latestStop?.trip;

  // Render tag trạng thái
  const renderDeliveryTag = (st: string) => {
    switch (st) {
      case "WAITING_DISPATCH":
        return <Tag color="cyan">Chờ xếp xe (Sẵn sàng)</Tag>;
      case "IN_TRANSIT":
        return <Tag color="blue">Đang trên xe giao</Tag>;
      case "DELIVERED":
        return <Tag color="green">Giao thành công</Tag>;
      case "PARTIAL":
        return <Tag color="orange">Giao 1 phần</Tag>;
      case "CANCELLED":
        return <Tag color="red">Đã hủy</Tag>;
      default:
        return <Tag>{st}</Tag>;
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* 1. THANH ĐIỀU HƯỚNG BREADCRUMB & NÚT QUAY LẠI */}
      <div style={{ marginBottom: 12 }}>
        <Breadcrumb
          items={[
            { title: <Link href="/logistics/trips">Trang chủ</Link> },
            { title: <Link href="/logistics/orders">Đơn hàng Sapo</Link> },
            { title: order.orderCode },
          ]}
        />
      </div>

      {/* 2. TIÊU ĐỀ TRANG DEDICATED */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          background: "#fff",
          padding: "16px 20px",
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <Space size={12} align="center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/logistics/orders")}
          >
            Quay lại
          </Button>
          <div>
            <Title level={4} style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingOutlined style={{ color: "#1890ff" }} />
              Đơn hàng Sapo: {order.orderCode}
              {renderDeliveryTag(order.deliveryStatus)}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID Sapo: #{order.sapoOrderId} &bull; Ngày đặt: {dayjs(order.orderDate).format("DD/MM/YYYY HH:mm")}
            </Text>
          </div>
        </Space>

        <Space>
          {order.deliveryStatus === "WAITING_DISPATCH" && (
            <Link href="/logistics/trips">
              <Button type="primary" icon={<CarOutlined />}>
                Xếp vào Chuyến xe Tera V6
              </Button>
            </Link>
          )}

          {linkedTrip && (
            <Link href="/logistics/trips">
              <Button icon={<CarOutlined />}>
                Xem Chuyến xe: {linkedTrip.tripCode}
              </Button>
            </Link>
          )}
        </Space>
      </div>

      {/* 3. THỐNG KÊ CHỈ SỐ NHANH */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng cân nặng (Đã bóc tách)"
              value={order.totalWeightKg.toFixed(2)}
              suffix="kg"
              valueStyle={{ color: "#08979c" }}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tiền mặt COD cần thu"
              value={order.codAmountRequired}
              suffix="đ"
              formatter={(val) => Number(val).toLocaleString("vi-VN")}
              valueStyle={{ color: order.codAmountRequired > 0 ? "#cf1322" : "#595959" }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng giá trị đơn hàng"
              value={order.totalAmount}
              suffix="đ"
              formatter={(val) => Number(val).toLocaleString("vi-VN")}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Số chủng loại mặt hàng"
              value={order.items.length}
              suffix="mặt hàng"
              valueStyle={{ color: "#722ed1" }}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 4. THÔNG TIN KHÁCH HÀNG & GIAO HÀNG */}
      <Card
        size="small"
        bordered
        title={
          <Space>
            <UserOutlined style={{ color: "#1890ff" }} />
            <Text strong>Thông tin Khách hàng & Địa chỉ giao nhận</Text>
          </Space>
        }
        style={{ marginBottom: 16, borderRadius: 8 }}
      >
        <Descriptions size="small" bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Tên khách hàng">
            <Text strong>{order.customerName}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            {order.customerPhone ? (
              <Space>
                <PhoneOutlined style={{ color: "#52c41a" }} />
                <Text strong>{order.customerPhone}</Text>
              </Space>
            ) : (
              <Text type="secondary" style={{ fontStyle: "italic" }}>Chưa có SĐT</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Mã KH MISA">
            {order.misaCustomerCode ? (
              <Tag color="purple">{order.misaCustomerCode}</Tag>
            ) : (
              <Tag color="default">Chưa đồng bộ MISA</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ giao hàng" span={3}>
            <Text>
              <EnvironmentOutlined style={{ color: "#ff4d4f", marginRight: 6 }} />
              {order.shippingAddress}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày đặt hàng">
            {dayjs(order.orderDate).format("DD/MM/YYYY HH:mm:ss")}
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian nhận Webhook">
            {dayjs(order.createdAt).format("DD/MM/YYYY HH:mm:ss")}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái giao vận">
            {renderDeliveryTag(order.deliveryStatus)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 5. DANH SÁCH MẶT HÀNG & BÓC TÁCH CÂN NẶNG */}
      <Card
        size="small"
        bordered
        title={
          <Space>
            <InboxOutlined style={{ color: "#1890ff" }} />
            <Text strong>Chi tiết Mặt hàng & Định mức Trọng lượng ({order.items.length})</Text>
          </Space>
        }
        style={{ marginBottom: 16, borderRadius: 8 }}
      >
        <Table
          rowKey="id"
          size="small"
          bordered
          pagination={false}
          dataSource={order.items}
          columns={[
            {
              title: "Mã SKU",
              key: "sku",
              width: 140,
              render: (_: any, i: OrderItem) => <Tag color="blue">{i.product?.sku}</Tag>,
            },
            {
              title: "Tên mặt hàng sản phẩm",
              key: "name",
              render: (_: any, i: OrderItem) => (
                <div>
                  <Text strong>{i.product?.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Đơn vị chuẩn: {i.product?.baseUnit} &bull; Tồn kho hiện tại: {i.product?.currentStock}
                  </Text>
                </div>
              ),
            },
            {
              title: "Định mức 1 ĐV",
              key: "unitWeight",
              width: 120,
              align: "right" as const,
              render: (_: any, i: OrderItem) => `${i.product?.weightKg} kg / ${i.product?.baseUnit}`,
            },
            {
              title: "Số lượng đặt",
              key: "orderedQty",
              width: 110,
              align: "center" as const,
              render: (_: any, i: OrderItem) => (
                <Text strong>{i.orderedQty} {i.product?.baseUnit}</Text>
              ),
            },
            {
              title: "Tổng cân nặng",
              dataIndex: "lineWeightKg",
              key: "lineWeightKg",
              width: 130,
              align: "right" as const,
              render: (w: number) => (
                <Text strong style={{ color: "#08979c" }}>
                  {w.toFixed(2)} kg
                </Text>
              ),
            },
            {
              title: "Đơn giá",
              dataIndex: "unitPrice",
              key: "unitPrice",
              width: 130,
              align: "right" as const,
              render: (v: number) => `${v.toLocaleString("vi-VN")} đ`,
            },
            {
              title: "Thành tiền",
              dataIndex: "lineAmount",
              key: "lineAmount",
              width: 140,
              align: "right" as const,
              render: (v: number) => (
                <Text strong>{v.toLocaleString("vi-VN")} đ</Text>
              ),
            },
          ]}
          summary={(pageData) => {
            let totalQty = 0;
            let totalWeight = 0;
            let totalAmt = 0;

            pageData.forEach((row) => {
              totalQty += row.orderedQty;
              totalWeight += row.lineWeightKg;
              totalAmt += row.lineAmount;
            });

            return (
              <Table.Summary.Row style={{ background: "#fafafa", fontWeight: "bold" }}>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Text strong>TỔNG CỘNG</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="center">
                  <Text strong>{totalQty}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong style={{ color: "#08979c" }}>
                    {totalWeight.toFixed(2)} kg
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} />
                <Table.Summary.Cell index={4} align="right">
                  <Text strong style={{ color: "#cf1322" }}>
                    {totalAmt.toLocaleString("vi-VN")} đ
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Card>

      {/* 6. THÔNG TIN CHUYẾN XE GIAO HÀNG (NẾU CÓ) */}
      {linkedTrip && latestStop && (
        <Card
          size="small"
          bordered
          title={
            <Space>
              <CarOutlined style={{ color: "#1890ff" }} />
              <Text strong>Hồ sơ Chuyến xe Giao vận (Tera V6)</Text>
            </Space>
          }
          style={{ marginBottom: 24, borderRadius: 8 }}
        >
          <Descriptions size="small" bordered column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="Mã chuyến xe">
              <Text strong style={{ color: "#1890ff" }}>{linkedTrip.tripCode}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Biển số xe">
              {linkedTrip.vehiclePlate || "Tera V6"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái chuyến">
              <Tag color={linkedTrip.status === "CLOSED" ? "green" : "blue"}>
                {linkedTrip.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tài xế phụ trách">
              <Text strong>{linkedTrip.driver.fullName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="SĐT Tài xế">
              {linkedTrip.driver.phone}
            </Descriptions.Item>
            <Descriptions.Item label="Thứ tự điểm giao">
              Điểm số #{latestStop.stopSequence}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ xuất phát">
              {linkedTrip.departedAt ? dayjs(linkedTrip.departedAt).format("DD/MM/YYYY HH:mm") : "Chưa xuất bến"}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ hoàn tất">
              {latestStop.completedAt ? dayjs(latestStop.completedAt).format("DD/MM/YYYY HH:mm") : "Chưa hoàn tất"}
            </Descriptions.Item>
            <Descriptions.Item label="Kết quả điểm giao">
              {latestStop.status === "SUCCESS" ? (
                <Tag color="green">Giao đủ</Tag>
              ) : latestStop.status === "PARTIAL" ? (
                <Tag color="orange">Giao 1 phần</Tag>
              ) : latestStop.status === "FAILED" ? (
                <Tag color="red">Giao thất bại</Tag>
              ) : (
                <Tag color="default">Chưa giao</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Tiền mặt tài xế thu">
              <Text strong>{latestStop.cashCollected.toLocaleString("vi-VN")} đ</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Khách chuyển khoản">
              {latestStop.transferCollected.toLocaleString("vi-VN")} đ
            </Descriptions.Item>
            <Descriptions.Item label="Khách ký nợ">
              {latestStop.debtSigned.toLocaleString("vi-VN")} đ
            </Descriptions.Item>
            {latestStop.failOrPartialReason && (
              <Descriptions.Item label="Lý do hoàn/thất bại" span={3}>
                <Text type="danger">{latestStop.failOrPartialReason}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}
    </div>
  );
}
