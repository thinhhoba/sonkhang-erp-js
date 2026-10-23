"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Drawer,
  Typography,
  message,
  Badge,
  Tabs,
  Row,
  Col,
  Statistic,
  Tooltip,
} from "antd";
import { useRouter } from "next/navigation";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  InboxOutlined,
  ArrowRightOutlined,
  ThunderboltFilled,
  DatabaseOutlined,
  FileTextOutlined,
  CarOutlined,
  HistoryOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface InternalProduct {
  id: string;
  sku: string;
  name: string;
  baseUnit: string;
  weightKg: number;
  currentStock: number;
  inTransitStock: number;
  avgCostPrice: number;
}

interface PurchaseInvoiceItem {
  id: string;
  rawProductName: string;
  rawUnit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  mappedProductId: string | null;
  convertedQty: number | null;
  effectiveUnitCost: number | null;
  mappedProduct?: InternalProduct | null;
}

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  invoiceSymbol: string;
  invoiceDate: string;
  supplierTaxCode: string;
  supplierName: string;
  subTotalAmount: number;
  discountAmount: number;
  vatAmount: number;
  grandTotal: number;
  status: "PENDING_MAP" | "PENDING_STOCK_IMPORT" | "IMPORTED_STOCK" | "EXPORTED_MISA";
  items: PurchaseInvoiceItem[];
}

interface InventoryLedgerEntry {
  id: string;
  type: string;
  referenceCode: string;
  qtyChange: number;
  unitCostAtTime: number;
  stockAfter: number;
  avgCostAfter: number;
  note: string | null;
  createdAt: string;
  product: {
    sku: string;
    name: string;
    baseUnit: string;
  };
}

