"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Button, Card, Descriptions, Empty, List, Result, Space, Spin, Statistic, Tag, Typography, message } from "antd";

type Surface = "overview" | "orders" | "order-detail" | "customer-detail" | "credit-approvals" | "sync-status" | "return-detail";

const meta: Record<Surface, { title: string; description: string; endpoint?: string }> = {
  overview: { title: "Bán hàng", description: "Theo dõi đơn Sapo, khách hàng, phê duyệt hạn mức và hàng trả." },
  orders: { title: "Đơn bán", description: "Đơn hàng chỉ đọc từ nguồn đồng bộ Sapo; tạo hay điều chỉnh trực tiếp không được hỗ trợ." , endpoint: "/api/sales/orders" },
  "order-detail": { title: "Chi tiết đơn bán", description: "Thông tin điều phối, hàng hóa và trạng thái hạn mức." },
  "customer-detail": { title: "Hồ sơ khách hàng", description: "Lịch sử đơn hàng, hàng trả và thông tin tín dụng." },
  "credit-approvals": { title: "Phê duyệt hạn mức", description: "Chỉ quản trị viên được quyết định; mỗi quyết định được ghi audit và không thể phát lại." , endpoint: "/api/sales/credit-approvals" },
  "sync-status": { title: "Trạng thái đồng bộ", description: "Tình trạng đồng bộ đơn bán sang MISA." , endpoint: "/api/sales/orders" },
  "return-detail": { title: "Chi tiết hàng trả", description: "Hàng trả được đối soát trong quy trình khóa chuyến; chưa cho phép tạo trực tiếp." },
};

function money(value: unknown) { return `${Number(value || 0).toLocaleString("vi-VN")} ₫`; }

