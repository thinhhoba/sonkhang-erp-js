"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Breadcrumb,
  Row,
  Col,
  Statistic,
  Spin,
  Alert,
  Divider,
  Select,
  InputNumber,
  message,
  Popconfirm,
  Badge,
} from "antd";
import {
  ArrowLeftOutlined,
  InboxOutlined,
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ShopOutlined,
  SyncOutlined,
  DownloadOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface InternalProduct {
  id: string;
  sku: string;
  name: string;
  baseUnit: string;
  weightKg: number;
  avgCostPrice: number;
  currentStock: number;
}

interface PurchaseInvoiceItem {
  id: string;
  rawProductName: string;
  rawUnit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  discountAmount?: number;
  vatRate?: number;
  vatAmount?: number;
  mappedProductId?: string | null;
  convertedQty?: number | null;
  effectiveUnitCost?: number | null;
  mappedProduct?: InternalProduct | null;
}

interface PurchaseInvoiceDetail {
  id: string;
  misaInvoiceId: string;
  invoiceNumber: string;
  invoiceSymbol: string;
  invoiceDate: string;
  supplierTaxCode: string;
  supplierName: string;
  subTotalAmount: number;
  discountAmount: number;
  vatAmount: number;
  grandTotal: number;
  status: "PENDING_MAP" | "PENDING_STOCK_IMPORT" | "IMPORTED_STOCK";
  xmlUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseInvoiceItem[];
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<PurchaseInvoiceDetail | null>(null);
  const [products, setProducts] = useState<InternalProduct[]>([]);
  const [importingStock, setImportingStock] = useState(false);
  const [savingMappingId, setSavingMappingId] = useState<string | null>(null);

  // Mapping state: { [itemId]: { productId, conversionRate } }
  const [mappingState, setMappingState] = useState<
    Record<string, { productId: string; conversionRate: number }>
  >({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, prodRes] = await Promise.all([
        fetch(`/api/inventory/invoices/${invoiceId}`),
        fetch("/api/inventory/products"),
      ]);

      const invData = await invRes.json();
      const prodData = await prodRes.json();

      if (invData.success && invData.data) {
        setInvoice(invData.data);

        // Khởi tạo mapping state từ dữ liệu hiện có
        const initialMap: Record<string, { productId: string; conversionRate: number }> = {};
        invData.data.items.forEach((item: PurchaseInvoiceItem) => {
          initialMap[item.id] = {
            productId: item.mappedProductId || "",
            conversionRate:
              item.convertedQty && item.quantity ? item.convertedQty / item.quantity : 1,
          };
        });
        setMappingState(initialMap);
      } else {
        message.error("Lỗi khi tải hóa đơn: " + (invData.error || "Không tìm thấy dữ liệu"));
      }

      if (prodData.success) {
        setProducts(prodData.data || []);
      }
    } catch (err: any) {
      message.error("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      fetchData();
    }
  }, [invoiceId]);

  // Lưu ánh xạ 1 dòng hàng
  const handleSaveMapping = async (itemId: string) => {
    const config = mappingState[itemId];
    if (!config || !config.productId) {
      message.warning("Vui lòng chọn sản phẩm nội bộ Sơn Khang");
      return;
    }

    setSavingMappingId(itemId);
    try {
      const res = await fetch("/api/inventory/invoices/map-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceItemId: itemId,
          productId: config.productId,
          conversionRate: config.conversionRate || 1,
        }),
      });

      const result = await res.json();
      if (result.success) {
        message.success("Đã lưu ánh xạ và ghi nhớ quy tắc cho Nhà cung cấp!");
        fetchData(); // Tải lại để cập nhật trạng thái hóa đơn
      } else {
        message.error("Lỗi khi lưu ánh xạ: " + result.error);
      }
    } catch (err: any) {
      message.error("Lỗi hệ thống: " + err.message);
    } finally {
      setSavingMappingId(null);
    }
  };

  // Xác nhận nhập kho & tính Giá vốn bình quân
  const handleImportStock = async () => {
    if (!invoice) return;

    setImportingStock(true);
    try {
      const res = await fetch("/api/inventory/invoices/import-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });

      const result = await res.json();
      if (result.success) {
        message.success(
          "Nhập kho thành công! Đã tự động cập nhật Giá vốn bình quân gia quyền (WAC) và ghi Thẻ kho."
        );
        fetchData();
      } else {
        message.error("Lỗi nhập kho: " + result.error);
      }
    } catch (err: any) {
      message.error("Lỗi hệ thống: " + err.message);
    } finally {
      setImportingStock(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <Spin size="large" tip="Đang tải chi tiết hóa đơn meInvoice..." />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Không tìm thấy hóa đơn"
          description={`Không tìm thấy hóa đơn meInvoice với mã định danh: ${invoiceId}`}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={() => router.push("/inventory/invoices")}>
              Quay lại danh sách Hóa đơn
            </Button>
          }
        />
      </div>
    );
  }

  const isImported = invoice.status === "IMPORTED_STOCK";
  const isReadyToImport = invoice.status === "PENDING_STOCK_IMPORT";
  const isPendingMap = invoice.status === "PENDING_MAP";

  return (
    <div>
      {/* 1. BREADCRUMB & NÚT QUAY LẠI */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Breadcrumb
          items={[
            {
              title: <Link href="/inventory/invoices">Module 1: Mua hàng & Kho</Link>,
            },
            {
              title: <Link href="/inventory/invoices">Hóa đơn meInvoice</Link>,
            },
            {
              title: (
                <Text strong>
                  HĐ {invoice.invoiceSymbol}-{invoice.invoiceNumber}
                </Text>
              ),
            },
          ]}
        />

        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/inventory/invoices")}>
            Quay lại danh sách
          </Button>
          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchData}>
            Làm mới
          </Button>
        </Space>
      </div>

      {/* 2. HEADER THÔNG TIN CHÍNH & NÚT HÀNH ĐỘNG */}
      <Card
        size="small"
        bordered
        style={{
          marginBottom: 16,
          background: isImported ? "#f6ffed" : "#fafafa",
          borderColor: isImported ? "#b7eb8f" : "#d9d9d9",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <Space align="center" size={12}>
              <Title level={4} style={{ margin: 0 }}>
                <FileTextOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                Hóa đơn: {invoice.invoiceSymbol}-{invoice.invoiceNumber}
              </Title>

              {isPendingMap && (
                <Tag color="warning" icon={<ClockCircleOutlined />}>
                  Cần gán mã nội bộ trước khi nhập kho
                </Tag>
              )}
              {isReadyToImport && (
                <Tag color="processing" icon={<SafetyCertificateOutlined />}>
                  Đã khớp 100% mặt hàng &bull; Sẵn sàng nhập kho
                </Tag>
              )}
              {isImported && (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  Đã nhập kho & Cập nhật Giá vốn bình quân
                </Tag>
              )}
            </Space>

            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                <ShopOutlined style={{ marginRight: 4 }} />
                Nhà cung cấp: <Text strong>{invoice.supplierName}</Text> &bull; MST:{" "}
                <Text strong>{invoice.supplierTaxCode}</Text> &bull; Ngày HĐ:{" "}
                {dayjs(invoice.invoiceDate).format("DD/MM/YYYY")}
              </Text>
            </div>
          </div>

          <Space size={12}>
            {invoice.xmlUrl && (
              <Button
                icon={<DownloadOutlined />}
                href={invoice.xmlUrl}
                target="_blank"
              >
                Tải XML gốc
              </Button>
            )}

            {isReadyToImport && (
              <Popconfirm
                title="Xác nhận nhập kho & cập nhật giá vốn?"
                description="Hệ thống sẽ cập nhật số lượng tồn kho và tính toán lại Giá vốn bình quân gia quyền (WAC) theo công thức chuẩn."
                onConfirm={handleImportStock}
                okText="Đồng ý nhập kho"
                cancelText="Hủy"
              >
                <Button
                  type="primary"
                  size="middle"
                  icon={<InboxOutlined />}
                  loading={importingStock}
                  style={{ background: "#52c41a", borderColor: "#52c41a" }}
                >
                  Nhập kho & Cập nhật Giá vốn
                </Button>
              </Popconfirm>
            )}

            {isPendingMap && (
              <Button type="default" disabled icon={<ExclamationCircleOutlined />}>
                Chưa gán đủ mã hàng để nhập kho
              </Button>
            )}

            {isImported && (
              <Tag color="green" style={{ padding: "6px 12px", fontSize: 13 }}>
                <CheckCircleOutlined style={{ marginRight: 6 }} />
                Hoàn tất nhập kho & Ghi nhận Thẻ kho
              </Tag>
            )}
          </Space>
        </div>
      </Card>

      {/* 3. CÁC THẺ THỐNG KÊ TÀI CHÍNH HÓA ĐƠN */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tiền hàng (chưa thuế)"
              value={invoice.subTotalAmount.toLocaleString("vi-VN")}
              suffix="đ"
              prefix={<DollarOutlined style={{ color: "#1890ff" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Chiết khấu thương mại"
              value={invoice.discountAmount.toLocaleString("vi-VN")}
              suffix="đ"
              valueStyle={{ color: invoice.discountAmount > 0 ? "#52c41a" : "#8c8c8c" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tiền thuế GTGT (VAT)"
              value={invoice.vatAmount.toLocaleString("vi-VN")}
              suffix="đ"
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng thanh toán"
              value={invoice.grandTotal.toLocaleString("vi-VN")}
              suffix="đ"
              valueStyle={{ color: "#cf1322", fontWeight: "bold" }}
            />
          </Card>
        </Col>
      </Row>

      {/* 4. THÔNG TIN CHI TIẾT HÓA ĐƠN */}
      <Card
        size="small"
        bordered
        title="Thông tin Pháp lý & Kế toán Hóa đơn"
        style={{ marginBottom: 16 }}
      >
        <Descriptions size="small" bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Số hóa đơn">
            <Text strong>{invoice.invoiceNumber}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Ký hiệu mẫu số">
            <Text strong>{invoice.invoiceSymbol}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày lập hóa đơn">
            {dayjs(invoice.invoiceDate).format("DD/MM/YYYY")}
          </Descriptions.Item>

          <Descriptions.Item label="Nhà cung cấp" span={2}>
            <Text strong>{invoice.supplierName}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Mã số thuế NCC">
            <Text copyable strong>
              {invoice.supplierTaxCode}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Định danh MISA">{invoice.misaInvoiceId}</Descriptions.Item>
          <Descriptions.Item label="Ngày đồng bộ vào ERP">
            {dayjs(invoice.createdAt).format("DD/MM/YYYY HH:mm")}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái quy trình">
            {isImported ? (
              <Badge status="success" text="Đã nhập kho & Giá vốn (Hoàn tất)" />
            ) : isReadyToImport ? (
              <Badge status="processing" text="Sẵn sàng nhập kho" />
            ) : (
              <Badge status="warning" text="Chờ gán mã nội bộ" />
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 5. BẢNG DÒNG HÀNG & ÁNH XẠ MÃ NỘI BỘ SƠN KHANG */}
      <Card
        size="small"
        bordered
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text strong style={{ fontSize: 14 }}>
              Danh sách Mặt hàng trên Hóa đơn & Quy tắc Tự học Ánh xạ ({invoice.items.length} dòng hàng)
            </Text>
            {!isImported && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 Gán mã Sơn Khang và Hệ số quy đổi một lần duy nhất, hệ thống sẽ tự học cho các HĐ sau của NCC này.
              </Text>
            )}
          </div>
        }
      >
        <Table
          size="small"
          bordered
          pagination={false}
          dataSource={invoice.items}
          rowKey="id"
          columns={[
            {
              title: "Tên hàng trên HĐ NCC",
              key: "rawProductName",
              width: 260,
              render: (_: any, item: PurchaseInvoiceItem) => (
                <div>
                  <Text strong>{item.rawProductName}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    SL gốc: <Text strong>{item.quantity}</Text> {item.rawUnit} &bull; Đơn giá:{" "}
                    {item.unitPrice.toLocaleString("vi-VN")} đ
                  </Text>
                </div>
              ),
            },
            {
              title: "Mặt hàng nội bộ Sơn Khang & Hệ số quy đổi",
              key: "mapping",
              render: (_: any, item: PurchaseInvoiceItem) => {
                const currentConfig = mappingState[item.id] || {
                  productId: item.mappedProductId || "",
                  conversionRate:
                    item.convertedQty && item.quantity ? item.convertedQty / item.quantity : 1,
                };

                if (isImported) {
                  return (
                    <div>
                      <Space>
                        <Tag color="blue">{item.mappedProduct?.sku}</Tag>
                        <Text strong>{item.mappedProduct?.name}</Text>
                      </Space>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "inline-block" }}>
                        Quy đổi: <Text strong>{item.convertedQty}</Text> {item.mappedProduct?.baseUnit} &bull; Giá vốn thực tế sau chiết khấu:{" "}
                        <Text strong style={{ color: "#d46b08" }}>
                          {item.effectiveUnitCost
                            ? `${Math.round(item.effectiveUnitCost).toLocaleString("vi-VN")} đ`
                            : "N/A"}
                        </Text>
                      </Text>
                    </div>
                  );
                }

                return (
                  <Space direction="vertical" style={{ width: "100%" }} size={6}>
                    <Select
                      showSearch
                      placeholder="Chọn mã hàng Sơn Khang tương ứng..."
                      style={{ width: "100%" }}
                      value={currentConfig.productId || undefined}
                      filterOption={(input, option) =>
                        String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      options={products.map((p) => ({
                        value: p.id,
                        label: `[${p.sku}] ${p.name} (ĐVT: ${p.baseUnit} - Tồn: ${p.currentStock})`,
                      }))}
                      onChange={(val) => {
                        setMappingState({
                          ...mappingState,
                          [item.id]: {
                            ...currentConfig,
                            productId: val,
                          },
                        });
                      }}
                    />

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <Space size={8}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          1 {item.rawUnit} =
                        </Text>
                        <InputNumber
                          size="small"
                          min={0.01}
                          step={1}
                          style={{ width: 90 }}
                          value={currentConfig.conversionRate}
                          onChange={(val) => {
                            setMappingState({
                              ...mappingState,
                              [item.id]: {
                                ...currentConfig,
                                conversionRate: val || 1,
                              },
                            });
                          }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Đơn vị chuẩn &rarr; Tổng nhập:{" "}
                          <Text strong style={{ color: "#0958d9" }}>
                            {Math.round(item.quantity * (currentConfig.conversionRate || 1) * 100) / 100}
                          </Text>
                        </Text>
                      </Space>

                      <Button
                        size="small"
                        type="primary"
                        ghost
                        loading={savingMappingId === item.id}
                        onClick={() => handleSaveMapping(item.id)}
                      >
                        Lưu ánh xạ
                      </Button>
                    </div>
                  </Space>
                );
              },
            },
            {
              title: "Thành tiền",
              dataIndex: "amount",
              key: "amount",
              width: 140,
              align: "right" as const,
              render: (v: number) => (
                <Text strong style={{ color: "#1f1f1f" }}>
                  {v.toLocaleString("vi-VN")} đ
                </Text>
              ),
            },
          ]}
        />
      </Card>

      {/* 6. THÔNG BÁO TỔNG KẾT KHI ĐÃ NHẬP KHO */}
      {isImported && (
        <Alert
          style={{ marginTop: 16 }}
          message="Hóa đơn đã được nhập kho & cập nhật Giá vốn bình quân thành công"
          description={
            <div>
              Hệ thống đã tự động ghi nhận các biến động vào Thẻ kho (InventoryLedger) với mã chứng từ{" "}
              <Text strong>{invoice.invoiceSymbol}-{invoice.invoiceNumber}</Text>, đồng thời tính lại Giá vốn bình quân gia quyền (WAC) cho các sản phẩm liên quan. Bạn có thể xem lịch sử chi tiết tại tab Thẻ kho của từng sản phẩm.
            </div>
          }
          type="success"
          showIcon
        />
      )}
    </div>
  );
}
