"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Descriptions, Form, Input, Select, Spin, Switch, Tag, message } from "antd";

const ROLES = ["ADMIN", "ACCOUNTANT", "DISPATCHER", "WAREHOUSE", "SALES", "DRIVER"];
type Employee = { id: string; code: string; fullName: string; email: string; phone: string; avatarUrl?: string | null; role: string; isActive: boolean; baseSalary: number; ratePerTrip: number; ratePerStop: number; ratePerKg: number; createdAt: string };

export function EmployeeEditor({ employeeId }: { employeeId: string }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/settings/employees/${employeeId}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || "Không thể tải nhân viên.");
      setEmployee(json.data); form.setFieldsValue(json.data);
    } catch (error) { message.error(error instanceof Error ? error.message : "Không thể tải nhân viên."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [employeeId]);
  const save = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/settings/employees/${employeeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || "Không thể cập nhật nhân viên.");
      message.success("Đã cập nhật tài khoản và ghi nhật ký kiểm toán.");
      setEmployee(json.data); form.setFieldsValue(json.data);
    } catch (error) { message.error(error instanceof Error ? error.message : "Không thể cập nhật nhân viên."); }
    finally { setSaving(false); }
  };
  if (loading) return <Card><Spin /></Card>;
  if (!employee) return <Alert type="error" message="Không tìm thấy nhân viên" />;
  return <Card>
    <Descriptions size="small" column={{ xs: 1, md: 2 }} style={{ marginBottom: 24 }}>
      <Descriptions.Item label="Mã nhân viên">{employee.code}</Descriptions.Item>
      <Descriptions.Item label="Trạng thái"><Tag color={employee.isActive ? "green" : "default"}>{employee.isActive ? "Hoạt động" : "Đã khóa"}</Tag></Descriptions.Item>
      <Descriptions.Item label="Tạo lúc">{new Date(employee.createdAt).toLocaleString("vi-VN")}</Descriptions.Item>
    </Descriptions>
    <Alert type="info" showIcon style={{ marginBottom: 18 }} message="Không thể tự thay đổi email, vai trò hoặc trạng thái hoạt động của tài khoản đang đăng nhập. Thay đổi bởi quản trị viên khác được áp dụng khi phiên đăng nhập được xác thực lại; hệ thống không cho phép khóa quản trị viên cuối cùng." />
    <Form form={form} layout="vertical" onFinish={save}>
      <Form.Item name="code" label="Mã nhân viên" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
      <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
      <Form.Item name="email" label="Google email" rules={[{ required: true, type: "email" }]}><Input type="email" /></Form.Item>
      <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
      <Form.Item name="avatarUrl" label="URL ảnh đại diện HTTPS"><Input placeholder="https://..." /></Form.Item>
      <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}><Select options={ROLES.map((value) => ({ value, label: value }))} /></Form.Item>
      <Form.Item name="isActive" label="Cho phép đăng nhập" valuePropName="checked"><Switch /></Form.Item>
      <Button type="primary" htmlType="submit" loading={saving}>Lưu thay đổi</Button>
    </Form>
  </Card>;
}
