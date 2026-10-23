"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Button, Card, Descriptions, Empty, Form, Input, InputNumber, Space, Spin, Table, Tag, Typography, message } from "antd";
import { PageHeader } from "@/components/ui/PageHeader";

type Mode = "home" | "products" | "product" | "locations" | "movements" | "stocktakes" | "stocktake-new" | "stocktake" | "issues" | "issue" | "in-transit" | "alerts";
type ApiResult = { success: boolean; data?: any[]; error?: string };

const metadata: Record<Mode, { title: string; description: string; endpoint?: string }> = {
  home: { title: "Kho hàng", description: "Tồn kho, điều chuyển, kiểm kê và cảnh báo vận hành.", endpoint: "/api/inventory/products" },
  products: { title: "Sản phẩm", description: "Số lượng tồn là cached balance; mọi biến động phải đối chiếu InventoryLedger.", endpoint: "/api/inventory/products" },
  product: { title: "Chi tiết sản phẩm", description: "Số dư kho và lịch sử biến động đã được phân quyền.", endpoint: "/api/inventory/products" },
  locations: { title: "Vị trí kho", description: "Quản lý khu vực, dãy, kệ và ô chứa hàng.", endpoint: "/api/inventory/locations" },
  movements: { title: "Biến động kho", description: "InventoryLedger là nguồn sự thật bất biến của mọi biến động.", endpoint: "/api/inventory/ledgers" },
  stocktakes: { title: "Kiểm kê", description: "Nhập số lượng thực tế trước khi chốt. Chỉ chốt một lần qua giao dịch nguyên tử.", endpoint: "/api/inventory/stocktake" },
  "stocktake-new": { title: "Tạo phiếu kiểm kê", description: "Khởi tạo bản chụp tồn hiện tại để tiến hành kiểm đếm." },
  stocktake: { title: "Chi tiết kiểm kê", description: "Số liệu chênh lệch được kiểm tra trước khi ghi InventoryLedger.", endpoint: "/api/inventory/stocktake" },
  issues: { title: "Phiếu xuất hủy", description: "Hàng hỏng, dùng nội bộ hoặc điều chỉnh có phê duyệt.", endpoint: "/api/inventory/damaged" },
  issue: { title: "Chi tiết phiếu xuất hủy", description: "Chứng từ đã post chỉ có thể đối chiếu, không được chỉnh trực tiếp.", endpoint: "/api/inventory/damaged" },
  "in-transit": { title: "Hàng đang trên xe", description: "Theo dõi tồn trên xe bằng cached balance, đối chiếu chuyến giao và ledger.", endpoint: "/api/inventory/products" },
  alerts: { title: "Cảnh báo kho", description: "Cảnh báo vận hành theo ngưỡng tạm thời; không tự động phát sinh điều chỉnh.", endpoint: "/api/inventory/products" },
};

function formatNumber(value: unknown) { return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(Number(value || 0)); }
function idFromPath() { return typeof window === "undefined" ? "" : window.location.pathname.split("/").filter(Boolean).at(-1) || ""; }

