"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag, message } from "antd";
import type { TableColumnsType } from "antd";

type Employee = { id: string; code: string; fullName: string; email: string; phone: string; role: string; isActive: boolean; createdAt: string };
const ROLES = ["ADMIN", "ACCOUNTANT", "DISPATCHER", "WAREHOUSE", "SALES", "DRIVER"];
const roleColor: Record<string, string> = { ADMIN: "purple", ACCOUNTANT: "cyan", DISPATCHER: "blue", WAREHOUSE: "gold", SALES: "green", DRIVER: "default" };

export function EmployeeDirectory() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "100" });
      if (query.trim()) params.set("q", query.trim());
      if (role !== "ALL") params.set("role", role);
      const response = await fetch(`/api/settings/employees?${params}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || "Không thể tải nhân viên.");
      setRows(json.data);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể tải nhân viên.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [role]);

  const createEmployee = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || "Không thể tạo nhân viên.");
      message.success("Đã tạo tài khoản whitelist.");
      setOpen(false); form.resetFields(); void load();
    } catch (error) { message.error(error instanceof Error ? error.message : "Không thể tạo nhân viên."); }
    finally { setSaving(false); }
  };

  const columns: TableColumnsType<Employee> = [
    { title: "Mã", dataIndex: "code", width: 130 },
    { title: "Nhân viên", render: (_, row) => <Space direction="vertical" size={0}><Link href={`/settings/users/${row.id}`}>{row.fullName}</Link><span style={{ color: "#64748b", fontSize: 12 }}>{row.email}</span></Space> },
    { title: "Vai trò", dataIndex: "role", width: 140, render: (value) => <Tag color={roleColor[value]}>{value}</Tag> },
    { title: "Trạng thái", dataIndex: "isActive", width: 128, render: (value) => value ? <Tag color="green">Hoạt động</Tag> : <Tag>Đã khóa</Tag> },
    { title: "", width: 95, render: (_, row) => <Link href={`/settings/users/${row.id}`}><Button size="small">Chi tiết</Button></Link> },
  ];

  return <>
    <Card>
      <Space wrap style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
        <Space wrap>
          <Input.Search value={query} onChange={(event) => setQuery(event.target.value)} onSearch={() => void load()} placeholder="Tìm mã, tên hoặc email" allowClear style={{ width: 260 }} />
          <Select value={role} onChange={setRole} style={{ width: 150 }} options={[{ value: "ALL", label: "Mọi vai trò" }, ...ROLES.map((value) => ({ value, label: value }))]} />
        </Space>
        <Button type="primary" onClick={() => setOpen(true)}>Thêm nhân viên</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} size="middle" pagination={{ pageSize: 20, showSizeChanger: false }} locale={{ emptyText: "Chưa có nhân viên phù hợp" }} />
    </Card>
    <Modal title="Thêm tài khoản nhân viên" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={saving} okText="Tạo tài khoản" destroyOnClose>
      <Form form={form} layout="vertical" onFinish={createEmployee} initialValues={{ role: "DRIVER", isActive: true }}>
        <Form.Item name="code" label="Mã nhân viên" rules={[{ required: true, whitespace: true }]}><Input placeholder="VD: SK-001" /></Form.Item>
        <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
        <Form.Item name="email" label="Google email" rules={[{ required: true, type: "email" }]}><Input type="email" /></Form.Item>
        <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
        <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}><Select options={ROLES.map((value) => ({ value, label: value }))} /></Form.Item>
        <Form.Item name="isActive" label="Cho phép đăng nhập" valuePropName="checked"><Switch /></Form.Item>
      </Form>
    </Modal>
  </>;
}
