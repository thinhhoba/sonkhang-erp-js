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
  Drawer,
  Form,
  InputNumber,
  Badge,
  Tooltip,
  Divider,
} from "antd";
import {
  ShopOutlined,
  PlusOutlined,
  SyncOutlined,
  SearchOutlined,
  PhoneOutlined,
  MailOutlined,
  DollarOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface Supplier {
  id: string;
  code: string;
  name: string;
  taxCode: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  paymentTerms: string;
  creditLimit: number;
  currentDebt: number;
  bankAccount: string | null;
  bankName: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    purchaseOrders: number;
  };
}

export default function SuppliersManagementPage() {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [form] = Form.useForm();

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/procurement/suppliers");
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.data || []);
      } else {
        message.error("Lỗi khi tải danh sách NCC: " + data.error);
      }
    } catch (err: any) {
      message.error("Lỗi kết nối: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    form.setFieldsValue({
      code: sup.code,
      name: sup.name,
      taxCode: sup.taxCode,
      contactPerson: sup.contactPerson,
      phone: sup.phone,
      email: sup.email,
      address: sup.address,
      paymentTerms: sup.paymentTerms,
      creditLimit: sup.creditLimit,
      bankAccount: sup.bankAccount,
      bankName: sup.bankName,
    });
    setDrawerOpen(true);
  };

  const handleSubmitForm = async (values: any) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/procurement/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (result.success) {
        message.success("Đã lưu thông tin Nhà cung cấp thành công!");
        setDrawerOpen(false);
        form.resetFields();
        fetchSuppliers();
      } else {
        message.error("Lỗi: " + result.error);
      }
    } catch (err: any) {
      message.error("Lỗi hệ thống: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Thống kê nhanh
  const totalSuppliers = suppliers.length;
  const totalDebt = suppliers.reduce((sum, s) => sum + s.currentDebt, 0);
  const totalCreditLimit = suppliers.reduce((sum, s) => sum + s.creditLimit, 0);
  const net30Count = suppliers.filter((s) => s.paymentTerms === "NET30").length;

  // Lọc theo tìm kiếm
  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.taxCode.toLowerCase().includes(q)
    );
  });

  const getPaymentTermTag = (term: string) => {
    switch (term) {
      case "NET30":
        return <Tag color="blue">Công nợ 30 ngày</Tag>;
      case "NET15":
        return <Tag color="cyan">Công nợ 15 ngày</Tag>;
      case "NET45":
      case "NET60":
        return <Tag color="geekblue">Công nợ 45-60 ngày</Tag>;
      case "IMMEDIATE":
        return <Tag color="green">Thanh toán ngay</Tag>;
      default:
        return <Tag>{term}</Tag>;
    }
  };

  const columns = [
    {
      title: "Mã NCC",
      dataIndex: "code",
      key: "code",
      width: 140,
      render: (code: string) => (
        <Text strong style={{ color: "#0958d9" }}>
          {code}
        </Text>
      ),
    },
    {
      title: "Tên Nhà Cung Cấp & MST",
      key: "name",
      render: (_: any, r: Supplier) => (
        <div>
          <Text strong>{r.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            MST: <Text copyable strong>{r.taxCode}</Text>
          </Text>
        </div>
      ),
    },
    {
      title: "Liên hệ & Địa chỉ",
      key: "contact",
      render: (_: any, r: Supplier) => (
        <div style={{ fontSize: 12 }}>
          {r.contactPerson && (
            <div>
              <Text strong>{r.contactPerson}</Text>
            </div>
          )}
          {r.phone && (
            <div>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {r.phone}
            </div>
          )}
          {r.address && (
            <Tooltip title={r.address}>
              <Text type="secondary" ellipsis style={{ maxWidth: 220, display: "inline-block" }}>
                {r.address}
              </Text>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Điều khoản thanh toán",
      dataIndex: "paymentTerms",
      key: "paymentTerms",
      width: 150,
      render: (term: string) => getPaymentTermTag(term),
    },
    {
      title: "Hạn mức công nợ",
      dataIndex: "creditLimit",
      key: "creditLimit",
      width: 140,
      align: "right" as const,
      render: (v: number) => (
        <Text strong style={{ color: "#595959" }}>
          {v > 0 ? `${v.toLocaleString("vi-VN")} đ` : "Chưa đặt"}
        </Text>
      ),
    },
    {
      title: "Công nợ hiện tại",
      dataIndex: "currentDebt",
      key: "currentDebt",
      width: 140,
      align: "right" as const,
      sorter: (a: Supplier, b: Supplier) => a.currentDebt - b.currentDebt,
      render: (v: number) => (
        <Text strong style={{ color: v > 0 ? "#cf1322" : "#52c41a" }}>
          {v.toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Đơn PO",
      key: "orders",
      width: 90,
      align: "center" as const,
      render: (_: any, r: Supplier) => (
        <Tag color="purple">{r._count?.purchaseOrders || 0} đơn</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 90,
      align: "center" as const,
      render: (_: any, r: Supplier) => (
        <Button size="small" type="link" onClick={() => handleOpenEdit(r)}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* 1. HEADER & THỐNG KÊ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <ShopOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            Phân hệ Mua hàng: Hồ sơ Nhà Cung Cấp
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Quản lý thông tin đối tác &bull; Hạn mức công nợ & Điều khoản thanh toán &bull; Liên kết Đơn PO & Hóa đơn meInvoice
          </Text>
        </div>

        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            style={{ background: "#1890ff" }}
          >
            Thêm Nhà cung cấp mới
          </Button>
          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchSuppliers}>
            Làm mới
          </Button>
        </Space>
      </div>

      {/* 2. THẺ THỐNG KÊ NHANH */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng Nhà cung cấp"
              value={totalSuppliers}
              prefix={<ShopOutlined style={{ color: "#1890ff" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng công nợ phải trả"
              value={totalDebt.toLocaleString("vi-VN")}
              suffix="đ"
              valueStyle={{ color: totalDebt > 0 ? "#cf1322" : "#52c41a" }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng hạn mức công nợ"
              value={totalCreditLimit.toLocaleString("vi-VN")}
              suffix="đ"
              valueStyle={{ color: "#d46b08" }}
              prefix={<CreditCardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Điều khoản NET30"
              value={net30Count}
              suffix={`/ ${totalSuppliers} NCC`}
              valueStyle={{ color: "#0958d9" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 3. BẢNG DỮ LIỆU */}
      <Card
        size="small"
        bordered
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text strong>Danh sách Đối tác & Nhà cung cấp ({filteredSuppliers.length})</Text>
            <Input
              placeholder="Tìm theo tên NCC, MST, mã..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
          </div>
        }
      >
        <Table
          rowKey="id"
          size="small"
          bordered
          sticky
          loading={loading}
          dataSource={filteredSuppliers}
          columns={columns}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      {/* 4. DRAWER THÊM / SỬA NHÀ CUNG CẤP */}
      <Drawer
        title={editingSupplier ? `Sửa Nhà Cung Cấp: ${editingSupplier.name}` : "Thêm Nhà Cung Cấp Mới"}
        width={580}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={() => form.submit()}
            >
              Lưu thông tin
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item
                name="code"
                label="Mã NCC"
                rules={[{ required: true, message: "Vui lòng nhập mã NCC!" }]}
              >
                <Input placeholder="VD: NCC-INDOMIE" disabled={!!editingSupplier} />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item
                name="taxCode"
                label="Mã số thuế (MST)"
                rules={[{ required: true, message: "Vui lòng nhập MST!" }]}
              >
                <Input placeholder="VD: 0313888999" disabled={!!editingSupplier} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="name"
            label="Tên đầy đủ Nhà cung cấp"
            rules={[{ required: true, message: "Vui lòng nhập tên NCC!" }]}
          >
            <Input placeholder="VD: Công ty TNHH Thực phẩm Indomie Việt Nam" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="contactPerson" label="Người liên hệ đại diện">
                <Input placeholder="VD: Nguyễn Văn Đại Diện" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Số điện thoại liên lạc">
                <Input placeholder="VD: 0988.123.456" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="email" label="Email nhận hóa đơn / PO">
                <Input placeholder="VD: ketoan@indomie.vn" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentTerms"
                label="Điều khoản thanh toán"
                initialValue="NET30"
              >
                <Select
                  options={[
                    { value: "NET30", label: "Công nợ 30 ngày (NET30)" },
                    { value: "NET15", label: "Công nợ 15 ngày (NET15)" },
                    { value: "NET45", label: "Công nợ 45 ngày (NET45)" },
                    { value: "NET60", label: "Công nợ 60 ngày (NET60)" },
                    { value: "IMMEDIATE", label: "Thanh toán ngay khi nhận hàng" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="creditLimit"
                label="Hạn mức công nợ tối đa"
                initialValue={50000000}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bankAccount" label="Số tài khoản ngân hàng">
                <Input placeholder="VD: 19038888999" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="bankName" label="Tên ngân hàng & Chi nhánh">
            <Input placeholder="VD: Techcombank - Chi nhánh Thăng Long" />
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ trụ sở / Kho xuất hàng">
            <Input.TextArea rows={2} placeholder="VD: Lô CN4, KCN Thạch Thất, Hà Nội" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
