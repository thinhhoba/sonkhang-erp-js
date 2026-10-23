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
  Input,
  Drawer,
  Form,
  InputNumber,
  Select,
  Switch,
  message,
  Typography,
  Progress,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

export default function CustomersPage({ canManage = false }: { canManage?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");

  // Drawer states
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const [form] = Form.useForm();

  const fetchCustomers = async (search?: string) => {
    try {
      setLoading(true);
      const url = search
        ? `/api/sales/customers?search=${encodeURIComponent(search)}`
        : "/api/sales/customers";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
      } else {
        message.error(json.error || "Không thể tải danh sách khách hàng");
      }
    } catch {
      message.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = () => {
    fetchCustomers(searchText);
  };

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    form.resetFields();
    form.setFieldsValue({
      creditLimit: 30000000,
      paymentTerms: "NET30",
      maxOverdueDays: 30,
      city: "TP. Hồ Chí Minh",
      isBlocked: false,
    });
    setFormDrawerOpen(true);
  };

  const handleOpenEdit = (record: any) => {
    setEditingCustomer(record);
    form.setFieldsValue({
      ...record,
    });
    setFormDrawerOpen(true);
  };

  const handleOpenDetail = async (record: any) => {
    try {
      const res = await fetch(`/api/sales/customers/${record.id}`);
      const json = await res.json();
      if (json.success) {
        setSelectedCustomer(json.data);
        setDetailDrawerOpen(true);
      } else {
        message.error(json.error || "Không thể tải chi tiết");
      }
    } catch {
      message.error("Lỗi khi tải chi tiết khách hàng");
    }
  };

  const handleSaveCustomer = async () => {
    try {
      const values = await form.validateFields();
      const res = await fetch("/api/sales/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          id: editingCustomer?.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(editingCustomer ? "Đã cập nhật khách hàng" : "Đã thêm khách hàng mới");
        setFormDrawerOpen(false);
        fetchCustomers(searchText);
      } else {
        message.error(json.error || "Thao tác thất bại");
      }
    } catch {
      // Form validation failed
    }
  };

  const columns = [
    {
      title: "Mã KH",
      dataIndex: "customerCode",
      key: "customerCode",
      render: (val: string) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: "Khách hàng",
      key: "name",
      render: (_: any, r: any) => (
        <div>
          <Text strong>{r.name}</Text>
          {r.phone && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                SĐT: {r.phone}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Khu vực / Quận",
      dataIndex: "district",
      key: "district",
      render: (val: string) =>
        val ? (
          <Tag color="cyan">{val}</Tag>
        ) : (
          <Text type="secondary">Chưa định danh</Text>
        ),
    },
    {
      title: "Điều khoản",
      dataIndex: "paymentTerms",
      key: "paymentTerms",
      render: (val: string) => <Tag color="purple">{val || "NET30"}</Tag>,
    },
    {
      title: "Hạn mức nợ",
      dataIndex: "creditLimit",
      key: "creditLimit",
      render: (val: number) => (
        <Text>{val ? val.toLocaleString("vi-VN") + "đ" : "Không giới hạn"}</Text>
      ),
    },
    {
      title: "Công nợ hiện tại (AR)",
      dataIndex: "currentDebt",
      key: "currentDebt",
      render: (val: number, r: any) => {
        const isOver = r.creditLimit > 0 && val > r.creditLimit;
        return (
          <Text strong style={{ color: isOver ? "#ff4d4f" : "#1890ff" }}>
            {val.toLocaleString("vi-VN")}đ
          </Text>
        );
      },
    },
    {
      title: "Tỷ lệ sử dụng",
      key: "utilization",
      width: 160,
      render: (_: any, r: any) => {
        if (!r.creditLimit) return <Text type="secondary">N/A</Text>;
        const percent = Math.min(100, Math.round((r.currentDebt / r.creditLimit) * 100));
        let status: "normal" | "exception" | "success" = "normal";
        if (percent >= 100) status = "exception";
        return (
          <Progress
            percent={percent}
            size="small"
            status={status}
            format={() => `${percent}%`}
          />
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: any, r: any) => {
        if (r.isBlocked) return <Tag color="error">Bị khóa nợ</Tag>;
        if (r.creditLimit > 0 && r.currentDebt > r.creditLimit)
          return <Tag color="warning">Vượt hạn mức</Tag>;
        return <Tag color="success">Bình thường</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, r: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenDetail(r)}
          >
            Hồ sơ
          </Button>
          {canManage ? <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(r)}
          >
            Sửa
          </Button> : null}
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
            Quản Lý Công Nợ Khách Hàng (Sales AR)
          </Title>
          <Text type="secondary">
            Theo dõi hạn mức tín dụng, công nợ phải thu và chặn đơn hàng vượt định mức
          </Text>
        </Col>
        {canManage ? <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            size="large"
          >
            Thêm Khách Hàng
          </Button>
        </Col> : null}
      </Row>

      {/* Filter and Search */}
      <Card
        bordered={false}
        style={{ marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Tìm theo Mã KH, Tên khách hàng hoặc Số điện thoại..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col>
            <Button type="primary" onClick={handleSearch}>
              Tìm kiếm
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
        />
      </Card>

      {/* Form Drawer (Create / Edit) */}
      {canManage ? <Drawer
        title={editingCustomer ? "Chỉnh Sửa Hồ Sơ Khách Hàng" : "Thêm Mới Khách Hàng"}
        width={560}
        open={formDrawerOpen}
        onClose={() => setFormDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setFormDrawerOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleSaveCustomer}>
              Lưu Khách Hàng
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Mã khách hàng" name="customerCode">
                <Input placeholder="Tự sinh nếu để trống" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên khách hàng"
                name="name"
                rules={[{ required: true, message: "Vui lòng nhập tên khách hàng" }]}
              >
                <Input placeholder="Công ty / Cửa hàng / Đại lý" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số điện thoại" name="phone">
                <Input placeholder="0908..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email">
                <Input placeholder="contact@..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Địa chỉ giao hàng" name="address">
            <Input.TextArea rows={2} placeholder="Số nhà, đường, phường..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Quận / Huyện" name="district">
                <Input placeholder="VD: Tân Bình, Cầu Giấy..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tỉnh / Thành phố" name="city">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Card title="Chính sách Tín dụng & Công nợ" size="small" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Điều khoản thanh toán" name="paymentTerms">
                  <Select>
                    <Option value="COD">Thu tiền ngay (COD)</Option>
                    <Option value="NET15">Công nợ 15 ngày (NET15)</Option>
                    <Option value="NET30">Công nợ 30 ngày (NET30)</Option>
                    <Option value="NET45">Công nợ 45 ngày (NET45)</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Hạn mức công nợ (VNĐ)" name="creditLimit">
                  <InputNumber
                    style={{ width: "100%" }}
                    formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, "") || 0)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Số ngày quá hạn tối đa" name="maxOverdueDays">
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Khóa nợ (Không cho lên đơn)" name="isBlocked" valuePropName="checked">
                  <Switch checkedChildren="Khóa" unCheckedChildren="Mở" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </Drawer> : null}

      {/* Customer Detail Drawer */}
      <Drawer
        title="Hồ Sơ Chi Tiết & Lịch Sử Công Nợ"
        width={700}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
      >
        {selectedCustomer && (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Mã KH">
                <Tag color="blue">{selectedCustomer.customerCode}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tên khách hàng">
                <Text strong>{selectedCustomer.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedCustomer.phone || "---"}
              </Descriptions.Item>
              <Descriptions.Item label="Khu vực / Quận">
                <Tag color="cyan">{selectedCustomer.district || "Chưa rõ"}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {selectedCustomer.address || "---"}
              </Descriptions.Item>
              <Descriptions.Item label="Điều khoản">
                <Tag color="purple">{selectedCustomer.paymentTerms}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Hạn mức tín dụng">
                <Text strong>
                  {selectedCustomer.creditLimit?.toLocaleString("vi-VN")}đ
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Công nợ hiện tại">
                <Text
                  strong
                  style={{
                    color:
                      selectedCustomer.creditLimit > 0 &&
                      selectedCustomer.currentDebt > selectedCustomer.creditLimit
                        ? "#ff4d4f"
                        : "#1890ff",
                  }}
                >
                  {selectedCustomer.currentDebt?.toLocaleString("vi-VN")}đ
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {selectedCustomer.isBlocked ? (
                  <Tag color="error">BỊ KHÓA NỢ</Tag>
                ) : (
                  <Tag color="success">ĐANG HOẠT ĐỘNG</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
              Đơn hàng gần đây
            </Title>
            <Table
              size="small"
              dataSource={selectedCustomer.salesOrders || []}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: "Mã đơn",
                  dataIndex: "orderCode",
                  key: "orderCode",
                  render: (v: string) => <Tag color="blue">{v}</Tag>,
                },
                {
                  title: "Ngày đặt",
                  dataIndex: "orderDate",
                  key: "orderDate",
                  render: (d: string) => new Date(d).toLocaleDateString("vi-VN"),
                },
                {
                  title: "Tổng tiền",
                  dataIndex: "totalAmount",
                  key: "totalAmount",
                  render: (v: number) => `${v.toLocaleString("vi-VN")}đ`,
                },
                {
                  title: "Trạng thái",
                  dataIndex: "deliveryStatus",
                  key: "deliveryStatus",
                  render: (s: string) => <Tag>{s}</Tag>,
                },
              ]}
            />

            <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
              Lịch sử trả hàng (Sales Returns)
            </Title>
            <Table
              size="small"
              dataSource={selectedCustomer.salesReturns || []}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: "Mã phiếu",
                  dataIndex: "returnCode",
                  key: "returnCode",
                  render: (v: string) => <Tag color="volcano">{v}</Tag>,
                },
                {
                  title: "Ngày trả",
                  dataIndex: "returnDate",
                  key: "returnDate",
                  render: (d: string) => new Date(d).toLocaleDateString("vi-VN"),
                },
                {
                  title: "Tiền hoàn trả",
                  dataIndex: "totalReturnAmount",
                  key: "totalReturnAmount",
                  render: (v: number) => `${v.toLocaleString("vi-VN")}đ`,
                },
                {
                  title: "Giảm trừ AR",
                  dataIndex: "arDeductionAmount",
                  key: "arDeductionAmount",
                  render: (v: number) => (
                    <Text strong style={{ color: "#52c41a" }}>
                      -{v.toLocaleString("vi-VN")}đ
                    </Text>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