export function SalesRoutePage({ surface, id }: { surface: Surface; id?: string }) {
  const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [working, setWorking] = useState(false);
  const config = meta[surface];
  const endpoint = surface === "order-detail" ? `/api/sales/orders/${id}` : surface === "customer-detail" ? `/api/sales/customers/${id}` : surface === "return-detail" ? "/api/sales/returns" : config.endpoint;
  const load = async () => { if (!endpoint) { setLoading(false); return; } try { setLoading(true); const response = await fetch(endpoint); const payload = await response.json(); if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể tải dữ liệu"); setData(surface === "return-detail" ? (payload.data || []).find((row: any) => row.id === id) : payload.data); } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải dữ liệu"); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [endpoint, id]);
  const decide = async (orderId: string, action: "APPROVE" | "REJECT") => { const note = window.prompt(action === "APPROVE" ? "Lý do phê duyệt" : "Lý do từ chối"); if (!note?.trim()) return; try { setWorking(true); const response = await fetch(`/api/sales/orders/${orderId}/credit-approve`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, note }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Không thể xử lý"); message.success("Đã ghi nhận quyết định và audit log"); load(); } catch (cause) { message.error(cause instanceof Error ? cause.message : "Không thể xử lý yêu cầu"); } finally { setWorking(false); } };

  if (loading) return <Card><Spin /></Card>;
  if (error) return <Result status="error" title="Không thể tải dữ liệu" subTitle={error} extra={<Button onClick={load}>Thử lại</Button>} />;
  if (surface === "overview") return <Space direction="vertical" size="middle" style={{ width: "100%" }}><Alert type="info" showIcon message="Đơn bán là dữ liệu đồng bộ" description="Sapo là nguồn tạo đơn. Chỉ điều phối và phê duyệt hạn mức được thực hiện trong ERP." /><Space wrap><Link href="/sales/orders"><Button type="primary">Đơn bán</Button></Link><Link href="/sales/customers"><Button>Khách hàng</Button></Link><Link href="/sales/credit-approvals"><Button>Chờ duyệt hạn mức</Button></Link><Link href="/sales/returns"><Button>Hàng trả</Button></Link></Space></Space>;
  if (!data && ["order-detail", "customer-detail", "return-detail"].includes(surface)) return <Empty description="Không tìm thấy bản ghi" />;
  if (surface === "order-detail") return <OrderDetail order={data} />;
  if (surface === "customer-detail") return <CustomerDetail customer={data} />;
  if (surface === "return-detail") return <ReturnDetail value={data} />;
  if (surface === "credit-approvals") return <List locale={{ emptyText: "Không có yêu cầu chờ duyệt" }} dataSource={data || []} renderItem={(row: any) => <List.Item actions={[<Button key="approve" type="primary" loading={working} onClick={() => decide(row.id, "APPROVE")}>Duyệt</Button>, <Button key="reject" danger loading={working} onClick={() => decide(row.id, "REJECT")}>Từ chối</Button>]}><List.Item.Meta title={<Link href={`/sales/orders/${row.id}`}>{row.orderCode}</Link>} description={`${row.customerName} · ${money(row.totalAmount)} · ${row.creditApprovalNote || "Vượt hạn mức"}`} /></List.Item>} />;
  if (surface === "sync-status") return <List dataSource={data || []} locale={{ emptyText: "Chưa có đơn hàng" }} renderItem={(row: any) => <List.Item><List.Item.Meta title={<Link href={`/sales/orders/${row.id}`}>{row.orderCode}</Link>} description={row.customerName} /><Tag color={row.misaSyncStatus === "SYNCED" ? "green" : "orange"}>{row.misaSyncStatus}</Tag></List.Item>} />;
  return <List dataSource={data || []} locale={{ emptyText: "Chưa có đơn hàng" }} renderItem={(row: any) => <List.Item><List.Item.Meta title={<Link href={`/sales/orders/${row.id}`}>{row.orderCode}</Link>} description={`${row.customerName} · ${row.shippingAddress}`} /><Space direction="vertical" align="end"><Tag>{row.deliveryStatus}</Tag><Typography.Text>{money(row.totalAmount)}</Typography.Text></Space></List.Item>} />;
}

function OrderDetail({ order }: { order: any }) { return <Space direction="vertical" style={{ width: "100%" }}><Card><Descriptions column={1}><Descriptions.Item label="Mã đơn">{order.orderCode}</Descriptions.Item><Descriptions.Item label="Khách hàng">{order.customerName}</Descriptions.Item><Descriptions.Item label="Giao tới">{order.shippingAddress}</Descriptions.Item><Descriptions.Item label="Trạng thái"><Tag>{order.deliveryStatus}</Tag></Descriptions.Item><Descriptions.Item label="Tổng tiền">{money(order.totalAmount)}</Descriptions.Item><Descriptions.Item label="COD">{money(order.codAmountRequired)}</Descriptions.Item><Descriptions.Item label="Hạn mức"><Tag color={order.creditApprovalStatus === "APPROVED" ? "green" : "orange"}>{order.creditApprovalStatus}</Tag></Descriptions.Item></Descriptions></Card><Card title="Dòng hàng"><List dataSource={order.items || []} renderItem={(item: any) => <List.Item><List.Item.Meta title={item.product?.name || item.productId} description={item.product?.sku} /><span>{item.orderedQty} {item.product?.baseUnit} · {money(item.lineAmount)}</span></List.Item>} /></Card></Space>; }
function CustomerDetail({ customer }: { customer: any }) { return <Card><Descriptions column={1}><Descriptions.Item label="Mã khách">{customer.customerCode}</Descriptions.Item><Descriptions.Item label="Tên">{customer.name}</Descriptions.Item><Descriptions.Item label="Điện thoại">{customer.phone || "—"}</Descriptions.Item><Descriptions.Item label="Địa chỉ">{customer.address || "—"}</Descriptions.Item><Descriptions.Item label="Hạn mức">{money(customer.creditLimit)}</Descriptions.Item><Descriptions.Item label="Công nợ (cache)">{money(customer.currentDebt)}</Descriptions.Item></Descriptions><Typography.Paragraph type="secondary">Công nợ là số dư cache; đối soát chính thức thực hiện ở phân hệ Công nợ.</Typography.Paragraph></Card>; }
function ReturnDetail({ value }: { value: any }) { return <Card><Descriptions column={1}><Descriptions.Item label="Mã phiếu">{value.returnCode}</Descriptions.Item><Descriptions.Item label="Ngày nhận">{new Date(value.returnDate).toLocaleDateString("vi-VN")}</Descriptions.Item><Descriptions.Item label="Lý do">{value.reason}</Descriptions.Item><Descriptions.Item label="Trạng thái"><Tag>{value.status}</Tag></Descriptions.Item></Descriptions><List dataSource={value.items || []} renderItem={(item: any) => <List.Item>{item.product?.name || item.productId} · {item.quantity} · {item.condition}</List.Item>} /></Card>; }
