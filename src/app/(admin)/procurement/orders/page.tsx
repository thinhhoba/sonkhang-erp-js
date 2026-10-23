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
  DatePicker,
  Popconfirm,
  Badge,
  Descriptions,
  Alert,
  Divider,
} from "antd";
import {
  ShoppingCartOutlined,
  PlusOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  DollarOutlined,
  ShopOutlined,
  FileDoneOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface Product {
  id: string;
  sku: string;
  name: string;
  baseUnit: string;
  avgCostPrice: number;
}

interface Supplier {
  id: string;
  code: string;
  name: string;
  taxCode: string;
  paymentTerms: string;
}

interface POItem {
  id: string;
  productId: string;
  product: Product;
  orderedQty: number;
  receivedQty: number;
  unitPrice: number;
  lineAmount: number;
}

interface PurchaseOrder {
  id: string;
  poCode: string;
  supplierId: string;
  supplier: Supplier;
  expectedDeliveryDate: string | null;
  paymentTerms: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "PARTIAL" | "COMPLETED" | "CANCELLED";
  totalAmount: number;
  vatAmount: number;
  grandTotal: number;
  note: string | null;
  createdAt: string;
  items: POItem[];
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    invoiceSymbol: string;
    grandTotal: number;
    status: string;
  }>;
}

interface ThreeWayMatchingResult {
  poId: string;
  poCode: string;
  supplierName: string;
  supplierTaxCode: string;
  invoiceId?: string;
  invoiceNumber?: string;
  matchStatus: "PASSED" | "WARNING" | "FAILED";
  summary: {
    poOrderedQty: number;
    actualReceivedQty: number;
    invoiceBilledQty: number;
    poTotalAmount: number;
    invoiceGrandTotal: number;
    qtyDifference: number;
    amountDifference: number;
  };
  lineDetails: Array<{
    productId: string;
    productSku: string;
    productName: string;
    orderedQty: number;
    receivedQty: number;
    billedQty: number;
    poUnitPrice: number;
    invoiceUnitPrice: number;
    status: "EXACT_MATCH" | "QTY_MISMATCH" | "PRICE_VARIANCE" | "NOT_BILLED";
  }>;
  discrepancies: string[];
}

