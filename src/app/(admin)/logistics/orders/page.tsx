"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Typography,
  message,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
} from "antd";
import {
  ShoppingOutlined,
  ThunderboltFilled,
  SyncOutlined,
  SearchOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

interface ProductInfo {
  id: string;
  sku: string;
  name: string;
  baseUnit: string;
  weightKg: number;
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
  driver: {
    fullName: string;
    phone: string;
  };
}

interface TripStopInfo {
  trip: TripInfo;
}

interface SalesOrder {
  id: string;
  sapoOrderId: string;
  orderCode: string;
  customerName: string;
  customerPhone: string | null;
  shippingAddress: string;
  totalWeightKg: number;
  totalAmount: number;
  codAmountRequired: number;
  deliveryStatus: "WAITING_DISPATCH" | "IN_TRANSIT" | "DELIVERED" | "PARTIAL" | "CANCELLED";
  orderDate: string;
  createdAt: string;
  items: OrderItem[];
  tripStops: TripStopInfo[];
}

export default function SapoOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [simulating, setSimulating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
      if (searchQuery) params.append("q", searchQuery);

      const res = await fetch(`/api/logistics/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      } else {
        message.error("Lỗi khi tải đơn hàng: " + data.error);
      }
    } catch (err: any) {
      message.error("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Nút giả lập nhận Webhook từ Sapo
  const handleSimulateWebhook = async () => {
    setSimulating(true);
    try {
      const res = await fetch("/api/logistics/orders/simulate-sapo", {
        method: "POST",
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Giả lập thất bại");
      }

      message.success({
        content: `Đã nhận Webhook đơn ${result.data.orderCode} từ Sapo! Tổng: ${result.data.totalWeightKg} kg - COD: ${result.data.codAmountRequired.toLocaleString("vi-VN")} đ`,
        duration: 4,
      });

      // Tải lại danh sách
      fetchOrders();
    } catch (err: any) {
      message.error("Lỗi giả lập Webhook: " + err.message);
    } finally {
      setSimulating(false);
    }
  };

  // Thống kê nhanh
  const totalOrders = orders.length;
  const waitingDispatchOrders = orders.filter((o) => o.deliveryStatus === "WAITING_DISPATCH");
  const inTransitOrders = orders.filter((o) => o.deliveryStatus === "IN_TRANSIT");
  const waitingWeightKg = waitingDispatchOrders.reduce((sum, o) => sum + o.totalWeightKg, 0);
  const waitingCod = waitingDispatchOrders.reduce((sum, o) => sum + o.codAmountRequired, 0);

  // Cấu hình bảng
  const columns = [
    {
      title: "Mã Đơn Sapo",
      key: "orderCode",
      width: 140,
      render: (_: any, r: SalesOrder) => (
        <div>
          <Text
            strong
            style={{ color: "#0958d9", cursor: "pointer" }}
            onClick={() => router.push(`/logistics/orders/${r.id}`)}
          >
            {r.orderCode}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(r.orderDate).format("DD/MM/YYYY HH:mm")}
          </Text>
        </div>
      ),
    },
    {
      title: "Khách hàng & SĐT",
      key: "customer",
      width: 180,
      render: (_: any, r: SalesOrder) => (
        <div>
          <Text strong>{r.customerName}</Text>
          <br />
          {r.customerPhone ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              <PhoneOutlined /> {r.customerPhone}
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>
              Chưa có SĐT
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Địa chỉ giao hàng",
      dataIndex: "shippingAddress",
      key: "shippingAddress",
      ellipsis: true,
      render: (addr: string) => (
        <Tooltip title={addr}>
          <Text style={{ fontSize: 13 }}>
            <EnvironmentOutlined style={{ color: "#ff4d4f", marginRight: 4 }} />
            {addr}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Hàng hóa trong đơn",
      key: "items",
      width: 220,
      render: (_: any, r: SalesOrder) => {
        const firstItem = r.items[0];
        const remainingCount = r.items.length - 1;

        return (
          <div style={{ fontSize: 12 }}>
            {firstItem ? (
              <div>
                <Text ellipsis style={{ maxWidth: 200, display: "inline-block" }}>
                  &bull; {firstItem.product?.name || "Hàng hóa"} ({firstItem.orderedQty} {firstItem.product?.baseUnit})
                </Text>
                {remainingCount > 0 && (
                  <Text type="secondary" style={{ marginLeft: 4 }}>
                    +{remainingCount} món khác
                  </Text>
                )}
              </div>
            ) : (
              <Text type="secondary">Chưa có sản phẩm</Text>
            )}
          </div>
        );
      },
    },
    {
      title: "Trọng lượng",
      dataIndex: "totalWeightKg",
      key: "totalWeightKg",
      width: 110,
      align: "right" as const,
      sorter: (a: SalesOrder, b: SalesOrder) => a.totalWeightKg - b.totalWeightKg,
      render: (w: number) => (
        <Text strong style={{ color: "#08979c" }}>
          {w.toFixed(1)} kg
        </Text>
      ),
    },
    {
      title: "Cần thu (COD)",
      dataIndex: "codAmountRequired",
      key: "codAmountRequired",
      width: 130,
      align: "right" as const,
      sorter: (a: SalesOrder, b: SalesOrder) => a.codAmountRequired - b.codAmountRequired,
      render: (cod: number) => (
        <Text strong style={{ color: cod > 0 ? "#cf1322" : "#595959" }}>
          {cod.toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Trạng thái giao",
      key: "deliveryStatus",
      width: 150,
      render: (_: any, r: SalesOrder) => {
        const latestTrip = r.tripStops?.[0]?.trip;

        if (r.deliveryStatus === "WAITING_DISPATCH") {
          return <Tag color="cyan">Chờ xếp xe</Tag>;
        }
        if (r.deliveryStatus === "IN_TRANSIT") {
          return (
            <div>
              <Tag color="blue">Đang trên xe</Tag>
              {latestTrip && (
                <div style={{ fontSize: 11, color: "#595959", marginTop: 2 }}>
                  <CarOutlined /> {latestTrip.tripCode}
                </div>
              )}
            </div>
          );
        }
        if (r.deliveryStatus === "DELIVERED") {
          return <Tag color="green">Giao thành công</Tag>;
        }
        if (r.deliveryStatus === "PARTIAL") {
          return <Tag color="orange">Giao 1 phần</Tag>;
        }
        if (r.deliveryStatus === "CANCELLED") {
          return <Tag color="red">Đã hủy</Tag>;
        }
        return <Tag>{r.deliveryStatus}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 80,
      align: "center" as const,
      render: (_: any, r: SalesOrder) => (
        <Button
          type="link"
          size="small"
          onClick={() => router.push(`/logistics/orders/${r.id}`)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* 1. HEADER & THỐNG KÊ NHANH */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <ShoppingOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            Quản lý Đơn hàng Sapo & Bóc tách Cân nặng
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Tự động nhận đơn qua Sapo Webhook &bull; Bóc tách Gram sang Kg &bull; Sẵn sàng ghép chuyến Tera V6
          </Text>
        </div>

        <Space>
          <Button
            type="primary"
            icon={<ThunderboltFilled />}
            style={{ background: "#722ed1", borderColor: "#722ed1" }}
            loading={simulating}
            onClick={handleSimulateWebhook}
          >
            ⚡ Giả lập nhận đơn mới từ Sapo (Test Webhook)
          </Button>

          <Link href="/logistics/trips">
            <Button icon={<CarOutlined />}>
              Sang Điều phối Chuyến xe
            </Button>
          </Link>
        </Space>
      </div>

      {/* 2. CÁC THẺ THỐNG KÊ NHANH */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng đơn hàng"
              value={totalOrders}
              prefix={<ShoppingOutlined style={{ color: "#1890ff" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Chờ xếp xe"
              value={waitingDispatchOrders.length}
              valueStyle={{ color: "#08979c" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Đang trên đường giao"
              value={inTransitOrders.length}
              valueStyle={{ color: "#0958d9" }}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tải trọng chờ giao"
              value={waitingWeightKg.toFixed(1)}
              suffix="kg"
              valueStyle={{ color: "#d46b08" }}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 3. BẢNG DỮ LIỆU & BỘ LỌC */}
      <Card
        size="small"
        bordered
        title={
          <Space size={12} wrap style={{ padding: "4px 0" }}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 170 }}
              options={[
                { value: "ALL", label: "Tất cả trạng thái" },
                { value: "WAITING_DISPATCH", label: "Chờ xếp xe (Sẵn sàng)" },
                { value: "IN_TRANSIT", label: "Đang trên xe giao" },
                { value: "DELIVERED", label: "Đã giao thành công" },
                { value: "PARTIAL", label: "Giao 1 phần" },
                { value: "CANCELLED", label: "Đã hủy" },
              ]}
            />

            <Input
              placeholder="Tìm mã đơn, tên khách, SĐT..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={fetchOrders}
              style={{ width: 260 }}
              allowClear
            />

            <Button icon={<SearchOutlined />} onClick={fetchOrders}>
              Tìm kiếm
            </Button>

            <Button icon={<SyncOutlined spin={loading} />} onClick={fetchOrders}>
              Làm mới
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          size="small"
          bordered
          sticky
          loading={loading}
          dataSource={orders}
          columns={columns}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng cộng: ${total} đơn hàng Sapo`,
          }}
        />
      </Card>
    </div>
  );
}
