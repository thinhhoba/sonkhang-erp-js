"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Card, Col, Descriptions, Empty, Row, Space, Statistic, Table, Tag } from "antd";
import { PageHeader } from "@/components/ui/PageHeader";

export type DebtPageKind = "overview" | "receivables" | "receivable-detail" | "payables" | "payable-detail" | "aging" | "credit-limits";

const formatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("vi-VN");
const money = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return formatter.format(BigInt(0));
  if (typeof value === "number" && !Number.isSafeInteger(value)) return "Dữ liệu tiền không hợp lệ";
  return formatter.format(BigInt(value));
};
const date = (value: string | null | undefined) => value ? dateFormatter.format(new Date(value)) : "—";

const titles: Record<DebtPageKind, { title: string; description: string }> = {
  overview: { title: "Công nợ", description: "Theo dõi chỉ đọc các số dư đối tác và cảnh báo tín dụng." },
  receivables: { title: "Phải thu khách hàng", description: "Projection từ số dư cache hiện có; chưa phải sổ chi tiết phải thu." },
  "receivable-detail": { title: "Hồ sơ công nợ khách hàng", description: "Đơn hàng và hàng trả chỉ phục vụ tra cứu." },
  payables: { title: "Phải trả nhà cung cấp", description: "Projection từ số dư cache hiện có; chưa phải sổ chi tiết phải trả." },
  "payable-detail": { title: "Hồ sơ công nợ nhà cung cấp", description: "Lịch sử PO chỉ phục vụ tra cứu." },
  aging: { title: "Tuổi nợ phải thu", description: "Phân nhóm rủi ro dựa vào kỳ hạn và đơn cũ nhất đang có." },
  "credit-limits": { title: "Hạn mức tín dụng", description: "Theo dõi hạn mức và số dư cache theo khách hàng." },
};

function Status({ children, color }: { children: React.ReactNode; color: string }) {
  return <Tag color={color}>{children}</Tag>;
}

export function DebtPage({ kind, id, canViewPayables }: { kind: DebtPageKind; id?: string; canViewPayables: boolean }) {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const baseEndpoint = kind === "receivable-detail" ? `/api/debts/receivables/${id}`
    : kind === "payable-detail" ? `/api/debts/payables/${id}`
      : `/api/debts/${kind === "overview" ? "overview" : kind}`;
  const paginated = ["receivables", "payables", "aging", "credit-limits"].includes(kind);
  const endpoint = paginated ? `${baseEndpoint}?page=${page}&limit=20` : baseEndpoint;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch(endpoint, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.error || "Không thể tải dữ liệu công nợ.");
        if (active) {
          setData(body.data);
          setPagination(body.pagination || null);
        }
      })
      .catch((reason) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [endpoint]);

  const meta = titles[kind];
  return (
    <>
      <PageHeader
        title={meta.title}
        description={meta.description}
        breadcrumbs={[{ title: "Tổng quan", href: "/overview" }, { title: "Công nợ", href: "/debts" }, { title: meta.title }]}
        extra={<Space wrap>
          <Link href="/debts/receivables">Phải thu</Link>
          <Link href="/debts/aging">Tuổi nợ</Link>
          <Link href="/debts/credit-limits">Hạn mức</Link>
          {canViewPayables ? <Link href="/debts/payables">Phải trả</Link> : null}
        </Space>}
      />
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Dữ liệu hiện là projection chỉ đọc"
        description="Số dư hiển thị lấy từ currentDebt của đối tác. Chưa có AR/AP ledger và payment allocation, nên không dùng màn hình này để ghi nhận hoặc đối soát kế toán."
      />
      {error ? <Alert type="error" showIcon message={error} /> : renderBody(kind, data, loading, pagination, setPage)}
    </>
  );
}

function renderBody(
  kind: DebtPageKind,
  data: any,
  loading: boolean,
  pagination: { page: number; limit: number; total: number } | null,
  onPageChange: (page: number) => void
) {
  if (kind === "overview") return <Overview data={data} loading={loading} />;
  if (kind === "receivables") return <ReceivableList data={data} loading={loading} pagination={pagination} onPageChange={onPageChange} />;
  if (kind === "payables") return <PayableList data={data} loading={loading} pagination={pagination} onPageChange={onPageChange} />;
  if (kind === "aging") return <AgingList data={data} loading={loading} pagination={pagination} onPageChange={onPageChange} />;
  if (kind === "credit-limits") return <CreditLimitList data={data} loading={loading} pagination={pagination} onPageChange={onPageChange} />;
  return <CounterpartyDetail data={data} loading={loading} payable={kind === "payable-detail"} />;
}

