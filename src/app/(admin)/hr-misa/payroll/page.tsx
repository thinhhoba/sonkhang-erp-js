"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  DatePicker,
  Typography,
  message,
  Drawer,
  Form,
  InputNumber,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Divider,
} from "antd";
import {
  DollarCircleOutlined,
  SyncOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  EditOutlined,
  LockOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

const { Title, Text } = Typography;

interface MonthlyPayrollRecord {
  id: string;
  monthYear: string;
  totalWorkDays: number;
  baseSalaryEarned: number;
  totalTripsCount: number;
  totalStopsCount: number;
  totalDeliveredKg: number;
  totalTripSalary: number;
  allowanceAmount: number;
  bonusAmount: number;
  advanceDeducted: number;
  penaltyDeducted: number;
  netSalary: number;
  status: "DRAFT" | "CONFIRMED" | "PAID";
  employee: {
    id: string;
    code: string;
    fullName: string;
    phone: string;
    role: string;
    baseSalary: number;
  };
}

export default function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [payrolls, setPayrolls] = useState<MonthlyPayrollRecord[]>([]);

  // State Drawer điều chỉnh phụ cấp / phạt / tạm ứng
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MonthlyPayrollRecord | null>(null);
  const [form] = Form.useForm();

  const monthYearString = selectedMonth.format("YYYY-MM");

  // 1. Tải bảng lương của tháng đang chọn
  const loadPayrollData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/payroll?monthYear=${monthYearString}`);
      const data = await res.json();
      setPayrolls(data.data || []);
    } catch (err: any) {
      message.error("Lỗi khi tải bảng lương: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollData();
  }, [selectedMonth]);

  // 2. Chạy quét tính toán tự động toàn bộ nhân sự trong tháng
  const handleRecalculateAll = async () => {
    setCalculating(true);
    try {
      const res = await fetch("/api/hr/payroll/calculate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthYear: monthYearString }),
      });

      if (!res.ok) throw new Error("Tính toán bảng lương thất bại");

      message.success(`Đã quét xong chuyến xe và ngày công tháng ${monthYearString}!`);
      loadPayrollData();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setCalculating(false);
    }
  };

  // 3. Mở Drawer điều chỉnh các khoản phát sinh
  const handleOpenEditDrawer = (record: MonthlyPayrollRecord) => {
    setSelectedRecord(record);
    form.setFieldsValue({
      allowanceAmount: record.allowanceAmount,
      bonusAmount: record.bonusAmount,
      advanceDeducted: record.advanceDeducted,
      penaltyDeducted: record.penaltyDeducted,
    });
    setEditDrawerOpen(true);
  };

  // 4. Lưu các khoản phát sinh
  const handleSaveAdjustments = async (values: any) => {
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/hr/payroll/${selectedRecord.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Cập nhật phụ cấp/phạt thất bại");

      message.success("Đã cập nhật các khoản phụ cấp và khấu trừ!");
      setEditDrawerOpen(false);
      loadPayrollData();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Chốt bảng lương tháng (Khóa số liệu)
  const handleConfirmPayroll = async (id: string) => {
    try {
      const res = await fetch(`/api/hr/payroll/${id}/confirm`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Chốt lương thất bại");
      message.success("Đã chốt bảng lương! Số liệu được đóng băng.");
      loadPayrollData();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  // 6. Xuất file đẩy sang phần mềm MISA Kế toán (Lương)
  const handleExportMisaExcel = () => {
    window.open(`/api/hr/payroll/export-misa?monthYear=${monthYearString}`, "_blank");
  };

  // 7. Xuất file Chứng từ bán hàng kiêm xuất kho sang MISA
  const handleExportSalesMisaExcel = () => {
    window.open(`/api/hr/payroll/export-sales-misa?monthYear=${monthYearString}`, "_blank");
  };

  // Tính các con số tổng hợp trên thanh Header
  const totalNetSalary = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const totalTrips = payrolls.reduce((sum, p) => sum + p.totalTripsCount, 0);
  const totalDeliveredKg = payrolls.reduce((sum, p) => sum + p.totalDeliveredKg, 0);

  const columns = [
    {
      title: "Mã / Nhân viên",
      key: "employee",
      width: 170,
      render: (_: any, r: MonthlyPayrollRecord) => (
        <div>
          <Text strong>{r.employee?.fullName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            [{r.employee?.code}] - {r.employee?.role}
          </Text>
        </div>
      ),
    },
    {
      title: "Ngày công",
      dataIndex: "totalWorkDays",
      key: "totalWorkDays",
      width: 90,
      align: "center" as const,
      render: (v: number) => <Tag color="blue">{v} công</Tag>,
    },
    {
      title: "Năng suất Giao hàng (Tera V6)",
      key: "deliveryStats",
      width: 220,
      render: (_: any, r: MonthlyPayrollRecord) => (
        <div>
          <Text style={{ fontSize: 13 }}>
            Chuyến: <strong>{r.totalTripsCount}</strong> | Điểm giao: <strong>{r.totalStopsCount}</strong>
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Sản lượng: <strong style={{ color: "#1677ff" }}>{r.totalDeliveredKg.toLocaleString("vi-VN")} kg</strong>
          </Text>
        </div>
      ),
    },
    {
      title: "Lương Chuyến (30k/5k/250đ)",
      dataIndex: "totalTripSalary",
      key: "totalTripSalary",
      align: "right" as const,
      render: (v: number) => (
        <Text strong style={{ color: "#389e0d" }}>
          +{v.toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Lương Cơ bản",
      dataIndex: "baseSalaryEarned",
      key: "baseSalaryEarned",
      align: "right" as const,
      render: (v: number) => `${v.toLocaleString("vi-VN")} đ`,
    },
    {
      title: "Phụ cấp / Thưởng",
      key: "bonus",
      align: "right" as const,
      render: (_: any, r: MonthlyPayrollRecord) => {
        const bonusTotal = r.allowanceAmount + r.bonusAmount;
        return (
          <Text style={{ color: bonusTotal > 0 ? "#1677ff" : undefined }}>
            {bonusTotal > 0 ? `+${bonusTotal.toLocaleString("vi-VN")} đ` : "0 đ"}
          </Text>
        );
      },
    },
    {
      title: "Tạm ứng / Phạt",
      key: "deductions",
      align: "right" as const,
      render: (_: any, r: MonthlyPayrollRecord) => {
        const deductionTotal = r.advanceDeducted + r.penaltyDeducted;
        return (
          <Text style={{ color: deductionTotal > 0 ? "#cf1322" : undefined }}>
            {deductionTotal > 0 ? `-${deductionTotal.toLocaleString("vi-VN")} đ` : "0 đ"}
          </Text>
        );
      },
    },
    {
      title: "THỰC LĨNH",
      dataIndex: "netSalary",
      key: "netSalary",
      align: "right" as const,
      width: 140,
      render: (v: number) => (
        <Text strong style={{ fontSize: 15, color: "#cf1322" }}>
          {v.toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (st: string) => {
        switch (st) {
          case "DRAFT":
            return <Tag color="default">Bản nháp</Tag>;
          case "CONFIRMED":
            return (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Đã chốt
              </Tag>
            );
          case "PAID":
            return <Tag color="purple">Đã chi</Tag>;
          default:
            return <Tag>{st}</Tag>;
        }
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_: any, r: MonthlyPayrollRecord) => {
        const isLocked = r.status === "CONFIRMED" || r.status === "PAID";

        return (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              disabled={isLocked}
              onClick={() => handleOpenEditDrawer(r)}
            />
            {!isLocked ? (
              <Popconfirm
                title="Xác nhận chốt phiếu lương này?"
                description="Sau khi chốt, số liệu sẽ được khóa để xuất sang phần mềm MISA."
                onConfirm={() => handleConfirmPayroll(r.id)}
                okText="Chốt lương"
                cancelText="Hủy"
              >
                <Button size="small" type="primary" icon={<LockOutlined />}>
                  Chốt
                </Button>
              </Popconfirm>
            ) : (
              <Button size="small" icon={<PrinterOutlined />}>
                In
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* KHỐI TỔNG QUAN CHỈ SỐ */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Space direction="vertical" size={2}>
              <Text type="secondary">Kỳ tính lương:</Text>
              <DatePicker
                picker="month"
                allowClear={false}
                value={selectedMonth}
                onChange={(val) => val && setSelectedMonth(val)}
                format="MM/YYYY"
                style={{ width: 140 }}
              />
            </Space>
          </Col>
          <Col span={6}>
            <Statistic
              title="Tổng số chuyến Tera V6"
              value={totalTrips}
              suffix="chuyến"
              valueStyle={{ color: "#1677ff" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Tổng khối lượng đã giao"
              value={totalDeliveredKg}
              precision={1}
              suffix="kg"
              valueStyle={{ color: "#3f8600" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Tổng quỹ lương thực lĩnh"
              value={totalNetSalary}
              suffix="đ"
              formatter={(val) => Number(val).toLocaleString("vi-VN")}
              valueStyle={{ color: "#cf1322", fontWeight: "bold" }}
            />
          </Col>
        </Row>
      </Card>

      {/* DANH SÁCH BẢNG LƯƠNG NHÂN SỰ */}
      <Card
        title={
          <Space>
            <DollarCircleOutlined style={{ fontSize: 22, color: "#1677ff" }} />
            <span>Bảng Lương Tháng {monthYearString} (Sơn Khang Operations)</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<SyncOutlined />}
              onClick={handleRecalculateAll}
              loading={calculating}
            >
              Quét lại Chuyến & Ngày công
            </Button>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              style={{ backgroundColor: "#217346" }}
              onClick={handleExportMisaExcel}
            >
              Xuất Excel Lương MISA
            </Button>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              style={{ backgroundColor: "#004b87" }}
              onClick={handleExportSalesMisaExcel}
            >
              Xuất Excel Bán hàng MISA
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={payrolls}
          loading={loading}
          size="small"
          bordered
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* DRAWER ĐIỀU CHỈNH PHỤ CẤP, THƯỞNG, PHẠT VÀ TẠM ỨNG */}
      <Drawer
        title={`Điều chỉnh thu nhập: ${selectedRecord?.employee.fullName} (${monthYearString})`}
        width={520}
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setEditDrawerOpen(false)}>
              Hủy
            </Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={() => form.submit()}
            >
              Lưu điều chỉnh
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSaveAdjustments}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="allowanceAmount"
                label="Phụ cấp (Ăn trưa, xăng xe, điện thoại)"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bonusAmount" label="Thưởng nóng / Chuyên cần">
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "8px 0" }} />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="advanceDeducted"
                label="Trừ tạm ứng lương giữa tháng"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="penaltyDeducted"
                label="Trừ phạt (Làm vỡ/hỏng hàng, vi phạm)"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  );
}