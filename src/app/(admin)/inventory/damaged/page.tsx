"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Select,
  Typography,
  message,
  Row,
  Col,
  Statistic,
  Drawer,
  Form,
  InputNumber,
  Input,
  Popconfirm,
  Badge,
  Descriptions,
  Divider,
} from "antd";
import {
  WarningOutlined,
  PlusOutlined,
  SyncOutlined,
  DollarOutlined,
  CarOutlined,
  InboxOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface Product {
  id: string;
  sku: string;
  name: string;
  baseUnit: string;
  currentStock: number;
  avgCostPrice: number;
}

interface WarehouseIssueItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitCost: number;
  lineAmount: number;
  reason: string | null;
}

interface WarehouseIssue {
  id: string;
  issueCode: string;
  type: "DAMAGED" | "INTERNAL_USE" | "DONATION" | "OTHER";
  source: "WAREHOUSE" | "TRIP_RETURN";
  referenceCode: string | null;
  totalAmount: number;
  status: string;
  note: string | null;
  createdAt: string;
  items: WarehouseIssueItem[];
}

export default function DamagedGoodsPage() {
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<WarehouseIssue[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Drawer tạo phiếu xuất hủy
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Drawer chi tiết phiếu
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<WarehouseIssue | null>(null);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== "ALL") params.append("type", typeFilter);

      const res = await fetch(`/api/inventory/damaged?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setIssues(data.data || []);
      }
    } catch (err: any) {
      message.error("Lỗi tải danh sách xuất hủy: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/inventory/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (err: any) {
      console.error("Lỗi nạp danh mục sản phẩm:", err);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [typeFilter]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      type: "DAMAGED",
      source: "WAREHOUSE",
      items: [{ productId: undefined, quantity: 1, reason: "Hỏng vỡ trong kho" }],
    });
    setCreateDrawerOpen(true);
  };

  const handleSubmitIssue = async (values: any) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory/damaged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (result.success) {
        message.success(
          `Đã tạo phiếu xuất hủy ${result.data.issueCode}! Tồn kho đã được trừ và ghi Thẻ kho.`
        );
        setCreateDrawerOpen(false);
        fetchIssues();
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
  const totalDamagedAmount = issues
    .filter((i) => i.type === "DAMAGED")
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const warehouseSourceCount = issues.filter((i) => i.source === "WAREHOUSE").length;
  const tripSourceCount = issues.filter((i) => i.source === "TRIP_RETURN").length;

  const getTypeTag = (type: string) => {
    switch (type) {
      case "DAMAGED":
        return <Tag color="error">Hỏng / Vỡ / Quá hạn</Tag>;
      case "INTERNAL_USE":
        return <Tag color="blue">Dùng nội bộ</Tag>;
      case "DONATION":
        return <Tag color="purple">Biếu tặng</Tag>;
      default:
        return <Tag>{type}</Tag>;
    }
  };

  const getSourceTag = (source: string, refCode: string | null) => {
    if (source === "TRIP_RETURN") {
      return (
        <Tag color="orange" icon={<CarOutlined />}>
          Xe Tera V6 trả về {refCode ? `(${refCode})` : ""}
        </Tag>
      );
    }
    return (
      <Tag color="cyan" icon={<InboxOutlined />}>
        Tại kho hàng
      </Tag>
    );
  };

  const columns = [
    {
      title: "Mã Phiếu Xuất",
      key: "issueCode",
      width: 140,
      render: (_: any, r: WarehouseIssue) => (
        <div>
          <Text
            strong
            style={{ color: "#0958d9", cursor: "pointer" }}
            onClick={() => {
              setSelectedIssue(r);
              setDetailDrawerOpen(true);
            }}
          >
            {r.issueCode}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(r.createdAt).format("DD/MM/YYYY HH:mm")}
          </Text>
        </div>
      ),
    },
    {
      title: "Phân loại & Nguồn gốc",
      key: "type_source",
      render: (_: any, r: WarehouseIssue) => (
        <Space size={4} wrap>
          {getTypeTag(r.type)}
          {getSourceTag(r.source, r.referenceCode)}
        </Space>
      ),
    },
    {
      title: "Mặt hàng xuất hủy",
      key: "items",
      render: (_: any, r: WarehouseIssue) => {
        const first = r.items[0];
        const count = r.items.length - 1;

        return (
          <div style={{ fontSize: 12 }}>
            {first ? (
              <div>
                <Text strong>{first.product?.name}</Text> ({first.quantity} {first.product?.baseUnit})
                {count > 0 && <Text type="secondary" style={{ marginLeft: 4 }}>+{count} món khác</Text>}
                {first.reason && (
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>
                    Lý do: {first.reason}
                  </div>
                )}
              </div>
            ) : (
              <Text type="secondary">Chưa có dòng hàng</Text>
            )}
          </div>
        );
      },
    },
    {
      title: "Tổng giá trị (theo Giá vốn)",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 180,
      align: "right" as const,
      sorter: (a: WarehouseIssue, b: WarehouseIssue) => a.totalAmount - b.totalAmount,
      render: (v: number) => (
        <Text strong style={{ color: "#cf1322" }}>
          {Math.round(v).toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: "center" as const,
      render: (_: any, r: WarehouseIssue) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setSelectedIssue(r);
            setDetailDrawerOpen(true);
          }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* 1. HEADER */}
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
            <WarningOutlined style={{ marginRight: 8, color: "#ff4d4f" }} />
            Quản Lý Xuất Hủy Hàng Hỏng / Vỡ & Giảm Tồn Kho
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Xử lý hàng vỡ rách bao bì tại kho hoặc xe Tera V6 trả về &bull; Hạch toán chi phí giá vốn & Ghi Thẻ kho
          </Text>
        </div>

        <Space>
          <Button
            type="primary"
            danger
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
          >
            Tạo Phiếu Xuất Hủy Hàng Hỏng
          </Button>
          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchIssues}>
            Làm mới
          </Button>
        </Space>
      </div>

      {/* 2. THẺ THỐNG KÊ */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng thiệt hại hàng hỏng/vỡ (Giá vốn)"
              value={Math.round(totalDamagedAmount).toLocaleString("vi-VN")}
              suffix="đ"
              valueStyle={{ color: "#cf1322", fontWeight: "bold" }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Hỏng vỡ phát sinh tại kho"
              value={warehouseSourceCount}
              suffix="phiếu"
              valueStyle={{ color: "#0958d9" }}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Hàng lỗi/vỡ từ xe Tera V6 trả về"
              value={tripSourceCount}
              suffix="phiếu"
              valueStyle={{ color: "#fa8c16" }}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 3. BẢNG DỮ LIỆU */}
      <Card
        size="small"
        bordered
        title={
          <Space size={12} wrap style={{ padding: "4px 0" }}>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 180 }}
              options={[
                { value: "ALL", label: "Tất cả lý do xuất" },
                { value: "DAMAGED", label: "Hàng hỏng / vỡ / hết hạn" },
                { value: "INTERNAL_USE", label: "Xuất dùng nội bộ" },
                { value: "DONATION", label: "Xuất biếu tặng" },
              ]}
            />
          </Space>
        }
      >
        <Table
          rowKey="id"
          size="small"
          bordered
          sticky
          loading={loading}
          dataSource={issues}
          columns={columns}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      {/* 4. DRAWER TẠO PHIẾU XUẤT HỦY */}
      <Drawer
        title="Tạo Phiếu Xuất Hủy Hàng Hỏng / Vỡ / Giảm Tồn"
        width={720}
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setCreateDrawerOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              danger
              loading={submitting}
              onClick={() => form.submit()}
            >
              Xác nhận xuất hủy
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitIssue}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="type" label="Mục đích xuất kho" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: "DAMAGED", label: "Hàng hỏng / vỡ / rách bao bì" },
                    { value: "INTERNAL_USE", label: "Xuất tiêu dùng nội bộ" },
                    { value: "DONATION", label: "Xuất biếu tặng khách hàng" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="source" label="Nguồn gốc phát sinh" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: "WAREHOUSE", label: "Phát sinh tại kho" },
                    { value: "TRIP_RETURN", label: "Từ chuyến xe Tera V6 trả về" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="referenceCode" label="Mã tham chiếu (Mã chuyến xe / Biên bản nếu có)">
            <Input placeholder="VD: TRIP-202610-001 hoặc BB-HUY-01" />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú diễn giải">
            <Input.TextArea rows={2} placeholder="Diễn giải nguyên nhân hỏng vỡ..." />
          </Form.Item>

          <Divider style={{ margin: "12px 0" }}>Danh sách các mặt hàng xuất hủy</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 8, background: "#fff1f0", borderColor: "#ffa39e" }}
                  >
                    <Row gutter={8} align="middle">
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, "productId"]}
                          label="Mặt hàng"
                          rules={[{ required: true, message: "Chọn sản phẩm!" }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            placeholder="Chọn sản phẩm..."
                            showSearch
                            filterOption={(input, option) =>
                              String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                            }
                            options={products.map((p) => ({
                              value: p.id,
                              label: `[${p.sku}] ${p.name} (Tồn: ${p.currentStock} ${p.baseUnit} - Giá vốn: ${Math.round(p.avgCostPrice).toLocaleString("vi-VN")}đ)`,
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, "quantity"]}
                          label="Số lượng hủy"
                          rules={[{ required: true }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0.1} step={1} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, "reason"]}
                          label="Lý do chi tiết"
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="Hỏng vỡ..." />
                        </Form.Item>
                      </Col>
                      <Col span={2} style={{ textAlign: "center", paddingTop: 20 }}>
                        {fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          />
                        )}
                      </Col>
                    </Row>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add({ quantity: 1, reason: "Hỏng vỡ" })}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginTop: 8 }}
                >
                  Thêm mặt hàng xuất hủy
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Drawer>

      {/* 5. DRAWER XEM CHI TIẾT PHIẾU XUẤT HỦY */}
      <Drawer
        title={`Chi tiết phiếu xuất hủy: ${selectedIssue?.issueCode}`}
        width={720}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        extra={<Button onClick={() => setDetailDrawerOpen(false)}>Đóng</Button>}
      >
        {selectedIssue && (
          <div>
            <Descriptions size="small" bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Mã phiếu">{selectedIssue.issueCode}</Descriptions.Item>
              <Descriptions.Item label="Ngày xuất">
                {dayjs(selectedIssue.createdAt).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Mục đích">{getTypeTag(selectedIssue.type)}</Descriptions.Item>
              <Descriptions.Item label="Nguồn phát sinh">
                {getSourceTag(selectedIssue.source, selectedIssue.referenceCode)}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng giá trị thiệt hại" span={2}>
                <Text strong style={{ color: "#cf1322", fontSize: 14 }}>
                  {Math.round(selectedIssue.totalAmount).toLocaleString("vi-VN")} đ (Theo Giá vốn WAC)
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú diễn giải" span={2}>
                {selectedIssue.note || "Không có ghi chú"}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ margin: "12px 0 8px 0" }}>
              Chi Tiết Danh Sách Hàng Hóa Xuất Hủy
            </Title>

            <Table
              size="small"
              bordered
              pagination={false}
              dataSource={selectedIssue.items}
              rowKey="id"
              columns={[
                {
                  title: "Mặt hàng",
                  key: "product",
                  render: (_: any, it: WarehouseIssueItem) => (
                    <div>
                      <Tag color="blue">{it.product?.sku}</Tag>
                      <Text strong>{it.product?.name}</Text>
                    </div>
                  ),
                },
                {
                  title: "Số lượng hủy",
                  key: "qty",
                  width: 120,
                  align: "center" as const,
                  render: (_: any, it: WarehouseIssueItem) => (
                    <Text strong style={{ color: "#cf1322" }}>
                      -{it.quantity} {it.product?.baseUnit}
                    </Text>
                  ),
                },
                {
                  title: "Giá vốn tại thời điểm",
                  dataIndex: "unitCost",
                  key: "unitCost",
                  width: 140,
                  align: "right" as const,
                  render: (v: number) => `${Math.round(v).toLocaleString("vi-VN")} đ`,
                },
                {
                  title: "Thành tiền",
                  dataIndex: "lineAmount",
                  key: "lineAmount",
                  width: 140,
                  align: "right" as const,
                  render: (v: number) => (
                    <Text strong>{Math.round(v).toLocaleString("vi-VN")} đ</Text>
                  ),
                },
                {
                  title: "Lý do",
                  dataIndex: "reason",
                  key: "reason",
                },
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
