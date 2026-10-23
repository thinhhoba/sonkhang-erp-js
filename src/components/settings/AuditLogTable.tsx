"use client";

import { useEffect, useState } from "react";
import { Card, Input, Space, Table, Tag, message } from "antd";
import type { TableColumnsType } from "antd";

type AuditLog = { id: string; action: string; targetId: string; note?: string | null; createdAt: string; employee: { code: string; fullName: string; role: string } };

export function AuditLogTable() {
  const [rows, setRows] = useState<AuditLog[]>([]); const [loading, setLoading] = useState(true); const [action, setAction] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "100" }); if (action.trim()) params.set("action", action.trim());
      const response = await fetch(`/api/settings/audit-logs?${params}`, { cache: "no-store" }); const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || "Không thể tải nhật ký."); setRows(json.data);
    } catch (error) { message.error(error instanceof Error ? error.message : "Không thể tải nhật ký."); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const columns: TableColumnsType<AuditLog> = [
    { title: "Thời điểm", dataIndex: "createdAt", width: 180, render: (v) => new Date(v).toLocaleString("vi-VN") },
    { title: "Người thực hiện", width: 180, render: (_, row) => <Space direction="vertical" size={0}><span>{row.employee.fullName}</span><span style={{ color: "#64748b", fontSize: 12 }}>{row.employee.code}</span></Space> },
    { title: "Hành động", dataIndex: "action", width: 180, render: (value) => <Tag color="blue">{value}</Tag> },
    { title: "Mục tiêu", dataIndex: "targetId", width: 170, ellipsis: true },
    { title: "Ghi chú", dataIndex: "note", render: (value) => value || "—" },
  ];
  return <Card><Space style={{ marginBottom: 16 }}><Input.Search value={action} onChange={(event) => setAction(event.target.value)} onSearch={() => void load()} allowClear placeholder="Lọc theo mã hành động" style={{ width: 280 }} /></Space><Table rowKey="id" size="middle" columns={columns} dataSource={rows} loading={loading} pagination={{ pageSize: 25 }} /></Card>;
}
