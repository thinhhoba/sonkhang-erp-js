"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Drawer, Empty, Space, Spin, Table, Tag, Typography, message } from "antd";
import { PageHeader } from "@/components/ui/PageHeader";

const { Text } = Typography;

/**
 * Read-only until the return/AR/InventoryLedger workflow has a safe migration.
 */
export default function SalesReturnsPage() {
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  useEffect(() => { (async () => { try { const response = await fetch("/api/sales/returns"); const payload = await response.json(); if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể tải hàng trả"); setReturns(payload.data || []); } catch (error) { message.error(error instanceof Error ? error.message : "Không thể tải hàng trả"); } finally { setLoading(false); } })(); }, []);
  const totalReturnValue = returns.reduce((sum, row) => sum + Number(row.totalReturnAmount || 0), 0);
  const totalArDeducted = returns.reduce((sum, row) => sum + Number(row.arDeductionAmount || 0), 0);
  return <>
    <PageHeader title="Hàng trả" description="Danh sách chỉ đọc trong phase hiện tại; nghiệp vụ đầy đủ chờ migration Ledger/AR đã được duyệt." breadcrumbs={[{ title: "Bán hàng", href: "/sales" }, { title: "Hàng trả" }]} />
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Text type="secondary">Hiển thị tối đa 100 bản ghi gần nhất. Trạng thái kho và công nợ chính thức được xác nhận trong quy trình khóa chuyến/đối soát.</Text>
      <Space wrap><Card size="small"><Text type="secondary">Bản ghi hiển thị</Text><div><b>{returns.length}</b> / 100</div></Card><Card size="small"><Text type="secondary">Giá trị hàng trả (danh sách)</Text><div><b>{totalReturnValue.toLocaleString("vi-VN")} đ</b></div></Card><Card size="small"><Text type="secondary">Giảm trừ AR đã ghi nhận</Text><div><b>{totalArDeducted.toLocaleString("vi-VN")} đ</b></div></Card></Space>
      <Card>{loading ? <Spin /> : <Table rowKey="id" dataSource={returns} locale={{ emptyText: <Empty description="Chưa có bản ghi hàng trả" /> }} pagination={{ pageSize: 10 }} columns={[{ title: "Mã phiếu", dataIndex: "returnCode", render: (value) => <Tag color="volcano">{value}</Tag> }, { title: "Ngày", dataIndex: "returnDate", render: (value) => new Date(value).toLocaleDateString("vi-VN") }, { title: "Lý do", dataIndex: "reason" }, { title: "Trạng thái", dataIndex: "status", render: (value) => <Tag>{value}</Tag> }, { title: "Thao tác", render: (_value, row) => <a onClick={() => setSelected(row)}>Xem chi tiết</a> }]} />}</Card>
    </Space>
    <Drawer title="Chi tiết hàng trả" width={680} open={Boolean(selected)} onClose={() => setSelected(null)}>{selected ? <><Descriptions bordered column={1}><Descriptions.Item label="Mã phiếu">{selected.returnCode}</Descriptions.Item><Descriptions.Item label="Lý do">{selected.reason}</Descriptions.Item><Descriptions.Item label="Trạng thái">{selected.status}</Descriptions.Item><Descriptions.Item label="Ghi chú">{selected.note || "—"}</Descriptions.Item></Descriptions><Table style={{ marginTop: 16 }} rowKey="id" pagination={false} dataSource={selected.items || []} columns={[{ title: "SKU", render: (_value: unknown, item: any) => item.product?.sku || item.productId }, { title: "Mặt hàng", render: (_value: unknown, item: any) => item.product?.name || "—" }, { title: "Số lượng", dataIndex: "quantity" }, { title: "Tình trạng", dataIndex: "condition", render: (value) => <Tag>{value}</Tag> }]} /></> : null}</Drawer>
  </>;
}