type ListProps = {
  data: any[];
  loading: boolean;
  pagination: { page: number; limit: number; total: number } | null;
  onPageChange: (page: number) => void;
};

const tablePagination = (pagination: ListProps["pagination"], onPageChange: ListProps["onPageChange"]) => ({
  current: pagination?.page || 1,
  pageSize: pagination?.limit || 20,
  total: pagination?.total || 0,
  showSizeChanger: false,
  onChange: onPageChange,
});

function Overview({ data, loading }: { data: any; loading: boolean }) {
  const ar = data?.receivables;
  const ap = data?.payables;
  const tiles = [
    ["Phải thu (cache)", ar?.balanceVnd, "#1677ff", true], ["Khách vượt hạn mức", ar?.overLimit, "#d46b08", false],
    ["Có dấu hiệu quá kỳ hạn", ar?.projectedPastDue, "#cf1322", false], ["Phải trả (cache)", ap?.balanceVnd, "#722ed1", true],
  ];
  return <Row gutter={[16, 16]}>{tiles.filter((tile) => tile[1] !== undefined).map(([label, value, color, isMoney]) => <Col xs={24} sm={12} lg={6} key={String(label)}>
    <Card loading={loading}><Statistic title={label} value={isMoney ? 0 : String(value)} formatter={() => isMoney ? money(String(value)) : String(value)} valueStyle={{ color: String(color) }} /></Card>
  </Col>)}</Row>;
}

function ReceivableList({ data, loading, pagination, onPageChange }: ListProps) {
  return <Table loading={loading} rowKey="id" dataSource={data || []} scroll={{ x: 960 }} pagination={tablePagination(pagination, onPageChange)} columns={[
    { title: "Khách hàng", render: (_, row) => <Link href={`/debts/receivables/${row.id}`}>{row.customerCode} · {row.name}</Link> },
    { title: "Số dư cache", dataIndex: "currentDebtVnd", align: "right", render: money },
    { title: "Hạn mức", dataIndex: "creditLimitVnd", align: "right", render: (value) => BigInt(value) > BigInt(0) ? money(value) : "Không giới hạn" },
    { title: "Điều khoản", dataIndex: "paymentTerms", render: (value) => <Status color="blue">{value}</Status> },
    { title: "Đơn hàng", dataIndex: "orderCount", align: "right" },
    { title: "Trạng thái", render: (_, row) => row.isBlocked ? <Status color="red">Khóa nợ</Status> : BigInt(row.creditLimitVnd) > BigInt(0) && BigInt(row.currentDebtVnd) > BigInt(row.creditLimitVnd) ? <Status color="orange">Vượt hạn mức</Status> : <Status color="green">Bình thường</Status> },
  ]} />;
}

function PayableList({ data, loading, pagination, onPageChange }: ListProps) {
  return <Table loading={loading} rowKey="id" dataSource={data || []} scroll={{ x: 900 }} pagination={tablePagination(pagination, onPageChange)} columns={[
    { title: "Nhà cung cấp", render: (_, row) => <Link href={`/debts/payables/${row.id}`}>{row.code} · {row.name}</Link> },
    { title: "MST", dataIndex: "taxCode" }, { title: "Số dư cache", dataIndex: "currentDebtVnd", align: "right", render: money },
    { title: "Điều khoản", dataIndex: "paymentTerms", render: (value) => <Status color="purple">{value}</Status> },
    { title: "PO", dataIndex: "orderCount", align: "right" }, { title: "Hoạt động", dataIndex: "isActive", render: (value) => value ? <Status color="green">Có</Status> : <Status color="default">Không</Status> },
  ]} />;
}

