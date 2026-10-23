"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Card, Descriptions, Spin, Table, Tag, Typography } from "antd";

const { Title } = Typography;

export function ThreeWayMatch({ purchaseOrderId }: { purchaseOrderId: string }) {
  const [data, setData] = useState<any>(); const [error, setError] = useState<string>();
  useEffect(() => { fetch(`/api/procurement/orders/${encodeURIComponent(purchaseOrderId)}/match`).then(async (r) => { const payload = await r.json(); if (!r.ok) throw new Error(payload.error || "Không thể đối chiếu PO"); return payload.data; }).then(setData).catch((e) => setError(e.message)); }, [purchaseOrderId]);
  if (error) return <Alert type="error" message={error} showIcon />;
  if (!data) return <Spin />;
  const total = (value: number) => `${value.toLocaleString("vi-VN")} đ`;
  return <main><Link href="/purchasing/purchase-orders">← Đơn mua hàng</Link><Title level={2}>Đối chiếu 3 bên: {data.poCode}</Title>
    <Alert type={data.matchStatus === "FAILED" ? "error" : data.matchStatus === "WARNING" ? "warning" : "success"} showIcon message={`Kết quả: ${data.matchStatus}`} description={data.discrepancies.length ? data.discrepancies.join(" · ") : "Không phát hiện chênh lệch theo các dữ liệu hiện có."} style={{ marginBottom: 16 }} />
    <Descriptions bordered column={1}><Descriptions.Item label="Nhà cung cấp">{data.supplierName} · {data.supplierTaxCode}</Descriptions.Item><Descriptions.Item label="PO / Hóa đơn">{total(data.summary.poTotalAmount)} / {total(data.summary.invoiceGrandTotal)}</Descriptions.Item><Descriptions.Item label="Chênh lệch">SL {data.summary.qtyDifference} · {total(data.summary.amountDifference)}</Descriptions.Item></Descriptions>
    <Card title="Chi tiết dòng" style={{ marginTop: 16 }}><Table rowKey="productId" size="small" pagination={false} dataSource={data.lineDetails} columns={[{ title: "Mặt hàng", render: (_: unknown, row: any) => `${row.productSku} · ${row.productName}` }, { title: "Đặt", dataIndex: "orderedQty" }, { title: "Thực nhập", dataIndex: "receivedQty" }, { title: "Hóa đơn", dataIndex: "billedQty" }, { title: "Trạng thái", dataIndex: "status", render: (v: string) => <Tag color={v === "EXACT_MATCH" ? "green" : "orange"}>{v}</Tag> }]} /></Card>
  </main>;
}
