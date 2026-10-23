"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Card, Table, Tag, Typography } from "antd";

const { Title, Paragraph } = Typography;
export function ReceiptsList() {
  const [data, setData] = useState<any[]>([]); const [error, setError] = useState<string>(); const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/procurement/receipts").then(async (r) => { const payload = await r.json(); if (!r.ok) throw new Error(payload.error || "Không tải được phiếu nhập"); return payload.data; }).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  return <main><Title level={2}>Phiếu nhập kho</Title><Alert type="info" showIcon message="Suy chiếu chỉ đọc" description="Chưa có entity Phiếu nhập độc lập trong schema; danh sách này dùng các hóa đơn đã nhập kho, không phát sinh bút toán hoặc InventoryLedger mới." style={{ marginBottom: 16 }} />
    {error ? <Alert type="error" message={error} showIcon /> : <Card><Table loading={loading} rowKey="id" dataSource={data} columns={[{ title: "Số hóa đơn", dataIndex: "invoiceNumber", render: (v, row) => <Link href={`/purchasing/receipts/${row.id}`}>{v}</Link> }, { title: "Nhà cung cấp", dataIndex: "supplierName" }, { title: "Ngày", dataIndex: "invoiceDate", render: (v) => new Date(v).toLocaleDateString("vi-VN") }, { title: "Tổng tiền", dataIndex: "grandTotal", align: "right", render: (v) => `${v.toLocaleString("vi-VN")} đ` }, { title: "Trạng thái", dataIndex: "status", render: (v) => <Tag color="green">{v}</Tag> }]} /></Card>}</main>;
}