function AgingList({ data, loading, pagination, onPageChange }: ListProps) {
  const labels: Record<string, string> = { CURRENT: "Chưa có dấu hiệu quá kỳ hạn", DUE_1_30: "Proxy 1–30 ngày", DUE_31_60: "Proxy 31–60 ngày", DUE_61_90: "Proxy 61–90 ngày", DUE_90_PLUS: "Proxy > 90 ngày" };
  return <Table loading={loading} rowKey="id" dataSource={data || []} scroll={{ x: 880 }} pagination={tablePagination(pagination, onPageChange)} columns={[
    { title: "Khách hàng", render: (_, row) => <Link href={`/debts/receivables/${row.id}`}>{row.code} · {row.name}</Link> },
    { title: "Số dư cache", dataIndex: "balanceVnd", align: "right", render: money }, { title: "Ngày kỳ hạn proxy", dataIndex: "dueDate", render: date },
    { title: "Số ngày sau kỳ hạn proxy", dataIndex: "daysPastDue", align: "right" }, { title: "Nhóm rủi ro projection", dataIndex: "bucket", render: (value) => <Status color={value === "CURRENT" ? "green" : "volcano"}>{labels[value]}</Status> },
  ]} />;
}

function CreditLimitList({ data, loading, pagination, onPageChange }: ListProps) {
  return <Table loading={loading} rowKey="id" dataSource={data || []} scroll={{ x: 900 }} pagination={tablePagination(pagination, onPageChange)} columns={[
    { title: "Khách hàng", render: (_, row) => <Link href={`/debts/receivables/${row.id}`}>{row.customerCode} · {row.name}</Link> },
    { title: "Hạn mức", dataIndex: "creditLimitVnd", align: "right", render: (value) => BigInt(value) > BigInt(0) ? money(value) : "Không giới hạn" },
    { title: "Số dư cache", dataIndex: "currentDebtVnd", align: "right", render: money }, { title: "Còn lại", dataIndex: "remainingCreditVnd", align: "right", render: (value) => value === null ? "—" : money(value) },
    { title: "Sử dụng", dataIndex: "utilizationPercent", render: (value) => value === null ? "—" : `${value}%` }, { title: "Khóa nợ", dataIndex: "isBlocked", render: (value) => value ? <Status color="red">Có</Status> : <Status color="green">Không</Status> },
  ]} />;
}

function CounterpartyDetail({ data, loading, payable }: { data: any; loading: boolean; payable: boolean }) {
  if (!loading && !data) return <Empty description="Không có dữ liệu" />;
  const orders = payable ? data?.purchaseOrders : data?.salesOrders;
  return <Space direction="vertical" size="large" style={{ width: "100%" }}>
    <Card loading={loading} title={payable ? "Thông tin nhà cung cấp" : "Thông tin khách hàng"}>
      {data && <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small">
        <Descriptions.Item label="Mã">{payable ? data.code : data.customerCode}</Descriptions.Item><Descriptions.Item label="Tên">{data.name}</Descriptions.Item><Descriptions.Item label="Số dư cache">{money(data.currentDebtVnd)}</Descriptions.Item>
        <Descriptions.Item label="Điều khoản">{data.paymentTerms}</Descriptions.Item><Descriptions.Item label="Hạn mức">{BigInt(data.creditLimitVnd) > BigInt(0) ? money(data.creditLimitVnd) : "Không giới hạn"}</Descriptions.Item><Descriptions.Item label="Cập nhật">{date(data.updatedAt)}</Descriptions.Item>
      </Descriptions>}
    </Card>
    <Card title={payable ? "Đơn mua gần đây" : "Đơn bán gần đây"} loading={loading}>
      <Table size="small" rowKey="id" dataSource={orders || []} pagination={false} scroll={{ x: 760 }} columns={payable ? [
        { title: "Mã PO", dataIndex: "poCode" }, { title: "Ngày lập", dataIndex: "createdAt", render: date }, { title: "Tổng", dataIndex: "grandTotalVnd", align: "right", render: money }, { title: "Trạng thái", dataIndex: "status", render: (value) => <Status color="blue">{value}</Status> },
      ] : [
        { title: "Mã đơn", dataIndex: "orderCode" }, { title: "Ngày đặt", dataIndex: "orderDate", render: date }, { title: "Tổng", dataIndex: "totalAmountVnd", align: "right", render: money }, { title: "Giao hàng", dataIndex: "deliveryStatus", render: (value) => <Status color="blue">{value}</Status> },
      ]} />
    </Card>
  </Space>;
}