export default function InvoicesAndInventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("invoices");
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [products, setProducts] = useState<InternalProduct[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [canSimulate, setCanSimulate] = useState(false);

  // Thẻ kho drawer state
  const [ledgerDrawerVisible, setLedgerDrawerVisible] = useState(false);
  const [selectedProductForLedger, setSelectedProductForLedger] = useState<InternalProduct | null>(null);
  const [ledgers, setLedgers] = useState<InventoryLedgerEntry[]>([]);
  const [loadingLedgers, setLoadingLedgers] = useState(false);

  // 1. Tải danh sách Hóa đơn & Danh mục Sản phẩm
  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, prodRes] = await Promise.all([
        fetch("/api/inventory/invoices"),
        fetch("/api/inventory/products"),
      ]);
      const invData = await invRes.json();
      const prodData = await prodRes.json();

      setInvoices(invData.data || []);
      setProducts(prodData.data || []);
    } catch (err: any) {
      message.error("Lỗi tải dữ liệu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetch("/api/auth/session").then((response) => response.json()).then((session) => setCanSimulate(["ADMIN", "ACCOUNTANT"].includes(session?.user?.role))).catch(() => setCanSimulate(false));
  }, []);

  // 2. Giả lập kéo hóa đơn mới từ MISA meInvoiceBot
  const handleSimulateInvoice = async () => {
    setSimulating(true);
    try {
      const res = await fetch("/api/inventory/invoices/simulate-meinvoice", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Giả lập thất bại");

      message.success(data.message || "Đã kéo thành công Hóa đơn từ meInvoiceBot!");
      await loadData();
    } catch (err: any) {
      message.error("Lỗi giả lập: " + err.message);
    } finally {
      setSimulating(false);
    }
  };

  // 3. Mở Drawer xem lịch sử Thẻ kho của một sản phẩm
  const handleOpenLedger = async (product: InternalProduct) => {
    setSelectedProductForLedger(product);
    setLedgerDrawerVisible(true);
    setLoadingLedgers(true);
    try {
      const res = await fetch(`/api/inventory/ledgers?productId=${product.id}`);
      const data = await res.json();
      setLedgers(data.data || []);
    } catch (err: any) {
      message.error("Lỗi tải thẻ kho: " + err.message);
    } finally {
      setLoadingLedgers(false);
    }
  };

  // Thống kê nhanh hóa đơn
  const pendingMapCount = invoices.filter((i) => i.status === "PENDING_MAP").length;
  const pendingImportCount = invoices.filter((i) => i.status === "PENDING_STOCK_IMPORT").length;
  const importedCount = invoices.filter((i) => i.status === "IMPORTED_STOCK").length;

  // Thống kê tồn kho
  const totalStockQty = products.reduce((sum, p) => sum + p.currentStock, 0);
  const totalInTransitQty = products.reduce((sum, p) => sum + p.inTransitStock, 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + p.currentStock * p.avgCostPrice, 0);

  // Cột bảng hóa đơn
  const invoiceColumns = [
    {
      title: "Số HĐ / Ký hiệu",
      key: "invoiceNumber",
      width: 160,
      render: (_: any, r: PurchaseInvoice) => (
        <div>
          <Text
            strong
            style={{ color: "#0958d9", cursor: "pointer" }}
            onClick={() => router.push(`/purchasing/invoices/${r.id}`)}
          >
            {r.invoiceNumber}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            Ký hiệu: {r.invoiceSymbol}
          </Text>
        </div>
      ),
    },
    {
      title: "Ngày HĐ",
      dataIndex: "invoiceDate",
      key: "invoiceDate",
      width: 110,
      render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
    },
    {
      title: "Nhà cung cấp & MST",
      key: "supplier",
      render: (_: any, r: PurchaseInvoice) => (
        <div>
          <Text strong>{r.supplierName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            MST: {r.supplierTaxCode}
          </Text>
        </div>
      ),
    },
    {
      title: "Tiền hàng trước thuế",
      dataIndex: "subTotalAmount",
      key: "subTotalAmount",
      width: 140,
      align: "right" as const,
      render: (v: number) => `${v.toLocaleString("vi-VN")} đ`,
    },
    {
      title: "Chiết khấu",
      dataIndex: "discountAmount",
      key: "discountAmount",
      width: 110,
      align: "right" as const,
      render: (v: number) => (v > 0 ? `-${v.toLocaleString("vi-VN")} đ` : "0 đ"),
    },
    {
      title: "Tổng thanh toán",
      dataIndex: "grandTotal",
      key: "grandTotal",
      width: 150,
      align: "right" as const,
      render: (v: number) => (
        <Text strong style={{ color: "#cf1322" }}>
          {v.toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (st: string) => {
        if (st === "PENDING_MAP") return <Badge status="warning" text="Chờ gán mã hàng" />;
        if (st === "PENDING_STOCK_IMPORT") return <Badge status="processing" text="Sẵn sàng nhập kho" />;
        if (st === "IMPORTED_STOCK") return <Badge status="success" text="Đã nhập kho & Giá vốn" />;
        return <Badge status="default" text={st} />;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      align: "center" as const,
      render: (_: any, r: PurchaseInvoice) => (
        <Button
          type="primary"
          size="small"
          onClick={() => router.push(`/purchasing/invoices/${r.id}`)}
        >
          {r.status === "PENDING_MAP" ? "Gán mã NCC" : r.status === "PENDING_STOCK_IMPORT" ? "Nhập kho" : "Xem HĐ"}
        </Button>
      ),
    },
  ];

  // Cột bảng Tồn kho & Giá vốn bình quân
  const productColumns = [
    {
      title: "Mã SKU",
      dataIndex: "sku",
      key: "sku",
      width: 130,
      render: (sku: string) => <Text strong>{sku}</Text>,
    },
    {
      title: "Tên sản phẩm hàng hóa",
      dataIndex: "name",
      key: "name",
      render: (name: string, r: InternalProduct) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            Định mức: {r.weightKg} kg / {r.baseUnit}
          </Text>
        </div>
      ),
    },
    {
      title: "ĐVT",
      dataIndex: "baseUnit",
      key: "baseUnit",
      width: 80,
      align: "center" as const,
    },
    {
      title: "Tồn thực tế trong kho",
      dataIndex: "currentStock",
      key: "currentStock",
      width: 150,
      align: "right" as const,
      sorter: (a: InternalProduct, b: InternalProduct) => a.currentStock - b.currentStock,
      render: (v: number, r: InternalProduct) => (
        <div>
          <Text strong style={{ color: v > 0 ? "#135200" : "#cf1322", fontSize: 14 }}>
            {v.toLocaleString("vi-VN")} {r.baseUnit}
          </Text>
        </div>
      ),
    },
    {
      title: "Hàng trên xe Tera V6",
      dataIndex: "inTransitStock",
      key: "inTransitStock",
      width: 150,
      align: "right" as const,
      render: (v: number, r: InternalProduct) => (
        <Text style={{ color: v > 0 ? "#0958d9" : "#8c8c8c" }}>
          {v > 0 ? `+${v.toLocaleString("vi-VN")} ${r.baseUnit}` : "0"}
        </Text>
      ),
    },
    {
      title: "Giá vốn bình quân (WAC)",
      dataIndex: "avgCostPrice",
      key: "avgCostPrice",
      width: 180,
      align: "right" as const,
      sorter: (a: InternalProduct, b: InternalProduct) => a.avgCostPrice - b.avgCostPrice,
      render: (v: number) => (
        <Text strong style={{ color: "#d46b08", fontSize: 14 }}>
          {Math.round(v).toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Tổng giá trị tồn",
      key: "totalVal",
      width: 160,
      align: "right" as const,
      render: (_: any, r: InternalProduct) => {
        const val = r.currentStock * r.avgCostPrice;
        return <Text strong>{Math.round(val).toLocaleString("vi-VN")} đ</Text>;
      },
    },
    {
      title: "Thẻ kho",
      key: "ledger",
      width: 100,
      align: "center" as const,
      render: (_: any, r: InternalProduct) => (
        <Button size="small" icon={<HistoryOutlined />} onClick={() => handleOpenLedger(r)}>
          Xem
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* HEADER & THÔNG TIN MODULE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <InboxOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            Module 1: Hóa đơn Mua vào meInvoice & Kho Giá vốn bình quân
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Tự học ánh xạ mã NCC &bull; Tính Giá vốn bình quân gia quyền &bull; Kiểm soát dòng biến động Thẻ kho
          </Text>
        </div>

        <Space>
          {canSimulate && <Button
            type="primary"
            icon={<ThunderboltFilled />}
            style={{ background: "#722ed1", borderColor: "#722ed1" }}
            loading={simulating}
            onClick={handleSimulateInvoice}
          >
            ⚡ Giả lập kéo HĐ mới từ meInvoiceBot
          </Button>}

          <Button icon={<SyncOutlined spin={loading} />} onClick={loadData}>
            Làm mới
          </Button>
        </Space>
      </div>

      {/* TABS CHÍNH */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: "invoices",
            label: (
              <span>
                <FileTextOutlined /> Hóa đơn mua vào meInvoiceBot ({invoices.length})
              </span>
            ),
            children: (
              <div>
                {/* Thống kê hóa đơn */}
                <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                  <Col xs={12} sm={6}>
                    <Card size="small" bordered style={{ borderRadius: 8 }}>
                      <Statistic
                        title="Tổng hóa đơn"
                        value={invoices.length}
                        prefix={<FileTextOutlined style={{ color: "#1890ff" }} />}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small" bordered style={{ borderRadius: 8 }}>
                      <Statistic
                        title="Chờ gán mã NCC"
                        value={pendingMapCount}
                        valueStyle={{ color: "#faad14" }}
                        prefix={<ClockCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small" bordered style={{ borderRadius: 8 }}>
                      <Statistic
                        title="Sẵn sàng nhập kho"
                        value={pendingImportCount}
                        valueStyle={{ color: "#1890ff" }}
                        prefix={<InboxOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card size="small" bordered style={{ borderRadius: 8 }}>
                      <Statistic
                        title="Đã nhập kho & Giá vốn"
                        value={importedCount}
                        valueStyle={{ color: "#52c41a" }}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card size="small" bordered>
                  <Table
                    rowKey="id"
                    size="small"
                    bordered
                    sticky
                    loading={loading}
                    dataSource={invoices}
                    columns={invoiceColumns}
                    pagination={{ pageSize: 20 }}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: "inventory",
            label: (
              <span>
                <DatabaseOutlined /> Danh mục Tồn kho & Giá vốn bình quân ({products.length})
              </span>
            ),
            children: (
              <div>
                {/* Thống kê tồn kho */}
                <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                  <Col xs={12} sm={8}>
                    <Card size="small" bordered style={{ borderRadius: 8 }}>
                      <Statistic
                        title="Tổng tồn kho thực tế"
                        value={totalStockQty.toLocaleString("vi-VN")}
                        suffix="Đơn vị"
                        valueStyle={{ color: "#135200" }}
                        prefix={<DatabaseOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={8}>
                    <Card size="small" bordered style={{ borderRadius: 8 }}>
                      <Statistic
                        title="Hàng đang trên xe Tera V6"
                        value={totalInTransitQty.toLocaleString("vi-VN")}
                        suffix="Đơn vị"
                        valueStyle={{ color: "#0958d9" }}
                        prefix={<CarOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={8}>
                    <Card size="small" bordered style={{ borderRadius: 8 }}>
                      <Statistic
                        title="Tổng giá trị tồn kho (Giá vốn)"
                        value={Math.round(totalInventoryValue).toLocaleString("vi-VN")}
                        suffix="đ"
                        valueStyle={{ color: "#d46b08" }}
                        prefix={<DollarOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card size="small" bordered>
                  <Table
                    rowKey="id"
                    size="small"
                    bordered
                    sticky
                    loading={loading}
                    dataSource={products}
                    columns={productColumns}
                    pagination={{ pageSize: 20 }}
                  />
                </Card>
              </div>
            ),
          },
        ]}
      />

      {/* DRAWER XEM LỊCH SỬ THẺ KHO */}
      <Drawer
        title={`Lịch sử Thẻ kho: [${selectedProductForLedger?.sku}] ${selectedProductForLedger?.name}`}
        open={ledgerDrawerVisible}
        onClose={() => setLedgerDrawerVisible(false)}
        width={850}
      >
        <Table
          rowKey="id"
          size="small"
          bordered
          loading={loadingLedgers}
          dataSource={ledgers}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "Thời gian",
              dataIndex: "createdAt",
              key: "createdAt",
              width: 140,
              render: (d: string) => dayjs(d).format("DD/MM/YYYY HH:mm"),
            },
            {
              title: "Loại GD",
              dataIndex: "type",
              key: "type",
              width: 130,
              render: (type: string) => {
                if (type === "IN_PURCHASE") return <Tag color="green">Nhập mua HĐ</Tag>;
                if (type === "OUT_DISPATCH") return <Tag color="blue">Xuất xe giao</Tag>;
                if (type === "IN_RETURN_TRIP") return <Tag color="orange">Nhập hoàn xe</Tag>;
                return <Tag>{type}</Tag>;
              },
            },
            {
              title: "Mã chứng từ",
              dataIndex: "referenceCode",
              key: "referenceCode",
              width: 140,
              render: (v: string) => <Text strong>{v}</Text>,
            },
            {
              title: "Biến động SL",
              dataIndex: "qtyChange",
              key: "qtyChange",
              width: 110,
              align: "right" as const,
              render: (v: number) => (
                <Text strong style={{ color: v > 0 ? "#52c41a" : "#cf1322" }}>
                  {v > 0 ? `+${v}` : v}
                </Text>
              ),
            },
            {
              title: "Tồn sau GD",
              dataIndex: "stockAfter",
              key: "stockAfter",
              width: 100,
              align: "right" as const,
              render: (v: number) => `${v}`,
            },
            {
              title: "Giá vốn sau GD",
              dataIndex: "avgCostAfter",
              key: "avgCostAfter",
              width: 130,
              align: "right" as const,
              render: (v: number) => `${Math.round(v).toLocaleString("vi-VN")} đ`,
            },
            {
              title: "Diễn giải",
              dataIndex: "note",
              key: "note",
              ellipsis: true,
            },
          ]}
        />
      </Drawer>
    </div>
  );
}
