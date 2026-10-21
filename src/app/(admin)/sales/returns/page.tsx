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
  message,
  Typography,
  Descriptions,
  Divider,
} from "antd";
import {
  RollbackOutlined,
  PlusOutlined,
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

export default function SalesReturnsPage() {
  const [loading, setLoading] = useState(false);
  const [returns, setReturns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Drawer states
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);

  const [form] = Form.useForm();
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sales/returns");
      const json = await res.json();
      if (json.success) {
        setReturns(json.data);
      } else {
        message.error(json.error || "Không thể tải danh sách phiếu trả hàng");
      }
    } catch {
      message.error("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [prodRes, orderRes] = await Promise.all([
        fetch("/api/inventory/products"),
        fetch("/api/procurement/orders"), // We can also fetch sales orders
      ]);
      const prodJson = await prodRes.json();
      if (prodJson.success) setProducts(prodJson.data);

      const sOrderRes = await fetch("/api/sales/orders");
      if (sOrderRes.ok) {
        const sOrderJson = await sOrderRes.json();
        if (sOrderJson.success) setOrders(sOrderJson.data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchReturns();
    fetchDependencies();
  }, []);

  const handleOpenCreate = () => {
    form.resetFields();
    setSelectedItems([]);
    form.setFieldsValue({
      reason: "Khách từ chối nhận tại điểm giao",
      receivedById: "Thủ kho trực ban",
    });
    setCreateDrawerOpen(true);
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    setSelectedItems([
      ...selectedItems,
      {
        key: Date.now(),
        productId: defaultProd.id,
        quantity: 1,
        unitPrice: 100000,
        condition: "GOOD",
        reason: "",
      },
    ]);
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...selectedItems];
    updated[index][field] = val;
    setSelectedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...selectedItems];
    updated.splice(index, 1);
    setSelectedItems(updated);
  };

  const handleSubmitReturn = async () => {
    try {
      const values = await form.validateFields();
      if (selectedItems.length === 0) {
        message.warning("Vui lòng thêm ít nhất một mặt hàng trả lại!");
        return;
      }

      for (const it of selectedItems) {
        if (!it.productId || it.quantity <= 0) {
          message.warning("Vui lòng nhập đúng sản phẩm và số lượng trả > 0");
          return;
        }
      }

      const payload = {
        salesOrderId: values.salesOrderId || undefined,
        tripCode: values.tripCode || undefined,
        reason: values.reason,
        receivedById: values.receivedById,
        note: values.note,
        items: selectedItems.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice || 0,
          condition: it.condition || "GOOD",
          reason: it.reason,
        })),
      };

      const res = await fetch("/api/sales/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        message.success("Đã ghi nhận phiếu trả hàng và xử lý kho / giảm trừ AR thành công!");
        setCreateDrawerOpen(false);
        fetchReturns();
      } else {
        message.error(json.error || "Không thể tạo phiếu trả hàng");
      }
    } catch {
      // Form validation error
    }
  };

  // Metrics
  const totalCount = returns.length;
  const totalReturnValue = returns.reduce((sum, r) => sum + (r.totalReturnAmount || 0), 0);
  const totalArDeducted = returns.reduce((sum, r) => sum + (r.arDeductionAmount || 0), 0);

  const columns = [
    {
      title: "Mã phiếu",
      dataIndex: "returnCode",
      key: "returnCode",
      render: (val: string) => <Tag color="volcano">{val}</Tag>,
    },
    {
      title: "Ngày nhận",
      dataIndex: "returnDate",
      key: "returnDate",
      render: (val: string) => new Date(val).toLocaleDateString("vi-VN"),
    },
    {
      title: "Đơn hàng / Xe trả về",
      key: "reference",
      render: (_: any, r: any) => (
        <div>
          {r.salesOrder ? (
            <Tag color="blue">{r.salesOrder.orderCode}</Tag>
          ) : (
            <Text type="secondary">Khách lẻ / Độc lập</Text>
          )}
          {r.tripCode && (
            <div>
              <Tag color="purple">{r.tripCode}</Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: any, r: any) => (
        <div>
          <Text strong>{r.customer?.name || r.salesOrder?.customerName || "Khách lẻ"}</Text>
          {r.customer?.phone && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.customer.phone}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      render: (val: string) => <Text>{val}</Text>,
    },
    {
      title: "Tổng tiền hàng trả",
      dataIndex: "totalReturnAmount",
      key: "totalReturnAmount",
      render: (val: number) => (
        <Text strong style={{ color: "#fa8c16" }}>
          {val.toLocaleString("vi-VN")}đ
        </Text>
      ),
    },
    {
      title: "Giảm trừ AR",
      dataIndex: "arDeductionAmount",
      key: "arDeductionAmount",
      render: (val: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          -{val.toLocaleString("vi-VN")}đ
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (val: string) => (
        <Tag color={val === "COMPLETED" ? "success" : "default"}>
          {val === "COMPLETED" ? "Đã nhập kho & giảm nợ" : val}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, r: any) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedReturn(r);
            setDetailDrawerOpen(true);
          }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Quản Lý Hàng Đổi Trả & Hàng Rớt Xe (Sales Returns)
          </Title>
          <Text type="secondary">
            Xử lý hàng khách từ chối, hàng lỗi hỏng từ xe Tera V6 trả về, tự động hoàn kho & giảm trừ AR
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            size="large"
          >
            Tạo Phiếu Trả Hàng
          </Button>
        </Col>
      </Row>

      {/* 4 Standard Summary Cards (Modern SaaS Architecture) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Card 1: Tổng số phiếu */}
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
                  background: "#fff7ed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ea580c",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <RollbackOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Tổng Phiếu Trả Hàng
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  {totalCount} phiếu
                </div>
                <div style={{ marginTop: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#16a34a", fontWeight: 700, background: "#dcfce7", padding: "1px 6px", borderRadius: 4 }}>
                    <ArrowDownOutlined /> 4.2%
                  </span>
                  <span style={{ color: "#94a3b8" }}>so với kỳ trước</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Card 2: Giá trị hàng trả */}
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
                  color: "#dc2626",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <DollarOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Tổng Giá Trị Hàng Trả
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626", marginTop: 2 }}>
                  {totalReturnValue.toLocaleString("vi-VN")} đ
                </div>
                <div style={{ marginTop: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#dc2626", fontWeight: 700, background: "#fee2e2", padding: "1px 6px", borderRadius: 4 }}>
                    <ArrowDownOutlined /> 1.8%
                  </span>
                  <span style={{ color: "#94a3b8" }}>tỷ lệ hoàn 1.3%</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Card 3: Công nợ giảm trừ */}
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
                  Công Nợ Giảm Trừ (AR)
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a", marginTop: 2 }}>
                  {totalArDeducted.toLocaleString("vi-VN")} đ
                </div>
                <div style={{ marginTop: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#16a34a", fontWeight: 700, background: "#dcfce7", padding: "1px 6px", borderRadius: 4 }}>
                    <ArrowUpOutlined /> 100%
                  </span>
                  <span style={{ color: "#94a3b8" }}>đối trừ tự động</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Card 4: Tái nhập kho an toàn */}
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
                <InboxOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Hàng Nhập Lại Kho
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#2563eb", marginTop: 2 }}>
                  {returns.reduce((sum, r) => sum + (r.items?.length || 0), 0)} SKU
                </div>
                <div style={{ marginTop: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#16a34a", fontWeight: 700, background: "#dcfce7", padding: "1px 6px", borderRadius: 4 }}>
                    <ArrowUpOutlined /> OK
                  </span>
                  <span style={{ color: "#94a3b8" }}>cập nhật thẻ kho</span>
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
          dataSource={returns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
        />
      </Card>

      {/* Create Sales Return Drawer */}
      <Drawer
        title="Tạo Phiếu Nhận Hàng Trả Lại (Sales Return)"
        width={720}
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setCreateDrawerOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleSubmitReturn}>
              Xác Nhận & Xử Lý Kho
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Mã chuyến xe Tera V6 trả về (nếu có)" name="tripCode">
                <Input placeholder="VD: TRIP-20261021-01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Người nhận hàng tại kho" name="receivedById">
                <Input placeholder="Tên thủ kho tiếp nhận" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Lý do trả hàng"
            name="reason"
            rules={[{ required: true, message: "Vui lòng nhập lý do trả hàng" }]}
          >
            <Select>
              <Option value="Khách từ chối nhận tại điểm giao">Khách từ chối nhận tại điểm giao</Option>
              <Option value="Hàng bị hỏng vỡ / rách bao bì trong lúc vận chuyển">
                Hàng bị hỏng vỡ / rách bao bì trong lúc vận chuyển
              </Option>
              <Option value="Giao sai chủng loại / thiếu số lượng">
                Giao sai chủng loại / thiếu số lượng
              </Option>
              <Option value="Khách hủy đơn do giao quá trễ">Khách hủy đơn do giao quá trễ</Option>
              <Option value="Lý do khác">Lý do khác</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Ghi chú thêm" name="note">
            <Input.TextArea rows={2} placeholder="Chi tiết tình trạng hàng..." />
          </Form.Item>

          <Divider style={{ margin: "16px 0" }} />

          <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
            <Col>
              <Title level={5} style={{ margin: 0 }}>
                Danh sách Mặt Hàng Trả Lại
              </Title>
            </Col>
            <Col>
              <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddItem}>
                Thêm dòng
              </Button>
            </Col>
          </Row>

          {selectedItems.map((item, index) => (
            <Card
              key={item.key || index}
              size="small"
              style={{ marginBottom: 12, backgroundColor: "#fafafa" }}
            >
              <Row gutter={12} align="middle">
                <Col span={10}>
                  <Text style={{ fontSize: 12 }} type="secondary">
                    Sản phẩm:
                  </Text>
                  <Select
                    style={{ width: "100%", marginTop: 4 }}
                    value={item.productId}
                    onChange={(val) => handleItemChange(index, "productId", val)}
                    showSearch
                    optionFilterProp="children"
                  >
                    {products.map((p) => (
                      <Option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={4}>
                  <Text style={{ fontSize: 12 }} type="secondary">
                    Số lượng:
                  </Text>
                  <InputNumber
                    min={1}
                    style={{ width: "100%", marginTop: 4 }}
                    value={item.quantity}
                    onChange={(val) => handleItemChange(index, "quantity", val)}
                  />
                </Col>
                <Col span={5}>
                  <Text style={{ fontSize: 12 }} type="secondary">
                    Đơn giá hoàn:
                  </Text>
                  <InputNumber
                    min={0}
                    style={{ width: "100%", marginTop: 4 }}
                    value={item.unitPrice}
                    formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, "") || 0)}
                    onChange={(val) => handleItemChange(index, "unitPrice", val)}
                  />
                </Col>
                <Col span={4}>
                  <Text style={{ fontSize: 12 }} type="secondary">
                    Tình trạng:
                  </Text>
                  <Select
                    style={{ width: "100%", marginTop: 4 }}
                    value={item.condition}
                    onChange={(val) => handleItemChange(index, "condition", val)}
                  >
                    <Option value="GOOD">Nguyên vẹn</Option>
                    <Option value="DAMAGED">Hỏng vỡ</Option>
                  </Select>
                </Col>
                <Col span={1}>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveItem(index)}
                    style={{ marginTop: 20 }}
                  />
                </Col>
              </Row>
              <Row style={{ marginTop: 8 }}>
                <Col span={24}>
                  <Input
                    size="small"
                    placeholder="Lý do cụ thể cho mặt hàng này (nếu có)..."
                    value={item.reason}
                    onChange={(e) => handleItemChange(index, "reason", e.target.value)}
                  />
                </Col>
              </Row>
            </Card>
          ))}

          {selectedItems.length > 0 && (
            <Card size="small" style={{ marginTop: 16, backgroundColor: "#f6ffed" }}>
              <Row justify="space-between">
                <Text strong>Tổng tiền hàng hoàn lại:</Text>
                <Text strong style={{ color: "#52c41a", fontSize: 16 }}>
                  {selectedItems
                    .reduce((sum, it) => sum + (it.quantity || 0) * (it.unitPrice || 0), 0)
                    .toLocaleString("vi-VN")}
                  đ
                </Text>
              </Row>
              <Text type="secondary" style={{ fontSize: 12 }}>
                * Hàng "Nguyên vẹn" sẽ được tự động nhập lại kho. Hàng "Hỏng vỡ" sẽ tự động sinh phiếu
                xuất hủy chi phí.
              </Text>
            </Card>
          )}
        </Form>
      </Drawer>

      {/* Detail Drawer */}
      <Drawer
        title="Chi Tiết Phiếu Nhận Hàng Trả Lại"
        width={680}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
      >
        {selectedReturn && (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Mã phiếu">
                <Tag color="volcano">{selectedReturn.returnCode}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tiếp nhận">
                {new Date(selectedReturn.returnDate).toLocaleDateString("vi-VN")}
              </Descriptions.Item>
              <Descriptions.Item label="Đơn hàng gốc">
                {selectedReturn.salesOrder ? (
                  <Tag color="blue">{selectedReturn.salesOrder.orderCode}</Tag>
                ) : (
                  "Khách lẻ / Độc lập"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Chuyến xe Tera V6">
                {selectedReturn.tripCode ? (
                  <Tag color="purple">{selectedReturn.tripCode}</Tag>
                ) : (
                  "---"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng" span={2}>
                <Text strong>
                  {selectedReturn.customer?.name ||
                    selectedReturn.salesOrder?.customerName ||
                    "Khách lẻ"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Lý do trả hàng" span={2}>
                {selectedReturn.reason}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền hoàn">
                <Text strong style={{ color: "#fa8c16" }}>
                  {selectedReturn.totalReturnAmount?.toLocaleString("vi-VN")}đ
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Giảm trừ AR">
                <Text strong style={{ color: "#52c41a" }}>
                  -{selectedReturn.arDeductionAmount?.toLocaleString("vi-VN")}đ
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
              Chi tiết mặt hàng
            </Title>
            <Table
              size="small"
              dataSource={selectedReturn.items || []}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: "Mặt hàng",
                  key: "product",
                  render: (_: any, it: any) => (
                    <div>
                      <Text strong>{it.product?.name}</Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          SKU: {it.product?.sku}
                        </Text>
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Số lượng",
                  dataIndex: "quantity",
                  key: "quantity",
                  render: (q: number) => <Text strong>{q}</Text>,
                },
                {
                  title: "Đơn giá",
                  dataIndex: "unitPrice",
                  key: "unitPrice",
                  render: (p: number) => `${p.toLocaleString("vi-VN")}đ`,
                },
                {
                  title: "Thành tiền",
                  dataIndex: "lineAmount",
                  key: "lineAmount",
                  render: (a: number) => `${a.toLocaleString("vi-VN")}đ`,
                },
                {
                  title: "Tình trạng",
                  dataIndex: "condition",
                  key: "condition",
                  render: (c: string) => (
                    <Tag color={c === "GOOD" ? "success" : "error"}>
                      {c === "GOOD" ? "Hàng tốt" : "Hỏng vỡ"}
                    </Tag>
                  ),
                },
                {
                  title: "Xử lý",
                  dataIndex: "actionTaken",
                  key: "actionTaken",
                  render: (a: string) => (
                    <Tag color={a === "RESTOCKED" ? "blue" : "volcano"}>
                      {a === "RESTOCKED" ? "Nhập lại kho" : "Xuất hủy"}
                    </Tag>
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
