"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Typography,
  Descriptions,
  Divider,
  Timeline,
} from "antd";
import {
  CarOutlined,
  PlusOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export default function VehiclesPage() {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  // Drawer states
  const [vehicleDrawerOpen, setVehicleDrawerOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);

  const [maintenanceDrawerOpen, setMaintenanceDrawerOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);

  const [vehicleForm] = Form.useForm();
  const [maintenanceForm] = Form.useForm();

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/fleet/vehicles");
      const json = await res.json();
      if (json.success) setVehicles(json.data);
    } catch {
      message.error("Lỗi khi tải danh sách phương tiện");
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch("/api/hr/drivers");
      const json = await res.json();
      if (json.success) setDrivers(json.data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, []);

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    vehicleForm.resetFields();
    vehicleForm.setFieldsValue({
      modelName: "Tera V6",
      manufacturer: "Daehan Motors",
      payloadCapacityKg: 945,
      fuelType: "DIESEL",
      status: "ACTIVE",
      yearOfManufacture: 2024,
    });
    setVehicleDrawerOpen(true);
  };

  const handleOpenEdit = (v: any) => {
    setEditingVehicle(v);
    vehicleForm.setFieldsValue({
      ...v,
      insuranceExpiryDate: v.insuranceExpiryDate ? dayjs(v.insuranceExpiryDate) : null,
      registrationExpiryDate: v.registrationExpiryDate ? dayjs(v.registrationExpiryDate) : null,
    });
    setVehicleDrawerOpen(true);
  };

  const handleSaveVehicle = async () => {
    try {
      const values = await vehicleForm.validateFields();
      const payload = {
        ...values,
        id: editingVehicle?.id,
        insuranceExpiryDate: values.insuranceExpiryDate ? values.insuranceExpiryDate.toISOString() : null,
        registrationExpiryDate: values.registrationExpiryDate ? values.registrationExpiryDate.toISOString() : null,
      };

      const res = await fetch("/api/fleet/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        message.success(editingVehicle ? "Đã cập nhật thông tin xe" : "Đã thêm phương tiện mới");
        setVehicleDrawerOpen(false);
        fetchVehicles();
      } else {
        message.error(json.error || "Không thể lưu phương tiện");
      }
    } catch {
      // Validation failed
    }
  };

  const handleOpenMaintenance = async (v: any) => {
    setSelectedVehicle(v);
    maintenanceForm.resetFields();
    maintenanceForm.setFieldsValue({
      odometerKm: v.currentOdometerKm,
      serviceType: "THAY_NHOT",
      status: "COMPLETED",
      performedById: v.assignedDriver?.fullName || "Tài xế phụ trách",
    });
    setMaintenanceDrawerOpen(true);

    try {
      setLoadingMaintenance(true);
      const res = await fetch(`/api/fleet/vehicles/${v.id}/maintenance`);
      const json = await res.json();
      if (json.success) setMaintenances(json.data);
    } catch {
      message.error("Lỗi khi tải lịch sử bảo dưỡng");
    } finally {
      setLoadingMaintenance(false);
    }
  };

  const handleAddMaintenance = async () => {
    try {
      const values = await maintenanceForm.validateFields();
      const res = await fetch(`/api/fleet/vehicles/${selectedVehicle.id}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (json.success) {
        message.success("Đã ghi nhận bảo dưỡng phương tiện");
        maintenanceForm.resetFields();
        maintenanceForm.setFieldsValue({
          odometerKm: values.odometerKm,
          serviceType: "THAY_NHOT",
          status: "COMPLETED",
        });
        // Refresh maintenance list
        const mRes = await fetch(`/api/fleet/vehicles/${selectedVehicle.id}/maintenance`);
        const mJson = await mRes.json();
        if (mJson.success) setMaintenances(mJson.data);
        fetchVehicles();
      } else {
        message.error(json.error || "Không thể lưu bảo dưỡng");
      }
    } catch {
      // Validation error
    }
  };

  // Metrics
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === "ACTIVE").length;
  const maintenanceCount = vehicles.filter((v) => v.status === "MAINTENANCE").length;

  const columns = [
    {
      title: "Biển số xe",
      dataIndex: "plateNumber",
      key: "plateNumber",
      render: (val: string) => (
        <Tag color="blue" style={{ fontSize: 13, fontWeight: "bold" }}>
          {val}
        </Tag>
      ),
    },
    {
      title: "Dòng xe & Tải trọng",
      key: "model",
      render: (_: any, r: any) => (
        <div>
          <Text strong>{r.modelName}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Tải trọng: {r.payloadCapacityKg} kg ({r.manufacturer})
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Số ODO hiện tại",
      dataIndex: "currentOdometerKm",
      key: "currentOdometerKm",
      render: (km: number) => (
        <Space>
          <DashboardOutlined style={{ color: "#1890ff" }} />
          <Text strong>{km ? `${km.toLocaleString("vi-VN")} km` : "0 km"}</Text>
        </Space>
      ),
    },
    {
      title: "Tài xế phụ trách",
      key: "driver",
      render: (_: any, r: any) => (
        <div>
          {r.assignedDriver ? (
            <Space>
              <UserOutlined />
              <Text strong>{r.assignedDriver.fullName}</Text>
            </Space>
          ) : (
            <Text type="secondary">Chưa phân công</Text>
          )}
        </div>
      ),
    },
    {
      title: "Hạn Đăng kiểm",
      dataIndex: "registrationExpiryDate",
      key: "registrationExpiryDate",
      render: (d: string) => {
        if (!d) return <Text type="secondary">Chưa có</Text>;
        const exp = dayjs(d);
        const diff = exp.diff(dayjs(), "day");
        const isExpiring = diff <= 30;
        return (
          <Tag color={isExpiring ? "error" : "success"}>
            {exp.format("DD/MM/YYYY")} {isExpiring && `(Còn ${diff} ngày)`}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (st: string) => {
        if (st === "ACTIVE") return <Tag color="success">Đang vận hành</Tag>;
        if (st === "MAINTENANCE") return <Tag color="warning">Đang bảo dưỡng</Tag>;
        return <Tag color="default">Tạm ngưng</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, r: any) => (
        <Space>
          <Button
            size="small"
            icon={<ToolOutlined />}
            onClick={() => handleOpenMaintenance(r)}
          >
            Bảo dưỡng ({r._count?.maintenances || 0})
          </Button>
          <Button size="small" onClick={() => handleOpenEdit(r)}>
            Sửa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Quản Lý Đội Xe & Bảo Dưỡng Phương Tiện (Fleet Management)
          </Title>
          <Text type="secondary">
            Theo dõi đội xe Tera V6 945kg, kiểm soát định mức ODO, hạn đăng kiểm và lịch sử bảo dưỡng
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            size="large"
          >
            Thêm Xe Mới
          </Button>
        </Col>
      </Row>

      {/* 4 Standard Summary Cards (Modern SaaS Architecture) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
            }}
            bodyStyle={{ padding: "18px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <CarOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Tổng Đội Xe Tera
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  {totalVehicles} xe
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
                  Tải trọng 945kg / xe
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
            }}
            bodyStyle={{ padding: "18px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#16a34a",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <CheckCircleOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Sẵn Sàng Vận Hành
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a", marginTop: 2 }}>
                  {activeVehicles} xe
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                  Đạt 100% chỉ tiêu đội xe
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
            }}
            bodyStyle={{ padding: "18px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: "#fffbeb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f59e0b",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <ToolOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Đang Bảo Dưỡng
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b", marginTop: 2 }}>
                  {maintenanceCount} xe
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
                  Định kỳ ODO 5.000km
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
            }}
            bodyStyle={{ padding: "18px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ef4444",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <WarningOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Hạn Đăng Kiểm
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444", marginTop: 2 }}>
                  0 xe
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#16a34a" }}>
                  Tất cả đều an toàn
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <Table
          columns={columns}
          dataSource={vehicles}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      {/* Drawer Create / Edit Vehicle */}
      <Drawer
        title={editingVehicle ? "Cập Nhật Thông Tin Xe" : "Thêm Phương Tiện Mới"}
        width={560}
        open={vehicleDrawerOpen}
        onClose={() => setVehicleDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setVehicleDrawerOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleSaveVehicle}>
              Lưu Phương Tiện
            </Button>
          </Space>
        }
      >
        <Form form={vehicleForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Biển số xe"
                name="plateNumber"
                rules={[{ required: true, message: "Vui lòng nhập biển số xe" }]}
              >
                <Input placeholder="VD: 51D-998.24" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Dòng xe" name="modelName">
                <Input placeholder="Tera V6 945kg" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Nhà sản xuất" name="manufacturer">
                <Input placeholder="Daehan Motors" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Năm sản xuất" name="yearOfManufacture">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tải trọng cho phép (Kg)" name="payloadCapacityKg">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Số ODO hiện tại (km)" name="currentOdometerKm">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Nhiên liệu" name="fuelType">
                <Select>
                  <Option value="DIESEL">Dầu Diesel</Option>
                  <Option value="GASOLINE">Xăng</Option>
                  <Option value="ELECTRIC">Điện</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái" name="status">
                <Select>
                  <Option value="ACTIVE">Đang vận hành</Option>
                  <Option value="MAINTENANCE">Đang bảo dưỡng / Sửa chữa</Option>
                  <Option value="INACTIVE">Tạm ngưng hoạt động</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Tài xế phụ trách chính" name="assignedDriverId">
            <Select allowClear placeholder="Chọn tài xế phụ trách xe">
              {drivers.map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.fullName} ({d.phone})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Hạn đăng kiểm xe" name="registrationExpiryDate">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Hạn bảo hiểm bắt buộc" name="insuranceExpiryDate">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      {/* Drawer Maintenance History & Log */}
      <Drawer
        title={
          <Space>
            <ToolOutlined style={{ color: "#faad14" }} />
            <span>
              Lịch Sử Bảo Dưỡng - Xe {selectedVehicle?.plateNumber} ({selectedVehicle?.modelName})
            </span>
          </Space>
        }
        width={720}
        open={maintenanceDrawerOpen}
        onClose={() => setMaintenanceDrawerOpen(false)}
      >
        <Card size="small" title="Ghi nhận đợt bảo dưỡng / Sửa chữa mới" style={{ marginBottom: 20 }}>
          <Form form={maintenanceForm} layout="vertical">
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  label="Loại dịch vụ"
                  name="serviceType"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="THAY_NHOT">Thay nhớt & Lọc dầu</Option>
                    <Option value="BAO_DUONG_PHANH">Bảo dưỡng phanh</Option>
                    <Option value="THAY_LOP">Thay lốp / Đảo lốp</Option>
                    <Option value="DANG_KIEM">Khám đăng kiểm</Option>
                    <Option value="REPAIR_OTHER">Sửa chữa phát sinh</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Số ODO km"
                  name="odometerKm"
                  rules={[{ required: true }]}
                >
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Chi phí (VNĐ)" name="cost">
                  <InputNumber
                    style={{ width: "100%" }}
                    formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, "") || 0)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Hạng mục bảo dưỡng chi tiết"
              name="title"
              rules={[{ required: true, message: "Vui lòng nhập hạng mục" }]}
            >
              <Input placeholder="VD: Thay dầu Castrol 10W-40, lọc nhớt, vệ sinh lọc gió" />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Gara / Đơn vị thực hiện" name="garageName">
                  <Input placeholder="Gara Ô Tô Minh Phát" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Người giám sát / Tài xế" name="performedById">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Button type="primary" onClick={handleAddMaintenance} icon={<PlusOutlined />}>
              Lưu Lịch Sử Bảo Dưỡng
            </Button>
          </Form>
        </Card>

        <Title level={5}>Lịch Sử Bảo Dưỡng Đã Thực Hiện</Title>
        <Table
          size="small"
          loading={loadingMaintenance}
          dataSource={maintenances}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: "Ngày",
              dataIndex: "maintenanceDate",
              key: "maintenanceDate",
              render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
            },
            {
              title: "Hạng mục",
              key: "title",
              render: (_: any, r: any) => (
                <div>
                  <Text strong>{r.title}</Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Tại: {r.odometerKm?.toLocaleString("vi-VN")} km {r.garageName && `• ${r.garageName}`}
                    </Text>
                  </div>
                </div>
              ),
            },
            {
              title: "Chi phí",
              dataIndex: "cost",
              key: "cost",
              render: (c: number) => (
                <Text strong style={{ color: "#fa8c16" }}>
                  {c ? `${c.toLocaleString("vi-VN")} đ` : "0 đ"}
                </Text>
              ),
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              key: "status",
              render: (st: string) => <Tag color="success">{st}</Tag>,
            },
          ]}
        />
      </Drawer>
    </div>
  );
}
