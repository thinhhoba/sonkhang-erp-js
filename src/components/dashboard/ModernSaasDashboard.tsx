"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Button,
  Radio,
  Table,
  Progress,
  Avatar,
  Badge,
  Alert,
  Tooltip,
} from "antd";
import {
  DollarOutlined,
  ShoppingOutlined,
  InboxOutlined,
  CarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  RightOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  SyncOutlined,
  ExclamationCircleFilled,
  RiseOutlined,
  CrownOutlined,
  AccountBookOutlined,
  ShopOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const { Title, Text, Paragraph } = Typography;

export default function ModernSaasDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [activeRole, setActiveRole] = useState<string>(roleParam || "CEO");
  const [period, setPeriod] = useState<"7d" | "30d" | "6m">("30d");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({
    totalRevenue: 0,
    totalArDebt: 0,
    cashFund: 0,
    bankFund: 0,
    totalFund: 0,
    totalInventoryValue: 0,
    ordersCount: 0,
    waitingOrdersCount: 0,
    overCreditCount: 0,
    lowStockCount: 0,
    returnsCount: 0,
    tripsCount: 0,
    vehiclesCount: 0,
    pendingOrdersApproval: [],
    pendingExpenses: [],
    waitingSettleTrips: [],
    recentTrips: [],
    vehicles: [],
  });

  useEffect(() => {
    if (roleParam) {
      setActiveRole(roleParam);
    }
  }, [roleParam]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/stats");
      const json = await res.json();
      if (json.success && json.data) {
        setStats((prev: any) => ({ ...prev, ...json.data }));
      }
    } catch {
      // Use fallback defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 1. DATA FOR TIME-SERIES CHART (Revenue & Weight in Kg)
  const chartData = useMemo(() => {
    if (period === "7d") {
      return [
        { label: "T2", rev: 125, kg: 3800 },
        { label: "T3", rev: 168, kg: 4900 },
        { label: "T4", rev: 145, kg: 4200 },
        { label: "T5", rev: 210, kg: 6100 },
        { label: "T6", rev: 285, kg: 7800 },
        { label: "T7", rev: 320, kg: 8900 },
        { label: "CN", rev: 195, kg: 5400 },
      ];
    }
    if (period === "30d") {
      return [
        { label: "Tuần 1", rev: 620, kg: 18200 },
        { label: "Tuần 2", rev: 710, kg: 21500 },
        { label: "Tuần 3", rev: 680, kg: 19800 },
        { label: "Tuần 4", rev: 835, kg: 24600 },
      ];
    }
    return [
      { label: "T5/26", rev: 2200, kg: 68000 },
      { label: "T6/26", rev: 2450, kg: 74000 },
      { label: "T7/26", rev: 2680, kg: 81000 },
      { label: "T8/26", rev: 2510, kg: 76000 },
      { label: "T9/26", rev: 2790, kg: 85000 },
      { label: "T10/26", rev: 2845, kg: 88500 },
    ];
  }, [period]);

  // SVG Area/Line Chart Calculations
  const chartWidth = 640;
  const chartHeight = 220;
  const paddingX = 45;
  const paddingY = 30;

  const maxRev = Math.max(...chartData.map((d) => d.rev)) * 1.15;
  const minRev = 0;

  const getCoordinates = (index: number, value: number) => {
    const x =
      paddingX +
      (index / (chartData.length - 1)) * (chartWidth - paddingX * 2);
    const y =
      chartHeight -
      paddingY -
      ((value - minRev) / (maxRev - minRev)) * (chartHeight - paddingY * 2);
    return { x, y };
  };

  const linePath = useMemo(() => {
    return chartData
      .map((d, i) => {
        const { x, y } = getCoordinates(i, d.rev);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [chartData]);

  const areaPath = useMemo(() => {
    const firstPoint = getCoordinates(0, chartData[0].rev);
    const lastPoint = getCoordinates(
      chartData.length - 1,
      chartData[chartData.length - 1].rev
    );
    const bottomY = chartHeight - paddingY;
    return `${linePath} L ${lastPoint.x} ${bottomY} L ${firstPoint.x} ${bottomY} Z`;
  }, [chartData, linePath]);

  // 2. DONUT CHART (Order Status Breakdown)
  const orderBreakdown = [
    { label: "Đã giao thành công", count: 832, percent: 65, color: "#10b981" },
    { label: "Đang trên xe giao", count: 256, percent: 20, color: "#2563eb" },
    { label: "Chờ xếp xe Tera", count: 154, percent: 12, color: "#f59e0b" },
    { label: "Đổi trả / Hoàn hàng", count: 38, percent: 3, color: "#ef4444" },
  ];
  const totalOrdersSum = 1280;

  // 3. RECENT ORDERS TABLE DATA
  const recentOrdersData = [
    {
      key: "1",
      orderCode: "SONKHANG-88921",
      customer: "Đại lý Bách Hóa Xanh (Bình Chánh)",
      weightKg: 345.5,
      codAmount: 18450000,
      status: "DELIVERED",
      statusLabel: "Đã giao",
      statusColor: "success",
      time: "08:15 Sáng nay",
    },
    {
      key: "2",
      orderCode: "SONKHANG-88922",
      customer: "Nhà hàng Lẩu Nướng King BBQ",
      weightKg: 182.0,
      codAmount: 9200000,
      status: "IN_TRANSIT",
      statusLabel: "Đang trên xe",
      statusColor: "processing",
      time: "08:30 Sáng nay",
    },
    {
      key: "3",
      orderCode: "SONKHANG-88923",
      customer: "Cửa hàng Tiện lợi GS25 (Quận 7)",
      weightKg: 85.0,
      codAmount: 4650000,
      status: "WAITING_DISPATCH",
      statusLabel: "Chờ xếp xe",
      statusColor: "warning",
      time: "09:05 Sáng nay",
    },
    {
      key: "4",
      orderCode: "SONKHANG-88924",
      customer: "Tạp hóa Cô Mai (Tân Phú)",
      weightKg: 120.0,
      codAmount: 6100000,
      status: "WAITING_DISPATCH",
      statusLabel: "Chờ xếp xe",
      statusColor: "warning",
      time: "09:20 Sáng nay",
    },
    {
      key: "5",
      orderCode: "SONKHANG-88920",
      customer: "Bếp ăn Công nghiệp Tân Bình",
      weightKg: 420.0,
      codAmount: 22800000,
      status: "RETURNED",
      statusLabel: "Hàng đổi trả",
      statusColor: "error",
      time: "Hôm qua",
    },
  ];

  const recentOrdersColumns = [
    {
      title: "Mã đơn hàng",
      dataIndex: "orderCode",
      key: "orderCode",
      render: (code: string) => (
        <span style={{ fontWeight: 600, color: "#1e293b", fontFamily: "monospace" }}>
          {code}
        </span>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      key: "customer",
      render: (name: string) => (
        <span style={{ fontWeight: 500, color: "#334155" }}>{name}</span>
      ),
    },
    {
      title: "Cân nặng",
      dataIndex: "weightKg",
      key: "weightKg",
      render: (kg: number) => (
        <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 500 }}>
          {kg.toLocaleString("vi-VN")} kg
        </Tag>
      ),
    },
    {
      title: "Tiền COD / Thu hộ",
      dataIndex: "codAmount",
      key: "codAmount",
      render: (amt: number) => (
        <span style={{ fontWeight: 700, color: "#0f172a" }}>
          {amt.toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (_: any, r: any) => {
        let bg = "#f1f5f9";
        let text = "#475569";
        let dot = "#94a3b8";

        if (r.status === "DELIVERED") {
          bg = "#ecfdf5";
          text = "#059669";
          dot = "#10b981";
        } else if (r.status === "IN_TRANSIT") {
          bg = "#eff6ff";
          text = "#2563eb";
          dot = "#3b82f6";
        } else if (r.status === "WAITING_DISPATCH") {
          bg = "#fffbeb";
          text = "#d97706";
          dot = "#f59e0b";
        } else if (r.status === "RETURNED") {
          bg = "#fef2f2";
          text = "#dc2626";
          dot = "#ef4444";
        }

        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: bg,
              color: text,
              padding: "3px 12px",
              borderRadius: "9999px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: dot,
              }}
            />
            {r.statusLabel}
          </span>
        );
      },
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      render: (t: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t}
        </Text>
      ),
    },
  ];

  // 4. TOP FAST-MOVING PRODUCTS
  const topProducts = [
    {
      name: "Mì Indomie Mi Goreng (Gói 85g)",
      category: "Mì ăn liền F&B",
      soldQty: "18.420 gói",
      percent: 92,
      color: "#2563eb",
      iconColor: "#eff6ff",
      iconText: "🍜",
    },
    {
      name: "Sốt Mayonnaise MEJE (Chai 1kg)",
      category: "Nước sốt & Gia vị",
      soldQty: "4.250 chai",
      percent: 74,
      color: "#10b981",
      iconColor: "#ecfdf5",
      iconText: "🥫",
    },
    {
      name: "Xúc xích Tiệt trùng C.P (Cây 40g)",
      category: "Thịt chế biến",
      soldQty: "9.800 cây",
      percent: 65,
      color: "#f59e0b",
      iconColor: "#fffbeb",
      iconText: "🌭",
    },
    {
      name: "Sốt Tương đen Ottogi (Gói 1kg)",
      category: "Nguyên liệu Hàn Quốc",
      soldQty: "2.150 gói",
      percent: 48,
      color: "#8b5cf6",
      iconColor: "#f5f3ff",
      iconText: "🍲",
    },
    {
      name: "Hạt nêm Knorr Thịt thăn (Túi 900g)",
      category: "Gia vị cao cấp",
      soldQty: "1.620 túi",
      percent: 36,
      color: "#ec4899",
      iconColor: "#fdf2f8",
      iconText: "🧂",
    },
  ];

  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto", paddingBottom: 24 }}>
      {/* Role Alert / Quick Indicator if not CEO */}
      {activeRole !== "CEO" && (
        <Alert
          message={
            <Space>
              <CrownOutlined style={{ color: "#2563eb" }} />
              <span>
                Đang xem dưới góc nhìn phân hệ: <strong>{activeRole}</strong>
              </span>
            </Space>
          }
          description="Các số liệu và cảnh báo dưới đây đã được lọc phù hợp nhất với vai trò và trách nhiệm công việc của bạn."
          type="info"
          showIcon={false}
          closable
          style={{
            marginBottom: 20,
            borderRadius: 10,
            border: "1px solid #bfdbfe",
            background: "#eff6ff",
          }}
        />
      )}

      {/* =========================================================================
          KHỐI 1: SUMMARY CARDS (Hàng đầu tiên - 4 Cột KPI chuẩn Modern SaaS)
          Bo góc 12px, shadow nhẹ 0 2px 8px rgba(0,0,0,0.04), icon vuông bo góc
          ========================================================================= */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {/* KPI 1: Tổng Doanh Thu */}
        <Col xs={24} sm={12} xl={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
              background: "#ffffff",
              height: "100%",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              {/* Icon vuông bo góc màu sắc */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                <DollarOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    fontWeight: 500,
                    display: "block",
                  }}
                >
                  Tổng Doanh Thu Đơn Hàng
                </Text>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.3,
                    marginTop: 4,
                  }}
                >
                  {(stats.totalRevenue ?? 0).toLocaleString("vi-VN")} đ
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      color: "#16a34a",
                      fontWeight: 700,
                      background: "#dcfce7",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    <ArrowUpOutlined /> 12.5%
                  </span>
                  <span style={{ color: "#94a3b8" }}>so với kỳ trước</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* KPI 2: Tổng Đơn Hàng Vận Hành */}
        <Col xs={24} sm={12} xl={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
              background: "#ffffff",
              height: "100%",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10b981",
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                <ShoppingOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    fontWeight: 500,
                    display: "block",
                  }}
                >
                  Đơn Hàng Giao Vận (Sapo)
                </Text>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.3,
                    marginTop: 4,
                  }}
                >
                  {(stats.ordersCount ?? 0).toLocaleString("vi-VN")} đơn
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      color: "#16a34a",
                      fontWeight: 700,
                      background: "#dcfce7",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    <ArrowUpOutlined /> 8.4%
                  </span>
                  <span style={{ color: "#94a3b8" }}>tỷ lệ hoàn thành 97%</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* KPI 3: Quỹ Tiền Mặt & Dòng Tiền */}
        <Col xs={24} sm={12} xl={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
              background: "#ffffff",
              height: "100%",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "#fffbeb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f59e0b",
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                <AccountBookOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    fontWeight: 500,
                    display: "block",
                  }}
                >
                  Quỹ Tiền Mặt & Ngân Hàng
                </Text>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.3,
                    marginTop: 4,
                  }}
                >
                  {(stats.totalFund ?? 0).toLocaleString("vi-VN")} đ
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      color: "#dc2626",
                      fontWeight: 700,
                      background: "#fee2e2",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    <ArrowDownOutlined /> 2.1%
                  </span>
                  <span style={{ color: "#94a3b8" }}>sau chi lương MISA</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* KPI 4: Sản Lượng Giao Vận (Kg) / Đội Xe */}
        <Col xs={24} sm={12} xl={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
              background: "#ffffff",
              height: "100%",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "#f5f3ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#8b5cf6",
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                <CarOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    fontWeight: 500,
                    display: "block",
                  }}
                >
                  Sản Lượng Giao Vận (Tera V6)
                </Text>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.3,
                    marginTop: 4,
                  }}
                >
                  88.500 kg
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      color: "#16a34a",
                      fontWeight: 700,
                      background: "#dcfce7",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    <ArrowUpOutlined /> 15.2%
                  </span>
                  <span style={{ color: "#94a3b8" }}>đạt 94% tải trọng đội xe</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* =========================================================================
          KHỐI 2: MAIN CONTENT - TẦNG 1 (Biểu Đồ Trực Quan - Chia Cột 16 / 8)
          Trái: Biểu đồ Doanh thu & Sản lượng Kg (với bộ lọc 7d / 30d / 6m)
          Phải: Biểu đồ Donut Tỷ lệ Trạng thái Đơn hàng (Tổng đơn ở chính giữa)
          ========================================================================= */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {/* CỘT TRÁI (16/24): Biểu Đồ Đường/Miền Doanh Thu & Sản Lượng Kg */}
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
              background: "#ffffff",
              height: "100%",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            {/* Header Thẻ: Tiêu đề + Bộ lọc kỳ */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <Title level={4} style={{ margin: 0, color: "#0f172a" }}>
                  Tổng quan Doanh thu & Sản lượng Giao vận (Kg)
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Theo dõi xu hướng tăng trưởng phân phối F&B và lưu lượng xe Tera V6
                </Text>
              </div>

              {/* Bộ lọc kỳ: 7 ngày / 30 ngày / 6 tháng */}
              <Radio.Group
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                size="middle"
                buttonStyle="solid"
              >
                <Radio.Button value="7d">7 Ngày</Radio.Button>
                <Radio.Button value="30d">30 Ngày</Radio.Button>
                <Radio.Button value="6m">6 Tháng</Radio.Button>
              </Radio.Group>
            </div>

            {/* Chú thích biểu đồ */}
            <div
              style={{
                display: "flex",
                gap: 20,
                alignItems: "center",
                marginBottom: 12,
                fontSize: 13,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: "#2563eb",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontWeight: 600, color: "#334155" }}>
                  Doanh Thu (Triệu VNĐ)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: "#10b981",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontWeight: 600, color: "#334155" }}>
                  Sản Lượng (Kg Hàng Hóa)
                </span>
              </div>
            </div>

            {/* SVG Interactive Area & Line Chart */}
            <div style={{ width: "100%", overflowX: "auto" }}>
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                style={{ width: "100%", height: "auto", minWidth: 480 }}
              >
                <defs>
                  {/* Linear Gradient for Smooth Area Fill */}
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                  const y =
                    paddingY + (chartHeight - paddingY * 2) * (1 - ratio);
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 8}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#94a3b8"
                      >
                        {Math.round(maxRev * ratio)}tr
                      </text>
                    </g>
                  );
                })}

                {/* Area under curve */}
                <path d={areaPath} fill="url(#revenueGradient)" />

                {/* Main Curve Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points & Value Badges */}
                {chartData.map((d, i) => {
                  const { x, y } = getCoordinates(i, d.rev);
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#ffffff"
                        stroke="#2563eb"
                        strokeWidth="2.5"
                      />
                      <circle cx={x} cy={y} r="2" fill="#2563eb" />
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                        fill="#1e293b"
                      >
                        {d.rev}tr
                      </text>
                      {/* X-axis Label */}
                      <text
                        x={x}
                        y={chartHeight - 8}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="500"
                        fill="#64748b"
                      >
                        {d.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </Card>
        </Col>

        {/* CỘT PHẢI (8/24): Biểu Đồ Donut Tỷ Lệ Trạng Thái Đơn Hàng */}
        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
              background: "#ffffff",
              height: "100%",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <div>
              <Title level={4} style={{ margin: 0, color: "#0f172a" }}>
                Tỷ lệ Trạng thái Đơn hàng
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Phân bổ {totalOrdersSum} đơn giao vận trong kỳ
              </Text>
            </div>

            {/* Donut SVG with Center Total */}
            <div
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "24px 0",
              }}
            >
              <svg width="190" height="190" viewBox="0 0 190 190">
                {/* Donut Segments using strokeDasharray:
                    Radius = 75, Circumference = 2 * PI * 75 = 471.24 */}
                <circle
                  cx="95"
                  cy="95"
                  r="75"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="24"
                />
                {/* 1. Đã giao: 65% = 306.3 */}
                <circle
                  cx="95"
                  cy="95"
                  r="75"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="24"
                  strokeDasharray="306.3 471.24"
                  strokeDashoffset="0"
                  transform="rotate(-90 95 95)"
                />
                {/* 2. Đang trên xe: 20% = 94.2 */}
                <circle
                  cx="95"
                  cy="95"
                  r="75"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="24"
                  strokeDasharray="94.2 471.24"
                  strokeDashoffset="-306.3"
                  transform="rotate(-90 95 95)"
                />
                {/* 3. Chờ xếp xe: 12% = 56.5 */}
                <circle
                  cx="95"
                  cy="95"
                  r="75"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="24"
                  strokeDasharray="56.5 471.24"
                  strokeDashoffset="-400.5"
                  transform="rotate(-90 95 95)"
                />
                {/* 4. Đổi trả / Hoàn: 3% = 14.1 */}
                <circle
                  cx="95"
                  cy="95"
                  r="75"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="24"
                  strokeDasharray="14.1 471.24"
                  strokeDashoffset="-457"
                  transform="rotate(-90 95 95)"
                />
              </svg>

              {/* Total inside circle */}
              <div
                style={{
                  position: "absolute",
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.1,
                  }}
                >
                  {totalOrdersSum.toLocaleString("vi-VN")}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                  Tổng đơn hàng
                </div>
              </div>
            </div>

            {/* Legend with percentages */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {orderBreakdown.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: item.color,
                      }}
                    />
                    <span style={{ color: "#334155", fontWeight: 500 }}>
                      {item.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "#64748b", fontSize: 12 }}>
                      {item.count} đơn
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#0f172a",
                        minWidth: 36,
                        textAlign: "right",
                      }}
                    >
                      {item.percent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* =========================================================================
          KHỐI 3: MAIN CONTENT - TẦNG 2 (Bảng & Xếp Hạng - Chia Cột 16 / 8)
          Trái (16/24): "Đơn hàng / Giao dịch Gần đây" với nút [Xem tất cả], Pill Tags
          Phải (8/24): "Top Sản phẩm Tiêu thụ Mạnh" với ảnh/icon, tên, số lượng, Progress
          ========================================================================= */}
      <Row gutter={[20, 20]}>
        {/* CỘT TRÁI (16/24): Bảng Đơn Hàng / Giao Dịch Gần Đây */}
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
              background: "#ffffff",
              height: "100%",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <Title level={4} style={{ margin: 0, color: "#0f172a" }}>
                  Đơn hàng / Giao dịch Gần đây
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Theo dõi thời gian thực các đơn Sapo và lịch trình chuyến xe Tera
                </Text>
              </div>

              {/* Nút Xem tất cả */}
              <Link href="/logistics/orders">
                <Button
                  type="primary"
                  ghost
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    borderColor: "#2563eb",
                    color: "#2563eb",
                  }}
                  icon={<RightOutlined />}
                >
                  Xem tất cả
                </Button>
              </Link>
            </div>

            <Table
              dataSource={recentOrdersData}
              columns={recentOrdersColumns}
              pagination={false}
              size="middle"
              rowClassName={() => "saas-table-row"}
            />
          </Card>
        </Col>

        {/* CỘT PHẢI (8/24): Top Sản Phẩm Tiêu Thụ Mạnh */}
        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #f1f5f9",
              background: "#ffffff",
              height: "100%",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <Title level={4} style={{ margin: 0, color: "#0f172a" }}>
                  <FireOutlined style={{ color: "#ef4444", marginRight: 6 }} />
                  Top Sản phẩm Tiêu thụ Mạnh
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Mặt hàng phân phối chạy nhất tháng
                </Text>
              </div>
              <Tag color="volcano" style={{ borderRadius: 6, fontWeight: 600 }}>
                HOT
              </Tag>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {topProducts.map((prod, idx) => (
                <div key={idx}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: prod.iconColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          flexShrink: 0,
                          border: `1px solid ${prod.color}25`,
                        }}
                      >
                        {prod.iconText}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#0f172a",
                            lineHeight: 1.3,
                          }}
                        >
                          {prod.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {prod.category}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {prod.soldQty}
                      </span>
                    </div>
                  </div>

                  {/* Thanh Progress trực quan */}
                  <Progress
                    percent={prod.percent}
                    strokeColor={prod.color}
                    size="small"
                    showInfo={false}
                    trailColor="#f1f5f9"
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
