"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Tag,
  Button,
  Space,
  Typography,
  message,
  Drawer,
  Form,
  Radio,
  InputNumber,
  Input,
  Divider,
  Badge,
  Spin,
  Alert,
} from "antd";
import {
  CarOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  HomeOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface TripStop {
  id: string;
  stopSequence: number;
  status: "PENDING" | "SUCCESS" | "PARTIAL" | "FAILED";
  actualDeliveredKg: number;
  cashCollected: number;
  transferCollected: number;
  debtSigned: number;
  salesOrder: {
    orderCode: string;
    customerName: string;
    customerPhone: string | null;
    shippingAddress: string;
    totalWeightKg: number;
    codAmountRequired: number;
  };
}

interface ActiveTrip {
  id: string;
  tripCode: string;
  vehiclePlate: string | null;
  status: "DRAFT" | "ON_ROAD" | "WAITING_SETTLE" | "CLOSED";
  departedAt: string | null;
  returnedAt: string | null;
  cashSettledAt: string | null;
  totalSuccessStops: number;
  totalDeliveredKg: number;
  totalCashCollected: number;
  tripSalaryEarned: number;
  stops: TripStop[];
}

export default function DriverAppPage() {
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<ActiveTrip | null>(null);
  const [selectedStop, setSelectedStop] = useState<TripStop | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // 1. Tải chuyến xe đang hoạt động của tài xế hiện tại
  const loadMyActiveTrip = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/driver/active-trip");
      const data = await res.json();
      setTrip(data.data || null);
    } catch (err: any) {
      message.error("Lỗi tải thông tin chuyến xe: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyActiveTrip();
  }, []);

  // 2. Tài xế bấm "Xuất phát rời kho"
  const handleDepart = async () => {
    if (!trip) return;
    try {
      const res = await fetch(`/api/driver/trips/${trip.id}/depart`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Thao tác thất bại");
      message.success("Bắt đầu chuyến đi! Lái xe an toàn!");
      loadMyActiveTrip();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  // 3. Tài xế bấm "Về tới kho"
  const handleReturnToWarehouse = async () => {
    if (!trip) return;
    try {
      const res = await fetch(`/api/driver/trips/${trip.id}/return`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Thao tác thất bại");
      message.success("Đã ghi nhận về tới kho. Vui lòng đối soát tiền và hàng hoàn!");
      loadMyActiveTrip();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  // 4. Mở Popup xử lý giao hàng tại 1 điểm dừng
  const handleOpenStopDrawer = (stop: TripStop) => {
    setSelectedStop(stop);
    form.setFieldsValue({
      status: "SUCCESS",
      actualDeliveredKg: stop.salesOrder.totalWeightKg,
      cashCollected: stop.salesOrder.codAmountRequired,
      transferCollected: 0,
      debtSigned: 0,
      reason: "",
    });
    setDrawerOpen(true);
  };

  // 5. Xác nhận giao hàng và cập nhật số tiền thu được
  const handleSubmitDelivery = async (values: any) => {
    if (!selectedStop || !trip) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/driver/trips/${trip.id}/stops/${selectedStop.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: values.status,
          actualDeliveredKg:
            values.status === "FAILED" ? 0 : values.actualDeliveredKg,
          cashCollected: values.cashCollected || 0,
          transferCollected: values.transferCollected || 0,
          debtSigned: values.debtSigned || 0,
          failOrPartialReason: values.reason || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Lỗi cập nhật giao hàng");
      }

      message.success("Đã hoàn tất điểm giao!");
      setDrawerOpen(false);
      loadMyActiveTrip();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải lộ trình xe Tera V6...</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <CarOutlined style={{ fontSize: 48, color: "#bfbfbf" }} />
        <Title level={4} style={{ marginTop: 16, color: "#595959" }}>
          Hiện chưa có chuyến xe nào được gán cho bạn
        </Title>
        <Text type="secondary">
          Vui lòng đợi điều phối viên kho Sơn Khang xếp đơn và tạo chuyến!
        </Text>
        <div style={{ marginTop: 24 }}>
          <Button type="primary" onClick={loadMyActiveTrip}>
            Kiểm tra lại
          </Button>
        </div>
      </div>
    );
  }

  const isDeparted = !!trip.departedAt;
  const isReturned = !!trip.returnedAt;
  const pendingStopsCount = trip.stops.filter((s) => s.status === "PENDING").length;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "12px 12px 60px 12px", background: "#f5f5f5", minHeight: "100vh" }}>
      {/* HEADER: THÔNG TIN CHUYẾN & THU NHẬP TÍCH LŨY */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          background: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
          color: "#fff",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
              MÃ CHUYẾN: {trip.tripCode}
            </Text>
            <Title level={4} style={{ color: "#fff", margin: "2px 0 0 0" }}>
              Xe: {trip.vehiclePlate || "Tera V6"}
            </Title>
          </div>
          <Tag color="#52c41a" style={{ borderRadius: 12, padding: "2px 10px" }}>
            {trip.status}
          </Tag>
        </div>

        <Divider style={{ borderColor: "rgba(255,255,255,0.2)", margin: "12px 0" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
              Tiến độ: <strong style={{ color: "#fff" }}>{trip.stops.length - pendingStopsCount} / {trip.stops.length} đơn</strong>
            </Text>
            <br />
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
              Đã giao: <strong style={{ color: "#fff" }}>{trip.totalDeliveredKg} kg</strong>
            </Text>
          </div>
          <div style={{ textAlign: "right" }}>
            <Text style={{ color: "#ffd666", fontSize: 12, display: "block" }}>
              <ThunderboltFilled /> Lương chuyến tạm tính:
            </Text>
            <Text style={{ color: "#52c41a", fontSize: 20, fontWeight: "bold", background: "#fff", padding: "2px 8px", borderRadius: 8 }}>
              +{trip.tripSalaryEarned.toLocaleString("vi-VN")} đ
            </Text>
          </div>
        </div>
      </Card>

      {/* THANH ĐIỀU KHIỂN XUẤT BẾN / VỀ KHO */}
      {!isDeparted ? (
        <Button
          type="primary"
          size="large"
          block
          icon={<CarOutlined />}
          style={{ height: 50, fontSize: 16, borderRadius: 12, marginBottom: 16, background: "#52c41a" }}
          onClick={handleDepart}
        >
          BẤM ĐÂY KHI XUẤT PHÁT RỜI KHO
        </Button>
      ) : !isReturned ? (
        pendingStopsCount === 0 && (
          <Button
            type="primary"
            size="large"
            block
            icon={<HomeOutlined />}
            style={{ height: 50, fontSize: 16, borderRadius: 12, marginBottom: 16, background: "#fa8c16" }}
            onClick={handleReturnToWarehouse}
          >
            ĐÃ GIAO XONG HẾT - BẤM VỀ TỚI KHO
          </Button>
        )
      ) : (
        <Alert
          message="Đã về tới kho! Chờ đối soát"
          description={`Tổng tiền mặt cần nộp: ${trip.totalCashCollected.toLocaleString("vi-VN")} đ`}
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 12 }}
        />
      )}

      {/* DANH SÁCH CÁC ĐIỂM DỪNG CẦN GIAO */}
      <Title level={5} style={{ margin: "12px 0 8px 4px" }}>
        Danh sách điểm giao hàng ({trip.stops.length})
      </Title>

      <Space direction="vertical" style={{ width: "100%" }} size={10}>
        {trip.stops.map((stop, index) => {
          const isDone = stop.status !== "PENDING";
          const statusColors: Record<string, string> = {
            PENDING: "default",
            SUCCESS: "success",
            PARTIAL: "warning",
            FAILED: "error",
          };
          const statusLabels: Record<string, string> = {
            PENDING: "Chưa giao",
            SUCCESS: "Đã giao đủ",
            PARTIAL: "Giao 1 phần",
            FAILED: "Giao thất bại",
          };

          return (
            <Card
              key={stop.id}
              bordered={false}
              style={{
                borderRadius: 14,
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                borderLeft: isDone ? "5px solid #52c41a" : "5px solid #1677ff",
              }}
              bodyStyle={{ padding: 14 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <Badge count={index + 1} style={{ backgroundColor: isDone ? "#52c41a" : "#1677ff" }} />
                  <Text strong style={{ marginLeft: 8, fontSize: 15 }}>
                    {stop.salesOrder.customerName}
                  </Text>
                </div>
                <Tag color={statusColors[stop.status]}>
                  {statusLabels[stop.status]}
                </Tag>
              </div>

              <div style={{ marginTop: 8, color: "#595959", fontSize: 13 }}>
                <EnvironmentOutlined style={{ color: "#ff4d4f", marginRight: 4 }} />
                {stop.salesOrder.shippingAddress}
              </div>

              <Divider style={{ margin: "8px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Cân nặng: <strong>{stop.salesOrder.totalWeightKg} kg</strong>
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Cần thu: <strong style={{ color: "#cf1322" }}>{stop.salesOrder.codAmountRequired.toLocaleString("vi-VN")} đ</strong>
                  </Text>
                </div>

                <Space>
                  {stop.salesOrder.customerPhone && (
                    <Button
                      type="default"
                      shape="circle"
                      icon={<PhoneOutlined />}
                      href={`tel:${stop.salesOrder.customerPhone}`}
                    />
                  )}

                  {!isDone && isDeparted && (
                    <Button
                      type="primary"
                      style={{ borderRadius: 8 }}
                      onClick={() => handleOpenStopDrawer(stop)}
                    >
                      Bấm giao hàng
                    </Button>
                  )}
                </Space>
              </div>
            </Card>
          );
        })}
      </Space>

      {/* DRAWER CẬP NHẬT KẾT QUẢ GIAO & THU TIỀN TẠI ĐIỂM (BOTTOM SHEET MOBILE) */}
      <Drawer
        title={`Giao hàng: ${selectedStop?.salesOrder.customerName}`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="bottom"
        height="85%"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitDelivery}>
          <Form.Item name="status" label="Kết quả giao hàng" rules={[{ required: true }]}>
            <Radio.Group buttonStyle="solid" style={{ width: "100%", display: "flex" }}>
              <Radio.Button value="SUCCESS" style={{ flex: 1, textAlign: "center" }}>
                Giao đủ
              </Radio.Button>
              <Radio.Button value="PARTIAL" style={{ flex: 1, textAlign: "center" }}>
                Giao 1 phần
              </Radio.Button>
              <Radio.Button value="FAILED" style={{ flex: 1, textAlign: "center" }}>
                Thất bại
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.status !== cur.status}
          >
            {({ getFieldValue }) => {
              const currentStatus = getFieldValue("status");

              if (currentStatus === "FAILED") {
                return (
                  <Form.Item
                    name="reason"
                    label="Lý do không giao được"
                    rules={[{ required: true, message: "Vui lòng ghi rõ lý do!" }]}
                  >
                    <Input.TextArea placeholder="VD: Khách đi vắng, sai số điện thoại, quán đóng cửa..." rows={3} />
                  </Form.Item>
                );
              }

              return (
                <>
                  <Form.Item
                    name="actualDeliveredKg"
                    label="Số Kg hàng thực tế khách nhận"
                    rules={[{ required: true }]}
                  >
                    <InputNumber style={{ width: "100%" }} addonAfter="kg" />
                  </Form.Item>

                  {currentStatus === "PARTIAL" && (
                    <Form.Item
                      name="reason"
                      label="Lý do khách trả lại 1 phần"
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="VD: Khách thừa 5 thùng, hàng ướt..." />
                    </Form.Item>
                  )}

                  <Divider style={{ margin: "12px 0" }}>Tiền thực tế thu được tại điểm</Divider>

                  <Form.Item name="cashCollected" label="Tiền mặt thu tại chỗ">
                    <InputNumber
                      style={{ width: "100%" }}
                      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      addonAfter="đ"
                    />
                  </Form.Item>

                  <Form.Item name="transferCollected" label="Khách chuyển khoản công ty">
                    <InputNumber
                      style={{ width: "100%" }}
                      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      addonAfter="đ"
                    />
                  </Form.Item>

                  <Form.Item name="debtSigned" label="Khách ký nợ (chưa trả tiền)">
                    <InputNumber
                      style={{ width: "100%" }}
                      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      addonAfter="đ"
                    />
                  </Form.Item>
                </>
              );
            }}
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={submitting}
            style={{ height: 48, borderRadius: 10, marginTop: 12 }}
          >
            LƯU KẾT QUẢ GIAO HÀNG
          </Button>
        </Form>
      </Drawer>
    </div>
  );
}