export function InventoryDedicatedPage({ mode }: { mode: Mode }) {
  const config = metadata[mode];
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(Boolean(config.endpoint));
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [form] = Form.useForm();
  const entityId = idFromPath();
  const endpoint = mode === "stocktake" ? `/api/inventory/stocktake/${encodeURIComponent(entityId)}` : config.endpoint;

  const load = async () => {
    if (!endpoint) return;
    setLoading(true); setError(null);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const payload = await response.json() as ApiResult;
      if (!response.ok || !payload.success) throw new Error(payload.error || "Không thể tải dữ liệu kho");
      setData(Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : []);
    } catch (cause: any) { setError(cause?.message || "Không thể tải dữ liệu kho"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [endpoint]);

  const entity = useMemo(() => {
    if (mode === "product") return data.find((item) => item.id === entityId);
    if (mode === "stocktake") return data.find((item) => item.id === entityId);
    if (mode === "issue") return data.find((item) => item.id === entityId);
    return null;
  }, [data, mode, entityId]);
  useEffect(() => { if (mode === "stocktake" && entity?.items) setCounts(Object.fromEntries(entity.items.map((item: any) => [item.productId, Number(item.actualQty)]))); }, [entity, mode]);

  const createStocktake = async (values: { title: string; note?: string }) => {
    const response = await fetch("/api/inventory/stocktake", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    const payload = await response.json();
    if (!response.ok || !payload.success) return message.error(payload.error || "Không thể tạo phiếu kiểm kê");
    message.success(`Đã tạo ${payload.data.stocktakeCode}`);
    window.location.assign(`/inventory/stocktakes/${payload.data.id}`);
  };
  const saveStocktake = async () => {
    if (!entity) return;
    const response = await fetch(`/api/inventory/stocktake/${entity.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: entity.items.map((item: any) => ({ productId: item.productId, actualQty: counts[item.productId], reason: item.reason })) }) });
    const payload = await response.json();
    if (!response.ok || !payload.success) return message.error(payload.error || "Không thể lưu số kiểm kê");
    message.success("Đã lưu số kiểm kê"); await load();
  };
  const completeStocktake = async () => {
    if (!entity) return;
    const response = await fetch(`/api/inventory/stocktake/${entity.id}/complete`, { method: "POST" }); const payload = await response.json();
    if (!response.ok || !payload.success) return message.error(payload.error || "Không thể chốt phiếu");
    message.success("Đã chốt phiếu kiểm kê"); await load();
  };

  const actions = mode === "stocktakes" ? <Link href="/inventory/stocktakes/new"><Button type="primary">Tạo phiếu kiểm kê</Button></Link>
    : mode === "home" ? <Space><Link href="/inventory/products"><Button>Sản phẩm</Button></Link><Link href="/inventory/stocktakes"><Button type="primary">Kiểm kê</Button></Link></Space> : undefined;

  if (mode === "stocktake-new") return <main><PageHeader title={config.title} description={config.description} breadcrumbs={[{ title: "Kho hàng", href: "/inventory" }, { title: "Kiểm kê", href: "/inventory/stocktakes" }, { title: "Tạo mới" }]} />
    <Card><Alert type="info" showIcon message="Chỉ tạo draft" description="Ghi ledger chỉ xảy ra sau khi nhập số liệu và chốt phiếu trên luồng được phân quyền." style={{ marginBottom: 16 }} />
      <Form form={form} layout="vertical" onFinish={createStocktake}><Form.Item name="title" label="Tên đợt kiểm kê" rules={[{ required: true, message: "Nhập tên đợt kiểm kê" }]}><Input maxLength={160} /></Form.Item><Form.Item name="note" label="Ghi chú"><Input.TextArea maxLength={1000} rows={4} /></Form.Item><Button htmlType="submit" type="primary">Tạo draft kiểm kê</Button></Form>
    </Card></main>;

  const filtered = mode === "in-transit" ? data.filter((item) => Number(item.inTransitStock) > 0) : mode === "alerts" ? data.filter((item) => Number(item.currentStock) <= 0) : data;
  const columns = mode === "locations" ? [
    { title: "Mã vị trí", dataIndex: "code" }, { title: "Tên", dataIndex: "name" }, { title: "Khu", dataIndex: "zone" }, { title: "Sản phẩm", render: (_: unknown, row: any) => row.products?.length || 0 },
  ] : mode === "movements" ? [
    { title: "Thời điểm", dataIndex: "createdAt", render: (value: string) => new Date(value).toLocaleString("vi-VN") }, { title: "Sản phẩm", render: (_: unknown, row: any) => row.product?.sku || row.productId }, { title: "Loại", dataIndex: "type", render: (value: string) => <Tag>{value}</Tag> }, { title: "Số lượng", dataIndex: "qtyChange", render: formatNumber }, { title: "Tồn sau", dataIndex: "stockAfter", render: formatNumber }, { title: "Tham chiếu", dataIndex: "referenceCode" },
  ] : mode === "stocktakes" ? [
    { title: "Mã phiếu", dataIndex: "stocktakeCode", render: (value: string, row: any) => <Link href={`/inventory/stocktakes/${row.id}`}>{value}</Link> }, { title: "Tên", dataIndex: "title" }, { title: "Trạng thái", dataIndex: "status", render: (value: string) => <Tag>{value}</Tag> }, { title: "Chênh lệch", dataIndex: "totalDifferenceQty", render: formatNumber },
  ] : mode === "issues" ? [
    { title: "Mã phiếu", dataIndex: "issueCode", render: (value: string, row: any) => <Link href={`/inventory/issues/${row.id}`}>{value}</Link> }, { title: "Loại", dataIndex: "type", render: (value: string) => <Tag>{value}</Tag> }, { title: "Trạng thái", dataIndex: "status" }, { title: "Giá trị", dataIndex: "totalAmount", render: (value: number) => `${formatNumber(value)} ₫` },
  ] : [
    { title: "SKU", dataIndex: "sku", render: (value: string, row: any) => <Link href={`/inventory/products/${row.id}`}>{value}</Link> }, { title: "Sản phẩm", dataIndex: "name" }, { title: "Tồn kho", dataIndex: "currentStock", render: (value: number) => formatNumber(value) }, { title: "Trên xe", dataIndex: "inTransitStock", render: (value: number) => formatNumber(value) }, { title: "Vị trí", render: (_: unknown, row: any) => row.location?.code || "—" },
  ];

  return <main><PageHeader title={config.title} description={config.description} extra={actions} breadcrumbs={[{ title: "Kho hàng", href: "/inventory" }, ...(mode === "home" ? [] : [{ title: config.title }])]} />
    {error ? <Alert type="error" showIcon message={error} action={<Button onClick={() => void load()}>Thử lại</Button>} style={{ marginBottom: 16 }} /> : null}
    {mode === "home" ? <Space wrap size={16} style={{ marginBottom: 16 }}><Card><Typography.Text type="secondary">Sản phẩm</Typography.Text><Typography.Title level={3}>{data.length}</Typography.Title></Card><Card><Typography.Text type="secondary">Sắp hết tồn</Typography.Text><Typography.Title level={3}>{data.filter((item) => Number(item.currentStock) <= 0).length}</Typography.Title></Card><Card><Typography.Text type="secondary">Hàng trên xe</Typography.Text><Typography.Title level={3}>{formatNumber(data.reduce((sum, item) => sum + Number(item.inTransitStock || 0), 0))}</Typography.Title></Card></Space> : null}
    {mode === "stocktake" ? (loading ? <Spin /> : entity ? <Space direction="vertical" style={{ width: "100%" }} size={16}><Descriptions bordered column={1} items={Object.entries(entity).filter(([key]) => !["items", "product"].includes(key)).map(([key, value]) => ({ key, label: key, children: typeof value === "object" ? JSON.stringify(value) : String(value ?? "—") }))} /><Card title="Dòng kiểm kê"><Table rowKey="id" pagination={false} dataSource={entity.items} columns={[{ title: "Sản phẩm", render: (_: unknown, row: any) => row.product?.name || row.productId }, { title: "Tồn hệ thống", dataIndex: "systemQty", render: formatNumber }, { title: "Thực đếm", render: (_: unknown, row: any) => <InputNumber min={0} value={counts[row.productId]} onChange={(value) => setCounts((current) => ({ ...current, [row.productId]: Number(value || 0) }))} /> }]} /><Space><Button onClick={() => void saveStocktake()} disabled={entity.status === "COMPLETED"}>Lưu số kiểm đếm</Button><Button type="primary" onClick={() => void completeStocktake()} disabled={entity.status !== "IN_PROGRESS"}>Chốt kiểm kê</Button></Space></Card></Space> : <Empty description="Không tìm thấy bản ghi" />) : ["product", "issue"].includes(mode) ? (loading ? <Spin /> : entity ? <Descriptions bordered column={1} items={Object.entries(entity).filter(([key]) => !["items", "product"].includes(key)).map(([key, value]) => ({ key, label: key, children: typeof value === "object" ? JSON.stringify(value) : String(value ?? "—") }))} /> : <Empty description="Không tìm thấy bản ghi" />) : <><Table rowKey="id" loading={loading} dataSource={filtered} columns={columns as any} pagination={{ pageSize: 20 }} locale={{ emptyText: <Empty description="Chưa có dữ liệu" /> }} />{mode === "issues" ? <Alert style={{ marginTop: 16 }} type="warning" showIcon message="Phiếu xuất hủy hiện chỉ đọc" description="Tính năng post bị khóa an toàn cho đến khi migration bổ sung người duyệt và trạng thái phê duyệt độc lập." /> : null}</>}
  </main>;
}
