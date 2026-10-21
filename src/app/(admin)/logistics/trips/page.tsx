"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Drawer,
  Form,
  Select,
  Input,
  InputNumber,
  Typography,
  message,
  Popconfirm,
  Badge,
  Divider,
  Row,
  Col,
  Statistic,
  Progress,
} from "antd";
import {
  CarOutlined,
  PlusOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  InboxOutlined,
  CompassOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

// Kiểu dữ liệu tương ứng Prisma Schema
interface Driver {
  id: string;
  fullName: string;
  phone: string;
}

interface SapoPendingOrder {
  id: string;
  orderCode: string;
  customerName: string;
  shippingAddress: string;
  totalWeightKg: number;
  codAmountRequired: number;
}

interface DeliveryTripStop {
  id: string;
  stopSequence: number;
  status: "PENDING" | "SUCCESS" | "PARTIAL" | "FAILED";
  actualDeliveredKg: number;
  cashCollected: number;
  salesOrder: {
    orderCode: string;
    customerName: string;
    shippingAddress: string;
  };
}

interface DeliveryTrip {
  id: string;
  tripCode: string;
  vehiclePlate: string | null;
  status: "DRAFT" | "ON_ROAD" | "WAITING_SETTLE" | "CLOSED";
  departedAt: string | null;
  returnedAt: string | null;
  cashSettledAt: string | null;
  returnStockSettledAt: string | null;
  hasReturnGoods: boolean;
  totalSuccessStops: number;
  totalDeliveredKg: number;
  totalCashCollected: number;
  tripSalaryEarned: number;
  driver: {
    id: string;
    fullName: string;
    phone: string;
  };
  stops: DeliveryTripStop[];
}

export default function LogisticsTripsPage() {
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<DeliveryTrip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [pendingOrders, setPendingOrders] = useState<SapoPendingOrder[]>([]);

  // State Drawer Tạo Chuyến
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  // State Gợi ý gom tuyến theo Quận
  const [groupDrawerOpen, setGroupDrawerOpen] = useState(false);
  const [groupSuggestions, setGroupSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const loadGroupSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const res = await fetch("/api/logistics/group-suggestions");
      const json = await res.json();
      if (json.success) {
        setGroupSuggestions(json.data);
        setGroupDrawerOpen(true);
      } else {
        message.error(json.error || "Không thể tải gợi ý gom tuyến");
      }
    } catch {
      message.error("Lỗi khi tải gợi ý gom tuyến");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const applyGroupToTrip = (group: any) => {
    const ids = group.orders.map((o: any) => o.id);
    setSelectedOrderIds(ids);
    setGroupDrawerOpen(false);
    form.resetFields();
    setCreateDrawerOpen(true);
    message.success(
      `Đã chọn ${ids.length} đơn tại ${group.district} (${group.totalWeightKg}kg / 945kg Tera V6)!`
    );
  };

  // 1. Tải danh sách chuyến xe, tài xế và đơn chờ xếp xe
  const loadData = async () => {
    setLoading(true);
    try {
      const [tripsRes, driversRes, ordersRes] = await Promise.all([
        fetch("/api/logistics/trips"),
        fetch("/api/hr/drivers"),
        fetch("/api/logistics/orders/pending"),
      ]);

      const tripsData = await tripsRes.json();
      const driversData = await driversRes.json();
      const ordersData = await ordersRes.json();

      setTrips(tripsData.data || []);
      setDrivers(driversData.data || []);
      setPendingOrders(ordersData.data || []);
    } catch (err: any) {
      message.error("Lỗi khi tải dữ liệu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Tính toán tổng hợp cho các đơn được chọn khi tạo chuyến
  const selectedOrdersData = pendingOrders.filter((o) =>
    selectedOrderIds.includes(o.id)
  );
  const calculatedTotalKg = selectedOrdersData.reduce(
    (sum, o) => sum + o.totalWeightKg,
    0
  );
  const calculatedTotalCod = selectedOrdersData.reduce(
    (sum, o) => sum + o.codAmountRequired,
    0
  );

  // 3. Xử lý tạo chuyến giao hàng mới
  const handleCreateTrip = async (values: any) => {
    if (selectedOrderIds.length === 0) {
      message.warning("Vui lòng tích chọn ít nhất 1 đơn hàng để ghép chuyến!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/logistics/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: values.driverId,
          vehiclePlate: values.vehiclePlate || "Tera V6",
          plannedDurationMin: values.plannedDurationMin || 180,
          orderIds: selectedOrderIds,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Tạo chuyến xe thất bại");
      }

      message.success("Đã tạo chuyến xe thành công và điều phối cho tài xế!");
      setCreateDrawerOpen(false);
      form.resetFields();
      setSelectedOrderIds([]);
      loadData();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Thao tác đối soát: Kế toán nhận tiền mặt COD
  const handleSettleCash = async (tripId: string) => {
    try {
      const res = await fetch(`/api/logistics/trips/${tripId}/settle-cash`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Xác nhận thu tiền thất bại");
      message.success("Đã xác nhận thu đủ tiền mặt COD vào két!");
      loadData();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  // 5. Thao tác đối soát: Thủ kho nhận lại hàng hoàn
  const handleSettleReturnStock = async (tripId: string) => {
    try {
      const res = await fetch(
        `/api/logistics/trips/${tripId}/settle-return-stock`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Xác nhận hàng hoàn thất bại");
      message.success("Đã kiểm đếm và nhập lại hàng hoàn trên xe về kho!");
      loadData();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  // 6. Khóa sổ chuyến xe (CLOSED)
  const handleCloseTrip = async (tripId: string) => {
    try {
      const res = await fetch(`/api/logistics/trips/${tripId}/close`, {
        method: "POST",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Đóng chuyến thất bại");
      }
      message.success("Chuyến xe đã khóa sổ thành công và ghi nhận lương!");
      loadData();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  // Cột bảng danh sách chuyến xe
  const tripColumns = [
    {
      title: "Mã Chuyến / Xe",
      key: "tripCode",
      width: 170,
      render: (_: any, r: DeliveryTrip) => (
        <div>
          <Text strong>{r.tripCode}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            <CarOutlined /> {r.vehiclePlate || "Xe công ty"}
          </Text>
        </div>
      ),
    },
    {
      title: "Tài xế phụ trách",
      key: "driver",
      render: (_: any, r: DeliveryTrip) => (
        <div>
          <Text strong>{r.driver?.fullName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            SĐT: {r.driver?.phone}
          </Text>
        </div>
      ),
    },
    {
      title: "Tiến độ giao",
      key: "stops",
      render: (_: any, r: DeliveryTrip) => (
        <div>
          <Text>
            {r.totalSuccessStops} / {r.stops?.length || 0} Điểm giao
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Trọng lượng: <Text strong>{r.totalDeliveredKg} kg</Text>
          </Text>
        </div>
      ),
    },
    {
      title: "Tiền mặt COD",
      key: "cashCollected",
      align: "right" as const,
      render: (_: any, r: DeliveryTrip) => (
        <div>
          <Text strong style={{ color: "#cf1322" }}>
            {r.totalCashCollected.toLocaleString("vi-VN")} đ
          </Text>
          <br />
          {r.cashSettledAt ? (
            <Badge status="success" text="Đã nộp két" />
          ) : (
            <Badge status="warning" text="Chưa nộp tiền" />
          )}
        </div>
      ),
    },
    {
      title: "Lương chuyến",
      dataIndex: "tripSalaryEarned",
      key: "tripSalaryEarned",
      align: "right" as const,
      render: (v: number) => (
        <Text strong style={{ color: "#389e0d" }}>
          +{v.toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (st: string, r: DeliveryTrip) => {
        switch (st) {
          case "DRAFT":
            return <Tag color="default">Mới tạo</Tag>;
          case "ON_ROAD":
            return (
              <Tag icon={<ClockCircleOutlined />} color="processing">
                Đang giao hàng
              </Tag>
            );
          case "WAITING_SETTLE":
            return (
              <Tag icon={<SyncOutlined spin />} color="warning">
                Về kho - Chờ chốt
              </Tag>
            );
          case "CLOSED":
            return (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Đã khóa sổ
              </Tag>
            );
          default:
            return <Tag>{st}</Tag>;
        }
      },
    },
    {
      title: "Thao tác Đối soát",
      key: "actions",
      width: 200,
      render: (_: any, r: DeliveryTrip) => {
        if (r.status === "CLOSED") {
          return <Text type="secondary">Hoàn tất</Text>;
        }

        return (
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            {!r.cashSettledAt && (
              <Button
                size="small"
                type="dashed"
                icon={<DollarOutlined />}
                onClick={() => handleSettleCash(r.id)}
              >
                Kế toán thu tiền
              </Button>
            )}

            {r.hasReturnGoods && !r.returnStockSettledAt && (
              <Button
                size="small"
                type="dashed"
                danger
                icon={<InboxOutlined />}
                onClick={() => handleSettleReturnStock(r.id)}
              >
                Kho nhận hàng hoàn
              </Button>
            )}

            <Popconfirm
              title="Khóa sổ chuyến xe?"
              description="Hành động này sẽ ghi nhận lương cho tài xế và không thể sửa lại."
              onConfirm={() => handleCloseTrip(r.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                size="small"
                type="primary"
                disabled={!r.cashSettledAt || (r.hasReturnGoods && !r.returnStockSettledAt)}
              >
                Khóa sổ chuyến
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // Cột bảng chọn đơn hàng Sapo trong Drawer
  const orderSelectionColumns = [
    {
      title: "Mã đơn",
      dataIndex: "orderCode",
      key: "orderCode",
      width: 120,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: "Khách hàng & Địa chỉ giao",
      key: "customer",
      render: (_: any, r: SapoPendingOrder) => (
        <div>
          <Text strong>{r.customerName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.shippingAddress}
          </Text>
        </div>
      ),
    },
    {
      title: "Trọng lượng",
      dataIndex: "totalWeightKg",
      key: "totalWeightKg",
      width: 100,
      align: "right" as const,
      render: (v: number) => `${v} kg`,
    },
    {
      title: "Tiền COD",
      dataIndex: "codAmountRequired",
      key: "codAmountRequired",
      width: 130,
      align: "right" as const,
      render: (v: number) => `${v.toLocaleString("vi-VN")} đ`,
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Card
        title={
          <Space>
            <CarOutlined style={{ fontSize: 22, color: "#1677ff" }} />
            <span>Điều Phối Chuyến Xe & Đối Soát Giao Vận (Tera V6)</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<SyncOutlined />} onClick={loadData} loading={loading}>
              Làm mới
            </Button>
            <Button
              icon={<CompassOutlined />}
              onClick={loadGroupSuggestions}
              loading={loadingSuggestions}
              style={{ borderColor: "#1890ff", color: "#1890ff" }}
            >
              Gợi ý gom tuyến Tera V6
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                setSelectedOrderIds([]);
                setCreateDrawerOpen(true);
              }}
            >
              Tạo chuyến xe mới
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={tripColumns}
          dataSource={trips}
          loading={loading}
          size="small"
          bordered
          pagination={{ pageSize: 15 }}
        />
      </Card>

      {/* DRAWER TẠO CHUYẾN GIAO HÀNG */}
      <Drawer
        title="Tạo Chuyến Giao Hàng & Gán Đơn Sapo"
        width={900}
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setCreateDrawerOpen(false)}>
              Hủy
            </Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={() => form.submit()}
            >
              Xác nhận tạo chuyến ({selectedOrderIds.length} đơn)
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTrip}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="driverId"
                label="Tài xế giao hàng"
                rules={[{ required: true, message: "Vui lòng chọn tài xế!" }]}
              >
                <Select
                  placeholder="Chọn tài xế"
                  options={drivers.map((d) => ({
                    value: d.id,
                    label: `${d.fullName} (${d.phone})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="vehiclePlate"
                label="Biển số / Loại xe"
                initialValue="Tera V6"
              >
                <Input placeholder="VD: 29D-123.45 / Tera V6" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="plannedDurationMin"
                label="Thời gian định mức (phút)"
                initialValue={180}
              >
                <InputNumber min={30} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "12px 0" }} />

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Statistic
                title="Số đơn đã chọn"
                value={selectedOrderIds.length}
                suffix="đơn"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Tổng tải trọng ước tính"
                value={calculatedTotalKg}
                precision={2}
                suffix="kg"
                valueStyle={{ color: calculatedTotalKg > 1000 ? "#cf1322" : "#3f8600" }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Tổng tiền COD cần thu"
                value={calculatedTotalCod}
                suffix="đ"
                formatter={(val) => Number(val).toLocaleString("vi-VN")}
              />
            </Col>
          </Row>

          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Tích chọn đơn hàng chờ giao từ Sapo:
          </Text>

          <Table
            rowKey="id"
            columns={orderSelectionColumns}
            dataSource={pendingOrders}
            size="small"
            bordered
            pagination={{ pageSize: 8 }}
            rowSelection={{
              selectedRowKeys: selectedOrderIds,
              onChange: (keys) => setSelectedOrderIds(keys),
            }}
          />
        </Form>
      </Drawer>

      {/* DRAWER GỢI Ý GOM TUYẾN THEO QUẬN (TERA V6) */}
      <Drawer
        title={
          <Space>
            <CompassOutlined style={{ color: "#1890ff" }} />
            <span>Gợi Ý Gom Tuyến Xe Tera V6 Theo Quận / Khu Vực</span>
          </Space>
        }
        width={750}
        open={groupDrawerOpen}
        onClose={() => setGroupDrawerOpen(false)}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Hệ thống tự động phân tích các đơn hàng chờ giao, bóc tách Quận/Huyện và tính toán tỷ lệ lấp
            đầy tải trọng xe Tera V6 (Tải trọng định mức 945 kg) để tối ưu cung đường.
          </Text>
        </div>

        {groupSuggestions.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 24 }}>
            <Text type="secondary">Hiện không có đơn hàng nào đang chờ giao để gợi ý tuyến.</Text>
          </Card>
        ) : (
          groupSuggestions.map((group, idx) => (
            <Card
              key={group.district || idx}
              style={{
                marginBottom: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                borderLeft:
                  group.status === "OPTIMAL"
                    ? "4px solid #52c41a"
                    : group.status === "OVERLOADED"
                    ? "4px solid #ff4d4f"
                    : "4px solid #faad14",
              }}
            >
              <Row justify="space-between" align="middle">
                <Col>
                  <Space align="center">
                    <Title level={5} style={{ margin: 0 }}>
                      {group.district}
                    </Title>
                    <Tag
                      color={
                        group.status === "OPTIMAL"
                          ? "success"
                          : group.status === "OVERLOADED"
                          ? "error"
                          : "warning"
                      }
                    >
                      {group.status === "OPTIMAL"
                        ? "Tải trọng lý tưởng"
                        : group.status === "OVERLOADED"
                        ? "Quá tải Tera V6"
                        : "Tải trọng thấp"}
                    </Tag>
                  </Space>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={() => applyGroupToTrip(group)}
                  >
                    Chọn tuyến này ({group.orderCount} đơn)
                  </Button>
                </Col>
              </Row>

              <Row gutter={16} style={{ marginTop: 12 }}>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Số lượng đơn:
                  </Text>
                  <div>
                    <Text strong>{group.orderCount} đơn</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Tổng trọng lượng:
                  </Text>
                  <div>
                    <Text
                      strong
                      style={{
                        color: group.totalWeightKg > 945 ? "#cf1322" : "#3f8600",
                      }}
                    >
                      {group.totalWeightKg} kg / 945 kg
                    </Text>
                  </div>
                </Col>
                <Col span={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Tổng tiền COD:
                  </Text>
                  <div>
                    <Text strong style={{ color: "#1890ff" }}>
                      {group.totalCodAmount?.toLocaleString("vi-VN")} đ
                    </Text>
                  </div>
                </Col>
              </Row>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 12 }} type="secondary">
                    Tỷ lệ lấp đầy thùng xe Tera V6:
                  </Text>
                  <Text style={{ fontSize: 12 }} strong>
                    {group.utilizationRate}%
                  </Text>
                </div>
                <Progress
                  percent={group.utilizationRate}
                  status={
                    group.status === "OVERLOADED"
                      ? "exception"
                      : group.status === "OPTIMAL"
                      ? "success"
                      : "normal"
                  }
                  showInfo={false}
                />
              </div>

              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>
                  💡 Khuyến nghị: {group.recommendation}
                </Text>
              </div>
            </Card>
          ))
        )}
      </Drawer>
    </div>
  );
}