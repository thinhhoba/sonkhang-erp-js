"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space, Spin, Typography, message } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;

export function PurchaseOrderEditor({ purchaseOrderId }: { purchaseOrderId?: string }) {
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState<any[]>([]); const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(Boolean(purchaseOrderId)); const [saving, setSaving] = useState(false); const [status, setStatus] = useState("DRAFT");
  const [error, setError] = useState<string>();
  const [canWrite, setCanWrite] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then((response) => response.json()).then(async (session) => {
      const writable = ["ADMIN", "ACCOUNTANT"].includes(session?.user?.role); setCanWrite(writable);
      if (!purchaseOrderId && !writable) throw new Error("Bạn chỉ có quyền xem PO, không có quyền tạo mới");
      const [supplierResult, productResult] = await Promise.all([
        fetch("/api/procurement/suppliers").then((response) => response.json()),
        writable ? fetch("/api/inventory/products").then((response) => response.json()) : Promise.resolve({ success: true, data: [] }),
      ]);
      if (!supplierResult.success || !productResult.success) throw new Error(supplierResult.error || productResult.error || "Không tải được danh mục");
      setSuppliers(supplierResult.data); setProducts(productResult.data);
    }).catch((e) => setError(e.message));
    if (purchaseOrderId) fetch(`/api/procurement/orders/${encodeURIComponent(purchaseOrderId)}`).then((r) => r.json()).then((result) => {
      if (!result.success) throw new Error(result.error);
      setStatus(result.data.status);
      form.setFieldsValue({ supplierId: result.data.supplierId, paymentTerms: result.data.paymentTerms, note: result.data.note,
        vatRate: result.data.totalAmount > 0 ? Math.round((result.data.vatAmount * 100) / result.data.totalAmount) : 0,
        expectedDeliveryDate: result.data.expectedDeliveryDate ? dayjs(result.data.expectedDeliveryDate) : undefined,
        items: result.data.items.map((item: any) => ({ productId: item.productId, orderedQty: item.orderedQty, unitPrice: item.unitPrice, note: item.note })) });
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [form, purchaseOrderId]);

  const save = async (values: any) => {
    setSaving(true);
    try {
      const response = await fetch(purchaseOrderId ? `/api/procurement/orders/${purchaseOrderId}` : "/api/procurement/orders", {
        method: purchaseOrderId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, expectedDeliveryDate: values.expectedDeliveryDate?.toISOString() }),
      });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Không lưu được PO");
      message.success(purchaseOrderId ? "Đã cập nhật PO nháp" : `Đã tạo ${result.data.poCode}`);
      if (!purchaseOrderId) window.location.assign(`/purchasing/purchase-orders/${result.data.id}`);
    } catch (e: any) { message.error(e.message); } finally { setSaving(false); }
  };

  if (loading) return <Spin />;
  return <main><Link href="/purchasing/purchase-orders">← Danh sách PO</Link><Title level={2}>{purchaseOrderId ? "Chi tiết / sửa PO" : "Tạo đơn mua hàng"}</Title>
    {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
    {purchaseOrderId && status !== "DRAFT" && <Alert type="info" showIcon message={`PO đang ở trạng thái ${status}`} description="Chỉ PO nháp mới được sửa. Thông tin dưới đây được hiển thị chỉ đọc." style={{ marginBottom: 16 }} />}
    <Card><Form form={form} layout="vertical" onFinish={save} initialValues={{ paymentTerms: "NET30", vatRate: 8, items: [{ orderedQty: 1, unitPrice: 0 }] }} disabled={!canWrite || Boolean(purchaseOrderId && status !== "DRAFT")}>
      <Row gutter={16}><Col xs={24} md={12}><Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={suppliers.map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` }))} /></Form.Item></Col>
      <Col xs={24} md={6}><Form.Item name="paymentTerms" label="Thanh toán"><Select options={["IMMEDIATE", "NET15", "NET30", "NET45", "NET60"].map((value) => ({ value }))} /></Form.Item></Col>
      <Col xs={24} md={6}><Form.Item name="expectedDeliveryDate" label="Ngày giao dự kiến"><DatePicker style={{ width: "100%" }} /></Form.Item></Col></Row>
      <Form.List name="items">{(fields, { add, remove }) => <Space direction="vertical" style={{ width: "100%" }}>{fields.map(({ key, name, ...rest }) => <Row key={key} gutter={8} align="middle"><Col xs={24} md={10}><Form.Item {...rest} name={[name, "productId"]} rules={[{ required: true }]}><Select placeholder="Sản phẩm" showSearch optionFilterProp="label" options={products.map((p) => ({ value: p.id, label: `${p.sku} · ${p.name}` }))} /></Form.Item></Col><Col xs={10} md={4}><Form.Item {...rest} name={[name, "orderedQty"]} rules={[{ required: true }]}><InputNumber min={1} precision={0} placeholder="SL" style={{ width: "100%" }} /></Form.Item></Col><Col xs={12} md={6}><Form.Item {...rest} name={[name, "unitPrice"]} rules={[{ required: true }]}><InputNumber min={0} precision={0} placeholder="Đơn giá VND" style={{ width: "100%" }} /></Form.Item></Col><Col xs={2}><Button danger type="text" icon={<MinusCircleOutlined />} onClick={() => remove(name)} /></Col></Row>)}<Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ orderedQty: 1, unitPrice: 0 })}>Thêm dòng</Button></Space>}</Form.List>
      <Form.Item name="vatRate" label="VAT (%)" style={{ marginTop: 16 }}><InputNumber min={0} max={100} precision={0} /></Form.Item><Form.Item name="note" label="Ghi chú"><Input.TextArea rows={3} /></Form.Item>
      {canWrite && (!purchaseOrderId || status === "DRAFT") && <Button htmlType="submit" type="primary" loading={saving}>{purchaseOrderId ? "Lưu bản nháp" : "Tạo PO"}</Button>}
    </Form></Card></main>;
}
