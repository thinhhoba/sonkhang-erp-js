"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  message,
  Typography,
  Descriptions,
  Popconfirm,
} from "antd";
import {
  DollarOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  WalletOutlined,
  BankOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export default function TransactionsPage() {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    cashBalance: 0,
    bankBalance: 0,
    totalBalance: 0,
    totalReceipts: 0,
    totalPayments: 0,
    pendingCount: 0,
  });

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const [form] = Form.useForm();

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const res = await fetch(`/api/finance/transactions?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data);
        if (json.summary) setSummary(json.summary);
      }
    } catch {
      message.error("Lỗi khi tải danh sách thu chi nội bộ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, statusFilter]);

  const handleOpenCreate = (defaultType: "RECEIPT" | "PAYMENT" = "PAYMENT") => {
    form.resetFields();
    form.setFieldsValue({
      type: defaultType,
      category: defaultType === "PAYMENT" ? "FUEL_EXPENSE" : "COD_SUBMISSION",
      paymentMethod: "CASH",
      submittedByName: "Kế toán / Thủ quỹ",
      recipientOrPayer: defaultType === "PAYMENT" ? "Tài xế Tera V6" : "Khách hàng / Tài xế nộp COD",
      amount: 500000,
    });
    setCreateDrawerOpen(true);
  };

  const handleSaveTransaction = async () => {
    try {
      const values = await form.validateFields();
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (json.success) {
        message.success("Đã lập phiếu đề xuất thu/chi thành công");
        setCreateDrawerOpen(false);
        fetchTransactions();
      } else {
        message.error(json.error || "Không thể tạo phiếu");
      }
    } catch {
      // Validation error
    }
  };

  const handleApprove = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch(`/api/finance/transactions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          approvedByName: "Giám Đốc Sơn Khang",
        }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(action === "APPROVE" ? "Đã duyệt phiếu thành công" : "Đã từ chối phiếu");
        fetchTransactions();
      } else {
        message.error(json.error || "Thao tác thất bại");
      }
    } catch {
      message.error("Lỗi kết nối khi duyệt phiếu");
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "FUEL_EXPENSE":
        return "Xăng dầu xe Tera V6";
      case "VEHICLE_REPAIR":
        return "Sửa chữa / Bảo dưỡng xe";
      case "MEAL_ALLOWANCE":
        return "Cơm trưa / Tiếp khách";
      case "OFFICE_SUPPLIES":
        return "Văn phòng phẩm / Thiết bị";
      case "ADVANCE_SALARY":
        return "Tạm ứng lương nhân viên";
      case "COD_SUBMISSION":
        return "Nộp tiền mặt COD chuyến xe";
      default:
        return "Chi phí khác";
    }
  };

  const columns = [
    {
      title: "Mã phiếu",
      dataIndex: "voucherCode",
      key: "voucherCode",
      render: (v: string, r: any) => (
        <Tag color={r.type === "RECEIPT" ? "green" : "volcano"} style={{ fontWeight: "bold" }}>
          {v}
        </Tag>
      ),
    },
    {
      title: "Loại & Danh mục",
      key: "typeCategory",
      render: (_: any, r: any) => (
        <div>
          <Space>
            {r.type === "RECEIPT" ? (
              <Tag color="success" icon={<ArrowUpOutlined />}>
                Phiếu Thu
              </Tag>
            ) : (
              <Tag color="error" icon={<ArrowDownOutlined />}>
                Phiếu Chi
              </Tag>
            )}
            <Text strong>{getCategoryLabel(r.category)}</Text>
          </Space>
          {r.note && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.note}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (a: number, r: any) => (
        <Text
          strong
          style={{
            fontSize: 14,
            color: r.type === "RECEIPT" ? "#52c41a" : "#cf1322",
          }}
        >
          {r.type === "RECEIPT" ? "+" : "-"}
          {a.toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Hình thức",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (m: string) =>
        m === "CASH" ? (
          <Tag icon={<WalletOutlined />} color="cyan">
            Tiền mặt
          </Tag>
        ) : (
          <Tag icon={<BankOutlined />} color="purple">
            Ngân hàng
          </Tag>
        ),
    },
    {
      title: "Người nhận / nộp",
      dataIndex: "recipientOrPayer",
      key: "recipientOrPayer",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (st: string) => {
        if (st === "APPROVED") return <Tag color="success">Đã duyệt</Tag>;
        if (st === "REJECTED") return <Tag color="error">Đã từ chối</Tag>;
        return <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ duyệt</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, r: any) => (
        <Space>
          {r.status === "PENDING" && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                style={{ backgroundColor: "#52c41a" }}
                onClick={() => handleApprove(r.id, "APPROVE")}
              >
                Duyệt
              </Button>
              <Popconfirm
                title="Từ chối phiếu này?"
                onConfirm={() => handleApprove(r.id, "REJECT")}
              >
                <Button size="small" danger icon={<CloseOutlined />}>
                  Từ chối
                </Button>
              </Popconfirm>
            </>
          )}
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedTx(r);
              setDetailDrawerOpen(true);
            }}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Quản Lý Thu - Chi Nội Bộ & Quỹ Tiền Mặt (Cash Fund)
          </Title>
          <Text type="secondary">
            Kiểm soát dòng tiền quỹ két sắt, chi phí xăng xe Tera V6, tạm ứng lương và nộp tiền COD
          </Text>
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              style={{ backgroundColor: "#52c41a" }}
              icon={<PlusOutlined />}
              onClick={() => handleOpenCreate("RECEIPT")}
            >
              Lập Phiếu Thu (PT)
            </Button>
            <Button
              type="primary"
              danger
              icon={<PlusOutlined />}
              onClick={() => handleOpenCreate("PAYMENT")}
            >
              Lập Phiếu Chi (PC)
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 4 Standard Summary Cards (Modern SaaS Architecture) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
            }}
            bodyStyle={{ padding: "18px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <WalletOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Quỹ Tiền Mặt (Két Sắt)
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#2563eb", marginTop: 2 }}>
                  {summary.cashBalance.toLocaleString("vi-VN")} đ
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                  Sẵn sàng chi vận hành
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
            }}
            bodyStyle={{ padding: "18px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: "#f5f3ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#8b5cf6",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <BankOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Tiền Gửi Ngân Hàng
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#8b5cf6", marginTop: 2 }}>
                  {summary.bankBalance.toLocaleString("vi-VN")} đ
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
                  Tài khoản công ty BIDV
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
            }}
            bodyStyle={{ padding: "18px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#dc2626",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <ArrowDownOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Tổng Đã Chi Trong Kỳ
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626", marginTop: 2 }}>
                  {summary.totalPayments.toLocaleString("vi-VN")} đ
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
                  Xăng xe, bốc xếp, lương
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
            }}
            bodyStyle={{ padding: "18px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: "#fffbeb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f59e0b",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <ClockCircleOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Phiếu Đang Chờ Duyệt
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b", marginTop: 2 }}>
                  {summary.pendingCount} phiếu
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: summary.pendingCount > 0 ? "#f59e0b" : "#16a34a" }}>
                  {summary.pendingCount > 0 ? "Cần Giám Đốc duyệt" : "Đã duyệt toàn bộ"}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filter Bar */}
      <Card
        bordered={false}
        style={{ marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <div>
                <Text style={{ marginRight: 8 }}>Loại phiếu:</Text>
                <Radio.Group
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="ALL">Tất cả</Radio.Button>
                  <Radio.Button value="PAYMENT">Phiếu Chi</Radio.Button>
                  <Radio.Button value="RECEIPT">Phiếu Thu</Radio.Button>
                </Radio.Group>
              </div>

              <div>
                <Text style={{ marginRight: 8 }}>Trạng thái:</Text>
                <Radio.Group
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="ALL">Tất cả</Radio.Button>
                  <Radio.Button value="PENDING">Chờ duyệt</Radio.Button>
                  <Radio.Button value="APPROVED">Đã duyệt</Radio.Button>
                  <Radio.Button value="REJECTED">Đã từ chối</Radio.Button>
                </Radio.Group>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      {/* Drawer Create Voucher */}
      <Drawer
        title="Lập Phiếu Thu / Chi Nội Bộ"
        width={560}
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setCreateDrawerOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleSaveTransaction}>
              Gửi Duyệt Phiếu
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Loại chứng từ" name="type" rules={[{ required: true }]}>
                <Select>
                  <Option value="PAYMENT">Phiếu Chi (PC)</Option>
                  <Option value="RECEIPT">Phiếu Thu (PT)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Hình thức thanh toán" name="paymentMethod" rules={[{ required: true }]}>
                <Select>
                  <Option value="CASH">Tiền mặt (Két sắt)</Option>
                  <Option value="BANK_TRANSFER">Chuyển khoản Ngân hàng</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Danh mục nghiệp vụ" name="category" rules={[{ required: true }]}>
                <Select>
                  <Option value="FUEL_EXPENSE">Xăng dầu xe Tera V6</Option>
                  <Option value="VEHICLE_REPAIR">Sửa chữa / Bảo dưỡng xe</Option>
                  <Option value="MEAL_ALLOWANCE">Cơm trưa / Tiếp khách</Option>
                  <Option value="OFFICE_SUPPLIES">Văn phòng phẩm / Thiết bị</Option>
                  <Option value="ADVANCE_SALARY">Tạm ứng lương</Option>
                  <Option value="COD_SUBMISSION">Nộp tiền COD chuyến xe</Option>
                  <Option value="OTHER">Khoản thu/chi khác</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Số tiền (VNĐ)"
                name="amount"
                rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, "") || 0) as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Người nhận / Người nộp tiền"
                name="recipientOrPayer"
                rules={[{ required: true }]}
              >
                <Input placeholder="Tên tài xế / NCC / Nhân viên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Người lập phiếu" name="submittedByName">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Lý do & Diễn giải chi tiết" name="note">
            <Input.TextArea rows={3} placeholder="VD: Đổ 45 lít dầu Diesel cho xe Tera V6 51D-998.24 chuyến sáng" />
          </Form.Item>

          <Form.Item label="Link hóa đơn / Bill đính kèm" name="attachmentUrl">
            <Input placeholder="https://... URL ảnh chụp bill xăng / hóa đơn" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Drawer Detail */}
      <Drawer
        title="Chi Tiết Phiếu Thu / Chi"
        width={560}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
      >
        {selectedTx && (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Mã phiếu">
              <Tag color={selectedTx.type === "RECEIPT" ? "green" : "volcano"}>
                {selectedTx.voucherCode}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Loại giao dịch">
              {selectedTx.type === "RECEIPT" ? "Phiếu Thu (+)" : "Phiếu Chi (-)"}
            </Descriptions.Item>
            <Descriptions.Item label="Danh mục">
              <Text strong>{getCategoryLabel(selectedTx.category)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              <Text strong style={{ fontSize: 16, color: selectedTx.type === "RECEIPT" ? "#52c41a" : "#cf1322" }}>
                {selectedTx.amount?.toLocaleString("vi-VN")} đ
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức">
              {selectedTx.paymentMethod === "CASH" ? "Tiền mặt" : "Chuyển khoản"}
            </Descriptions.Item>
            <Descriptions.Item label="Đối tượng">
              {selectedTx.recipientOrPayer}
            </Descriptions.Item>
            <Descriptions.Item label="Người lập phiếu">
              {selectedTx.submittedByName} ({dayjs(selectedTx.transactionDate).format("DD/MM/YYYY HH:mm")})
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái duyệt">
              <Tag color={selectedTx.status === "APPROVED" ? "success" : selectedTx.status === "REJECTED" ? "error" : "warning"}>
                {selectedTx.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Người duyệt">
              {selectedTx.approvedByName || "Chưa duyệt"} {selectedTx.approvedAt && `(${dayjs(selectedTx.approvedAt).format("DD/MM/YYYY HH:mm")})`}
            </Descriptions.Item>
            <Descriptions.Item label="Nội dung">
              {selectedTx.note || "---"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
