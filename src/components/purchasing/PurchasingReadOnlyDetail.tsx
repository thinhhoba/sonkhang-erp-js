"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Card, Descriptions, Spin, Table, Tag, Typography } from "antd";

const { Title, Text } = Typography;

function money(value: unknown) {
  return typeof value === "number" ? `${value.toLocaleString("vi-VN")} đ` : "—";
}

export function SupplierDetail({ supplierId }: { supplierId: string }) {
  const [data, setData] = useState<any>();
  const [error, setError] = useState<string>();
  useEffect(() => { fetch(`/api/procurement/suppliers/${encodeURIComponent(supplierId)}`).then(async (r) => {
    const payload = await r.json(); if (!r.ok) throw new Error(payload.error || "Không tải được nhà cung cấp"); return payload.data;
  }).then(setData).catch((e) => setError(e.message)); }, [supplierId]);
  if (error) return <Alert type="error" message={error} showIcon />;
  if (!data) return <Spin />;
  return <main><Link href="/purchasing/suppliers">← Nhà cung cấp</Link><Title level={2}>{data.name}</Title>
    <Descriptions bordered column={1}><Descriptions.Item label="Mã / MST">{data.code} · {data.taxCode}</Descriptions.Item><Descriptions.Item label="Liên hệ">{data.contactPerson || "—"} · {data.phone || "—"}</Descriptions.Item><Descriptions.Item label="Điều khoản">{data.paymentTerms}</Descriptions.Item><Descriptions.Item label="Công nợ cache">{money(data.currentDebt)}</Descriptions.Item></Descriptions>
    <Card title="10 PO gần nhất" style={{ marginTop: 16 }}><Table rowKey="id" size="small" pagination={false} dataSource={data.purchaseOrders} columns={[{ title: "Mã PO", dataIndex: "poCode" }, { title: "Trạng thái", dataIndex: "status", render: (v) => <Tag>{v}</Tag> }, { title: "Tổng tiền", dataIndex: "grandTotal", render: money }]} /></Card>
  </main>;
}

export function ReceiptDetail({ receiptId }: { receiptId: string }) {
  const [data, setData] = useState<any>(); const [error, setError] = useState<string>();
  useEffect(() => { fetch(`/api/procurement/receipts/${encodeURIComponent(receiptId)}`).then(async (r) => { const payload = await r.json(); if (!r.ok) throw new Error(payload.error || "Không tải được phiếu nhập"); return payload.data; }).then(setData).catch((e) => setError(e.message)); }, [receiptId]);
  if (error) return <Alert type="error" message={error} showIcon />;
  if (!data) return <Spin />;
  return <main><Link href="/purchasing/receipts">← Phiếu nhập</Link><Title level={2}>Phiếu nhập suy chiếu: {data.invoiceNumber}</Title><Alert type="info" showIcon message="Chỉ đọc" description="Schema hiện không có thực thể phiếu nhập; dữ liệu được suy chiếu từ hóa đơn đã nhập kho, không cho phép ghi." style={{ marginBottom: 16 }} />
    <Descriptions bordered column={1}><Descriptions.Item label="Nhà cung cấp">{data.supplierName}</Descriptions.Item><Descriptions.Item label="Ngày hóa đơn">{new Date(data.invoiceDate).toLocaleDateString("vi-VN")}</Descriptions.Item><Descriptions.Item label="Tổng tiền">{money(data.grandTotal)}</Descriptions.Item><Descriptions.Item label="Trạng thái">{data.status}</Descriptions.Item></Descriptions>
    <Card title="Dòng hàng" style={{ marginTop: 16 }}><Table rowKey="id" size="small" pagination={false} dataSource={data.items} columns={[{ title: "Tên theo hóa đơn", dataIndex: "rawProductName" }, { title: "Sản phẩm nội bộ", render: (_: unknown, row: any) => row.mappedProduct ? `${row.mappedProduct.sku} · ${row.mappedProduct.name}` : <Text type="secondary">Chưa mapping</Text> }, { title: "SL", dataIndex: "quantity" }, { title: "Đơn giá", dataIndex: "unitPrice", render: money }]} /></Card>
  </main>;
}

export function PurchaseInvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const [data, setData] = useState<any>(); const [error, setError] = useState<string>();
  useEffect(() => { fetch(`/api/inventory/invoices/${encodeURIComponent(invoiceId)}`).then(async (r) => { const payload = await r.json(); if (!r.ok) throw new Error(payload.error || "Không tải được hóa đơn"); return payload.data; }).then(setData).catch((e) => setError(e.message)); }, [invoiceId]);
  if (error) return <Alert type="error" message={error} showIcon />;
  if (!data) return <Spin />;
  return <main><Link href="/purchasing/invoices">← Hóa đơn đầu vào</Link><Title level={2}>Hóa đơn: {data.invoiceNumber}</Title>
    <Descriptions bordered column={1}><Descriptions.Item label="Nhà cung cấp">{data.supplierName} · {data.supplierTaxCode}</Descriptions.Item><Descriptions.Item label="Ký hiệu / ngày">{data.invoiceSymbol} · {new Date(data.invoiceDate).toLocaleDateString("vi-VN")}</Descriptions.Item><Descriptions.Item label="Tổng thanh toán">{money(data.grandTotal)}</Descriptions.Item><Descriptions.Item label="Trạng thái">{data.status}</Descriptions.Item></Descriptions>
    <Card title="Dòng hóa đơn" style={{ marginTop: 16 }}><Table rowKey="id" size="small" pagination={false} dataSource={data.items} columns={[{ title: "Hàng theo hóa đơn", dataIndex: "rawProductName" }, { title: "Nội bộ", render: (_: unknown, row: any) => row.mappedProduct ? `${row.mappedProduct.sku} · ${row.mappedProduct.name}` : <Tag color="orange">Chưa mapping</Tag> }, { title: "SL", dataIndex: "quantity" }, { title: "Đơn giá", dataIndex: "unitPrice", render: money }, { title: "Thành tiền", dataIndex: "amount", render: money }]} /></Card>
  </main>;
}