export default function PurchaseOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Drawer tạo PO
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [submittingPO, setSubmittingPO] = useState(false);
  const [form] = Form.useForm();

  // Drawer đối chiếu 3 bên (3-Way Matching)
  const [matchingDrawerOpen, setMatchingDrawerOpen] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [matchResult, setMatchResult] = useState<ThreeWayMatchingResult | null>(null);
  const [canWrite, setCanWrite] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);

      const res = await fetch(`/api/procurement/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err: any) {
      message.error("Lỗi tải danh sách PO: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        fetch("/api/procurement/suppliers"),
        fetch("/api/inventory/products"),
      ]);
      const supData = await supRes.json();
      const prodData = await prodRes.json();

      if (supData.success) setSuppliers(supData.data || []);
      if (prodData.success) setProducts(prodData.data || []);
    } catch (err: any) {
      console.error("Lỗi nạp danh mục:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    fetchDependencies();
    fetch("/api/auth/session").then((response) => response.json()).then((session) => setCanWrite(["ADMIN", "ACCOUNTANT"].includes(session?.user?.role))).catch(() => setCanWrite(false));
  }, []);

  // Mở Drawer tạo PO
  const handleOpenCreatePO = () => {
    form.resetFields();
    form.setFieldsValue({
      items: [{ productId: undefined, orderedQty: 10, unitPrice: 0 }],
      vatRate: 8,
    });
    setCreateDrawerOpen(true);
  };

  // Submit tạo PO
  const handleSubmitPO = async (values: any) => {
    setSubmittingPO(true);
    try {
      const res = await fetch("/api/procurement/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (result.success) {
        message.success(`Đã tạo Đơn đặt hàng mua ${result.data.poCode} thành công!`);
        setCreateDrawerOpen(false);
        fetchOrders();
      } else {
        message.error("Lỗi: " + result.error);
      }
    } catch (err: any) {
      message.error("Lỗi hệ thống: " + err.message);
    } finally {
      setSubmittingPO(false);
    }
  };

  // Phê duyệt PO
  const handleApprovePO = async (poId: string) => {
    try {
      const res = await fetch(`/api/procurement/orders/${poId}/approve`, {
        method: "POST",
      });
      const result = await res.json();
      if (result.success) {
        message.success("Đã phê duyệt Đơn đặt hàng (PO)! Sẵn sàng tiếp nhận hàng.");
        fetchOrders();
      } else {
        message.error("Lỗi phê duyệt: " + result.error);
      }
    } catch (err: any) {
      message.error("Lỗi hệ thống: " + err.message);
    }
  };

  const handleSubmitForApproval = async (poId: string) => {
    try {
      const res = await fetch(`/api/procurement/orders/${poId}/submit`, { method: "POST" });
      const result = await res.json();
      if (result.success) { message.success("Đã trình duyệt PO."); fetchOrders(); }
      else message.error("Lỗi trình duyệt: " + result.error);
    } catch (err: any) { message.error("Lỗi hệ thống: " + err.message); }
  };

  // Mở Drawer Đối chiếu 3 bên
  const handleOpen3WayMatching = async (poId: string) => {
    setMatchingDrawerOpen(true);
    setLoadingMatch(true);
    setMatchResult(null);
    try {
      const res = await fetch(`/api/procurement/orders/${poId}/match`);
      const data = await res.json();
      if (data.success) {
        setMatchResult(data.data);
      } else {
        message.error("Lỗi đối chiếu 3 bên: " + data.error);
      }
    } catch (err: any) {
      message.error("Lỗi hệ thống: " + err.message);
    } finally {
      setLoadingMatch(false);
    }
  };

  // Thống kê nhanh
  const totalPOs = orders.length;
  const draftCount = orders.filter((o) => o.status === "DRAFT").length;
  const approvedCount = orders.filter((o) => o.status === "APPROVED").length;
  const totalPOValue = orders.reduce((sum, o) => sum + o.grandTotal, 0);

  const getStatusTag = (st: string) => {
    switch (st) {
      case "DRAFT":
        return <Tag color="warning" icon={<ClockCircleOutlined />}>Bản nháp</Tag>;
      case "SUBMITTED":
        return <Tag color="cyan" icon={<ClockCircleOutlined />}>Chờ phê duyệt</Tag>;
      case "APPROVED":
        return <Tag color="processing" icon={<SafetyCertificateOutlined />}>Đã phê duyệt (Chờ giao)</Tag>;
      case "PARTIAL":
        return <Tag color="purple">Nhập 1 phần</Tag>;
      case "COMPLETED":
        return <Tag color="success" icon={<CheckCircleOutlined />}>Đã hoàn tất</Tag>;
      case "CANCELLED":
        return <Tag color="error" icon={<CloseCircleOutlined />}>Đã hủy</Tag>;
      default:
        return <Tag>{st}</Tag>;
    }
  };

  const columns = [
    {
      title: "Mã Đơn PO",
      key: "poCode",
      width: 150,
      render: (_: any, r: PurchaseOrder) => (
        <div>
          <a href={`/purchasing/purchase-orders/${r.id}`}><Text strong style={{ color: "#0958d9" }}>{r.poCode}</Text></a>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(r.createdAt).format("DD/MM/YYYY HH:mm")}
          </Text>
        </div>
      ),
    },
    {
      title: "Nhà cung cấp",
      key: "supplier",
      render: (_: any, r: PurchaseOrder) => (
        <div>
          <Text strong>{r.supplier?.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            MST: {r.supplier?.taxCode} &bull; Điều khoản: {r.paymentTerms}
          </Text>
        </div>
      ),
    },
    {
      title: "Dự kiến giao hàng",
      dataIndex: "expectedDeliveryDate",
      key: "expectedDeliveryDate",
      width: 140,
      render: (d: string | null) => (d ? dayjs(d).format("DD/MM/YYYY") : "Chưa xác định"),
    },
    {
      title: "Mặt hàng đặt",
      key: "items",
      width: 220,
      render: (_: any, r: PurchaseOrder) => {
        const first = r.items[0];
        const count = r.items.length - 1;
        return (
          <div style={{ fontSize: 12 }}>
            {first ? (
              <div>
                <Text strong>{first.product?.name}</Text> ({first.orderedQty} {first.product?.baseUnit})
                {count > 0 && <Text type="secondary" style={{ marginLeft: 4 }}>+{count} món khác</Text>}
              </div>
            ) : (
              <Text type="secondary">Chưa có dòng hàng</Text>
            )}
          </div>
        );
      },
    },
    {
      title: "Tổng thanh toán (gồm VAT)",
      dataIndex: "grandTotal",
      key: "grandTotal",
      width: 170,
      align: "right" as const,
      sorter: (a: PurchaseOrder, b: PurchaseOrder) => a.grandTotal - b.grandTotal,
      render: (v: number) => (
        <Text strong style={{ color: "#cf1322", fontSize: 13 }}>
          {v.toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 170,
      render: (st: string) => getStatusTag(st),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      align: "center" as const,
      render: (_: any, r: PurchaseOrder) => (
        <Space size={4}>
          {canWrite && r.status === "DRAFT" && (
            <Popconfirm
              title="Trình duyệt đơn đặt hàng này?"
              description="PO sẽ được khóa sửa và chuyển sang trạng thái chờ duyệt."
              onConfirm={() => handleSubmitForApproval(r.id)}
              okText="Trình duyệt"
              cancelText="Hủy"
            >
              <Button type="primary" size="small">
                Trình duyệt
              </Button>
            </Popconfirm>
          )}
          {canWrite && r.status === "SUBMITTED" && (
            <Popconfirm title="Phê duyệt PO đã trình?" onConfirm={() => handleApprovePO(r.id)} okText="Duyệt" cancelText="Hủy">
              <Button type="primary" size="small" style={{ background: "#52c41a", borderColor: "#52c41a" }}>Duyệt PO</Button>
            </Popconfirm>
          )}

          {canWrite && <Button
            size="small"
            icon={<AuditOutlined />}
            href={`/purchasing/three-way-match/${r.id}`}
          >
            Đối chiếu 3 bên
          </Button>}
        </Space>
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
            <ShoppingCartOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            Đơn Đặt Hàng Mua (Purchase Orders) & Đối Chiếu 3 Bên
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Tạo & Duyệt đơn mua trước khi nhận hóa đơn &bull; Kiểm soát 3-Way Matching (PO &harr; Thực nhập &harr; meInvoice)
          </Text>
        </div>

        <Space>
          {canWrite && <Button
            type="primary"
            icon={<PlusOutlined />}
            href="/purchasing/purchase-orders/new"
            style={{ background: "#1890ff" }}
          >
            Tạo Đơn Đặt Hàng Mới (PO)
          </Button>}
          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchOrders}>
            Làm mới
          </Button>
        </Space>
      </div>

      {/* 2. THẺ THỐNG KÊ */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng đơn PO"
              value={totalPOs}
              prefix={<ShoppingCartOutlined style={{ color: "#1890ff" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Chờ phê duyệt (DRAFT)"
              value={draftCount}
              valueStyle={{ color: "#fa8c16" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Đã duyệt (Chờ giao)"
              value={approvedCount}
              valueStyle={{ color: "#52c41a" }}
              prefix={<SafetyCertificateOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng giá trị đơn đặt"
              value={totalPOValue.toLocaleString("vi-VN")}
              suffix="đ"
              valueStyle={{ color: "#cf1322" }}
              prefix={<DollarOutlined />}
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
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 170 }}
              options={[
                { value: "ALL", label: "Tất cả trạng thái" },
                { value: "DRAFT", label: "Chờ phê duyệt" },
                { value: "APPROVED", label: "Đã duyệt (Chờ giao)" },
                { value: "PARTIAL", label: "Nhập 1 phần" },
                { value: "COMPLETED", label: "Đã hoàn tất" },
                { value: "CANCELLED", label: "Đã hủy" },
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
          dataSource={orders}
          columns={columns}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      {/* 4. DRAWER TẠO ĐƠN ĐẶT HÀNG MỚI (PO) */}
      <Drawer
        title="Khởi Tạo Đơn Đặt Hàng Mua (Purchase Order)"
        width={780}
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setCreateDrawerOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              loading={submittingPO}
              onClick={() => form.submit()}
            >
              Lưu Đơn PO
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitPO}>
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item
                name="supplierId"
                label="Nhà cung cấp"
                rules={[{ required: true, message: "Vui lòng chọn NCC!" }]}
              >
                <Select
                  placeholder="Chọn Nhà cung cấp..."
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={suppliers.map((s) => ({
                    value: s.id,
                    label: `[${s.code}] ${s.name} (MST: ${s.taxCode})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="expectedDeliveryDate" label="Ngày dự kiến giao hàng">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="paymentTerms" label="Điều khoản thanh toán" initialValue="NET30">
                <Select
                  options={[
                    { value: "NET30", label: "Công nợ 30 ngày (NET30)" },
                    { value: "NET15", label: "Công nợ 15 ngày (NET15)" },
                    { value: "IMMEDIATE", label: "Thanh toán ngay khi nhận hàng" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="vatRate" label="Thuế suất GTGT (%)" initialValue={8}>
                <InputNumber min={0} max={20} style={{ width: "100%" }} addonAfter="%" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Ghi chú yêu cầu đóng gói / giao hàng">
            <Input placeholder="VD: Giao trước 9h sáng tại cửa kho Lạnh số 1, kiểm đếm nhiệt độ âm 18 độ..." />
          </Form.Item>

          <Divider style={{ margin: "12px 0" }}>Chi tiết các mặt hàng đặt mua</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 8, background: "#fafafa" }}
                  >
                    <Row gutter={8} align="middle">
                      <Col span={10}>
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
                              label: `[${p.sku}] ${p.name} (${p.baseUnit})`,
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, "orderedQty"]}
                          label="Số lượng"
                          rules={[{ required: true }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={1} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, "unitPrice"]}
                          label="Đơn giá (chưa VAT)"
                          rules={[{ required: true }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: "100%" }}
                            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            addonAfter="đ"
                          />
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
                  onClick={() => add({ orderedQty: 10, unitPrice: 0 })}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginTop: 8 }}
                >
                  Thêm dòng hàng
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Drawer>

      {/* 5. DRAWER ĐỐI CHIẾU 3 BÊN (3-WAY MATCHING) */}
      <Drawer
        title={
          <Space>
            <AuditOutlined style={{ color: "#1890ff" }} />
            <Text strong>Báo Cáo Đối Chiếu 3 Bên (3-Way Matching: PO &harr; Nhập kho &harr; meInvoice)</Text>
          </Space>
        }
        width={850}
        open={matchingDrawerOpen}
        onClose={() => setMatchingDrawerOpen(false)}
        extra={
          <Button onClick={() => setMatchingDrawerOpen(false)}>Đóng</Button>
        }
      >
        {loadingMatch ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>Đang phân tích đối chiếu 3 bên...</div>
        ) : matchResult ? (
          <div>
            {/* Trạng thái đối chiếu */}
            {matchResult.matchStatus === "PASSED" ? (
              <Alert
                type="success"
                showIcon
                message="KẾT QUẢ ĐỐI CHIẾU: KHỚP 100% (PASSED)"
                description="Đơn đặt hàng PO, số lượng nhập kho thực tế và Hóa đơn điện tử meInvoice hoàn toàn trùng khớp về cả Số lượng và Đơn giá. Sẵn sàng thanh toán!"
                style={{ marginBottom: 16 }}
              />
            ) : matchResult.matchStatus === "WARNING" ? (
              <Alert
                type="warning"
                showIcon
                message="CẢNH BÁO CHÊNH LỆCH (WARNING)"
                description="Có sự chênh lệch nhỏ về số lượng hoặc tổng giá trị tiền hàng. Vui lòng kiểm tra các cảnh báo bên dưới trước khi thanh toán."
                style={{ marginBottom: 16 }}
              />
            ) : (
              <Alert
                type="error"
                showIcon
                message="ĐỐI CHIẾU THẤT BẠI (PRICE VARIANCE FAILED)"
                description="Đơn giá trên Hóa đơn NCC chênh lệch so với Đơn đặt hàng PO ban đầu. Yêu cầu làm rõ với Nhà cung cấp trước khi hạch toán chi phí!"
                style={{ marginBottom: 16 }}
              />
            )}

            <Descriptions size="small" bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Mã PO">{matchResult.poCode}</Descriptions.Item>
              <Descriptions.Item label="Hóa đơn meInvoice">
                {matchResult.invoiceNumber ? (
                  <Tag color="blue">HĐ: {matchResult.invoiceNumber}</Tag>
                ) : (
                  <Tag color="orange">Chưa liên kết HĐ</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Nhà cung cấp">{matchResult.supplierName}</Descriptions.Item>
              <Descriptions.Item label="Mã số thuế">{matchResult.supplierTaxCode}</Descriptions.Item>
              <Descriptions.Item label="Tổng tiền đặt PO">
                <Text strong>{matchResult.summary.poTotalAmount.toLocaleString("vi-VN")} đ</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền Hóa đơn">
                <Text strong style={{ color: "#cf1322" }}>
                  {matchResult.summary.invoiceGrandTotal.toLocaleString("vi-VN")} đ
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {matchResult.discrepancies.length > 0 && (
              <div style={{ marginBottom: 16, background: "#fff2e8", padding: 12, borderRadius: 6, border: "1px solid #ffbb96" }}>
                <Text strong style={{ color: "#d4380d" }}>Các điểm sai lệch phát hiện:</Text>
                <ul style={{ margin: "6px 0 0 0", paddingLeft: 20 }}>
                  {matchResult.discrepancies.map((d, idx) => (
                    <li key={idx} style={{ color: "#d4380d", fontSize: 13 }}>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Title level={5} style={{ margin: "12px 0 8px 0" }}>
              Bảng So Sánh Chi Tiết Từng Dòng Hàng
            </Title>

            <Table
              size="small"
              bordered
              pagination={false}
              dataSource={matchResult.lineDetails}
              rowKey="productId"
              columns={[
                {
                  title: "Mặt hàng",
                  key: "name",
                  render: (_: any, r: any) => (
                    <div>
                      <Tag color="blue">{r.productSku}</Tag>
                      <Text strong>{r.productName}</Text>
                    </div>
                  ),
                },
                {
                  title: "1. Đặt PO (SL)",
                  dataIndex: "orderedQty",
                  key: "orderedQty",
                  align: "center" as const,
                  width: 90,
                },
                {
                  title: "2. Thực nhập (SL)",
                  dataIndex: "receivedQty",
                  key: "receivedQty",
                  align: "center" as const,
                  width: 90,
                },
                {
                  title: "3. Hóa đơn (SL)",
                  dataIndex: "billedQty",
                  key: "billedQty",
                  align: "center" as const,
                  width: 90,
                  render: (v: number, r: any) => (
                    <Text strong style={{ color: r.orderedQty !== v ? "#cf1322" : "#3f8600" }}>
                      {v}
                    </Text>
                  ),
                },
                {
                  title: "Đơn giá PO",
                  dataIndex: "poUnitPrice",
                  key: "poUnitPrice",
                  align: "right" as const,
                  render: (v: number) => `${v.toLocaleString("vi-VN")} đ`,
                },
                {
                  title: "Đơn giá HĐ",
                  dataIndex: "invoiceUnitPrice",
                  key: "invoiceUnitPrice",
                  align: "right" as const,
                  render: (v: number, r: any) => (
                    <Text strong style={{ color: Math.abs(r.poUnitPrice - v) > 100 ? "#cf1322" : "#3f8600" }}>
                      {v.toLocaleString("vi-VN")} đ
                    </Text>
                  ),
                },
                {
                  title: "Kết quả",
                  dataIndex: "status",
                  key: "status",
                  align: "center" as const,
                  render: (st: string) => {
                    if (st === "EXACT_MATCH") return <Tag color="green">Khớp 100%</Tag>;
                    if (st === "PRICE_VARIANCE") return <Tag color="red">Lệch giá</Tag>;
                    if (st === "QTY_MISMATCH") return <Tag color="orange">Lệch số lượng</Tag>;
                    return <Tag color="default">Chưa có HĐ</Tag>;
                  },
                },
              ]}
            />
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
