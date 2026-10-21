"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Typography,
  message,
  Row,
  Col,
  Statistic,
  Drawer,
  Form,
  InputNumber,
  Input,
  Popconfirm,
  Badge,
  Descriptions,
  Alert,
  Divider,
} from "antd";
import {
  CheckSquareOutlined,
  PlusOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  SaveOutlined,
  DiffOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface Product {
  id: string;
  sku: string;
  name: string;
  baseUnit: string;
  currentStock: number;
  location?: {
    code: string;
    name: string;
  } | null;
}

interface StocktakeItem {
  id: string;
  productId: string;
  product: Product;
  systemQty: number;
  actualQty: number;
  differenceQty: number;
  unitCost: number;
  differenceValue: number;
  reason: string | null;
}

interface InventoryStocktake {
  id: string;
  stocktakeCode: string;
  title: string;
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  totalDifferenceQty: number;
  totalDifferenceValue: number;
  note: string | null;
  createdAt: string;
  completedAt: string | null;
  items: StocktakeItem[];
}

export default function StocktakeManagementPage() {
  const [loading, setLoading] = useState(false);
  const [stocktakes, setStocktakes] = useState<InventoryStocktake[]>([]);

  // Drawer tạo đợt kiểm kê
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createForm] = Form.useForm();

  // Drawer chi tiết kiểm đếm
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedStocktake, setSelectedStocktake] = useState<InventoryStocktake | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [countValues, setCountValues] = useState<Record<string, { actualQty: number; reason: string }>>({});
  const [savingCounts, setSavingCounts] = useState(false);
  const [completing, setCompleting] = useState(false);

  const fetchStocktakes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/stocktake");
      const data = await res.json();
      if (data.success) {
        setStocktakes(data.data || []);
      }
    } catch (err: any) {
      message.error("Lỗi tải danh sách kiểm kê: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocktakes();
  }, []);

  // Mở Drawer tạo đợt kiểm kê mới
  const handleOpenCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      title: `Kiểm kê định kỳ kho hàng tháng ${dayjs().format("MM/YYYY")}`,
    });
    setCreateDrawerOpen(true);
  };

  const handleCreateStocktake = async (values: any) => {
    setSubmittingCreate(true);
    try {
      const res = await fetch("/api/inventory/stocktake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (result.success) {
        message.success(`Đã khởi tạo đợt kiểm kê ${result.data.stocktakeCode} thành công!`);
        setCreateDrawerOpen(false);
        fetchStocktakes();
      } else {
        message.error("Lỗi: " + result.error);
      }
    } catch (err: any) {
      message.error("Lỗi hệ thống: " + err.message);
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Mở Drawer chi tiết kiểm đếm
  const handleOpenDetail = async (stocktake: InventoryStocktake) => {
    setDetailDrawerOpen(true);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/inventory/stocktake/${stocktake.id}`);
      const data = await res.json();
      if (data.success) {
        const stk = data.data;
        setSelectedStocktake(stk);

        // Khởi tạo bảng nhập số đếm
        const initialCounts: Record<string, { actualQty: number; reason: string }> = {};
        stk.items.forEach((it: StocktakeItem) => {
          initialCounts[it.productId] = {
            actualQty: it.actualQty,
            reason: it.reason || "",
          };
        });
        setCountValues(initialCounts);
      }
    } catch (err: any) {
      message.error("Lỗi tải chi tiết phiếu: " + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Lưu tạm số đếm thực tế
  const handleSaveCounts = async () => {
    if (!selectedStocktake) return;
    setSavingCounts(true);
    try {
      const itemsPayload = Object.keys(countValues).map((productId) => ({
        productId,
        actualQty: countValues[productId].actualQty,
        reason: countValues[productId].reason,
      }));

      const res = await fetch(`/api/inventory/stocktake/${selectedStocktake.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsPayload }),
      });

      const result = await res.json();
      if (result.success) {
        message.success("Đã lưu tạm số lượng kiểm đếm thực tế!");
        setSelectedStocktake(result.data);
        fetchStocktakes();
      } else {
        message.error("Lỗi lưu số đếm: " + result.error);
      }
    } catch (err: any) {
      message.error("Lỗi hệ thống: " + err.message);
    } finally {
      setSavingCounts(false);
    }
  };

  // Khóa sổ & Tự động điều chỉnh tồn kho Thẻ kho
  const handleCompleteStocktake = async () => {
    if (!selectedStocktake) return;
    setCompleting(true);
    try {
      // Lưu lại counts trước khi khóa sổ
      await handleSaveCounts();

      const res = await fetch(`/api/inventory/stocktake/${selectedStocktake.id}/complete`, {
        method: "POST",
      });

      const result = await res.json();
      if (result.success) {
        message.success(
          "Khóa sổ phiếu kiểm kê thành công! Tồn kho đã được điều chỉnh và ghi Thẻ kho (ADJUSTMENT)."
        );
        setSelectedStocktake(result.data);
        fetchStocktakes();
      } else {
        message.error("Lỗi khóa sổ: " + result.error);
      }
    } catch (err: any) {
      message.error("Lỗi hệ thống: " + err.message);
    } finally {
      setCompleting(false);
    }
  };

  // Thống kê nhanh
  const totalStocktakes = stocktakes.length;
  const inProgressCount = stocktakes.filter((s) => s.status === "IN_PROGRESS" || s.status === "DRAFT").length;
  const completedCount = stocktakes.filter((s) => s.status === "COMPLETED").length;
  const totalDiffValue = stocktakes.reduce((sum, s) => sum + s.totalDifferenceValue, 0);

  const getStatusTag = (st: string) => {
    switch (st) {
      case "DRAFT":
        return <Tag color="default" icon={<ClockCircleOutlined />}>Khởi tạo</Tag>;
      case "IN_PROGRESS":
        return <Tag color="processing" icon={<EditOutlined />}>Đang kiểm đếm</Tag>;
      case "COMPLETED":
        return <Tag color="success" icon={<CheckCircleOutlined />}>Đã khóa sổ (Cập nhật tồn)</Tag>;
      default:
        return <Tag>{st}</Tag>;
    }
  };

  const columns = [
    {
      title: "Mã Phiếu",
      key: "stocktakeCode",
      width: 140,
      render: (_: any, r: InventoryStocktake) => (
        <div>
          <Text strong style={{ color: "#0958d9", cursor: "pointer" }} onClick={() => handleOpenDetail(r)}>
            {r.stocktakeCode}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(r.createdAt).format("DD/MM/YYYY HH:mm")}
          </Text>
        </div>
      ),
    },
    {
      title: "Tiêu đề đợt kiểm kê",
      dataIndex: "title",
      key: "title",
      render: (t: string) => <Text strong>{t}</Text>,
    },
    {
      title: "Số mặt hàng",
      key: "itemsCount",
      width: 110,
      align: "center" as const,
      render: (_: any, r: InventoryStocktake) => `${r.items?.length || 0} sản phẩm`,
    },
    {
      title: "Chênh lệch SL",
      dataIndex: "totalDifferenceQty",
      key: "totalDifferenceQty",
      width: 130,
      align: "right" as const,
      render: (v: number) => (
        <Text strong style={{ color: v === 0 ? "#52c41a" : v > 0 ? "#1890ff" : "#cf1322" }}>
          {v > 0 ? `+${v}` : v} ĐV
        </Text>
      ),
    },
    {
      title: "Giá trị chênh lệch",
      dataIndex: "totalDifferenceValue",
      key: "totalDifferenceValue",
      width: 160,
      align: "right" as const,
      render: (v: number) => (
        <Text strong style={{ color: v === 0 ? "#52c41a" : v > 0 ? "#1890ff" : "#cf1322" }}>
          {v > 0 ? `+${Math.round(v).toLocaleString("vi-VN")}` : Math.round(v).toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 180,
      render: (st: string) => getStatusTag(st),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      align: "center" as const,
      render: (_: any, r: InventoryStocktake) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleOpenDetail(r)}
        >
          {r.status === "COMPLETED" ? "Xem chi tiết" : "Kiểm đếm"}
        </Button>
      ),
    },
  ];

  const isCompleted = selectedStocktake?.status === "COMPLETED";

  return (
    <div>
      {/* 1. HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <CheckSquareOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            Quản Lý Kiểm Kê Kho Định Kỳ & Điều Chỉnh Tồn Kho
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Kiểm đếm thực tế &bull; Đối chiếu Thừa / Thiếu &bull; Tự động sinh giao dịch điều chỉnh Thẻ kho (ADJUSTMENT)
          </Text>
        </div>

        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            style={{ background: "#1890ff" }}
          >
            Tạo Đợt Kiểm Kê Mới
          </Button>
          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchStocktakes}>
            Làm mới
          </Button>
        </Space>
      </div>

      {/* 2. THẺ THỐNG KÊ */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng đợt kiểm kê"
              value={totalStocktakes}
              prefix={<DiffOutlined style={{ color: "#1890ff" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Đang kiểm đếm"
              value={inProgressCount}
              valueStyle={{ color: "#fa8c16" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Đã khóa sổ điều chỉnh"
              value={completedCount}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bordered style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng chênh lệch giá trị"
              value={Math.round(totalDiffValue).toLocaleString("vi-VN")}
              suffix="đ"
              valueStyle={{ color: totalDiffValue === 0 ? "#52c41a" : "#cf1322" }}
            />
          </Card>
        </Col>
      </Row>

      {/* 3. BẢNG DỮ LIỆU */}
      <Card size="small" bordered title="Danh sách các đợt kiểm kê kho">
        <Table
          rowKey="id"
          size="small"
          bordered
          sticky
          loading={loading}
          dataSource={stocktakes}
          columns={columns}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      {/* 4. DRAWER TẠO ĐỢT KIỂM KÊ MỚI */}
      <Drawer
        title="Khởi Tạo Đợt Kiểm Kê Kho Mới"
        width={550}
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setCreateDrawerOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              loading={submittingCreate}
              onClick={() => createForm.submit()}
            >
              Bắt đầu kiểm kê
            </Button>
          </Space>
        }
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateStocktake}>
          <Form.Item
            name="title"
            label="Tiêu đề đợt kiểm kê"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
          >
            <Input placeholder="VD: Kiểm kê định kỳ kho lạnh Tháng 10/2026" />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú & Phạm vi kiểm kê">
            <Input.TextArea
              rows={3}
              placeholder="VD: Kiểm đếm toàn bộ mì Indomie và xúc xích tại Kho Lạnh A..."
            />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            message="Cơ chế tự động lấy tồn kho hệ thống"
            description="Khi khởi tạo, hệ thống sẽ tự động chốt ảnh chụp tồn kho (currentStock) và Giá vốn bình quân (avgCostPrice) tại thời điểm này để thủ kho tiến hành kiểm đếm đối chiếu."
          />
        </Form>
      </Drawer>

      {/* 5. DRAWER CHI TIẾT KIỂM ĐẾM & KHÓA SỔ */}
      <Drawer
        title={
          <Space>
            <CheckSquareOutlined style={{ color: "#1890ff" }} />
            <Text strong>
              Kiểm đếm: {selectedStocktake?.stocktakeCode} - {selectedStocktake?.title}
            </Text>
          </Space>
        }
        width={920}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDetailDrawerOpen(false)}>Đóng</Button>

            {!isCompleted && (
              <>
                <Button
                  icon={<SaveOutlined />}
                  loading={savingCounts}
                  onClick={handleSaveCounts}
                >
                  Lưu tạm số đếm
                </Button>

                <Popconfirm
                  title="Xác nhận khóa sổ phiếu kiểm kê?"
                  description="Hệ thống sẽ cập nhật lại số lượng tồn kho theo số đếm thực tế và tự động ghi các bản ghi điều chỉnh vào Thẻ kho."
                  onConfirm={handleCompleteStocktake}
                  okText="Khóa sổ & Cập nhật tồn"
                  cancelText="Hủy"
                >
                  <Button
                    type="primary"
                    loading={completing}
                    style={{ background: "#52c41a", borderColor: "#52c41a" }}
                  >
                    Khóa sổ & Điều chỉnh tồn kho
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        }
      >
        {selectedStocktake && (
          <div>
            <Descriptions size="small" bordered column={3} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Mã phiếu">{selectedStocktake.stocktakeCode}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(selectedStocktake.createdAt).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {getStatusTag(selectedStocktake.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng chênh lệch SL">
                <Text
                  strong
                  style={{
                    color:
                      selectedStocktake.totalDifferenceQty === 0
                        ? "#52c41a"
                        : selectedStocktake.totalDifferenceQty > 0
                        ? "#1890ff"
                        : "#cf1322",
                  }}
                >
                  {selectedStocktake.totalDifferenceQty > 0
                    ? `+${selectedStocktake.totalDifferenceQty}`
                    : selectedStocktake.totalDifferenceQty}{" "}
                  Đơn vị
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng chênh lệch giá trị" span={2}>
                <Text
                  strong
                  style={{
                    color:
                      selectedStocktake.totalDifferenceValue === 0
                        ? "#52c41a"
                        : selectedStocktake.totalDifferenceValue > 0
                        ? "#1890ff"
                        : "#cf1322",
                  }}
                >
                  {Math.round(selectedStocktake.totalDifferenceValue).toLocaleString("vi-VN")} đ
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {isCompleted && (
              <Alert
                type="success"
                showIcon
                message="Phiếu kiểm kê đã khóa sổ hoàn tất"
                description={`Hoàn tất lúc ${dayjs(selectedStocktake.completedAt).format(
                  "DD/MM/YYYY HH:mm"
                )}. Toàn bộ các chênh lệch đã được hệ thống ghi nhận vào Thẻ kho với mã nghiệp vụ ADJUSTMENT.`}
                style={{ marginBottom: 16 }}
              />
            )}

            <Title level={5} style={{ margin: "12px 0 8px 0" }}>
              Bảng Kiểm Đếm Thực Tế Từng Mặt Hàng
            </Title>

            <Table
              size="small"
              bordered
              pagination={false}
              dataSource={selectedStocktake.items}
              rowKey="id"
              columns={[
                {
                  title: "Mặt hàng",
                  key: "product",
                  render: (_: any, it: StocktakeItem) => (
                    <div>
                      <Tag color="blue">{it.product?.sku}</Tag>
                      <Text strong>{it.product?.name}</Text>
                      {it.product?.location && (
                        <Tag color="cyan" style={{ marginLeft: 4 }}>
                          Vị trí: {it.product.location.code}
                        </Tag>
                      )}
                    </div>
                  ),
                },
                {
                  title: "Tồn hệ thống",
                  dataIndex: "systemQty",
                  key: "systemQty",
                  width: 110,
                  align: "center" as const,
                  render: (v: number, it: StocktakeItem) => `${v} ${it.product?.baseUnit}`,
                },
                {
                  title: "Thực tế kiểm đếm",
                  key: "actualQty",
                  width: 150,
                  align: "center" as const,
                  render: (_: any, it: StocktakeItem) => {
                    if (isCompleted) {
                      return (
                        <Text strong style={{ fontSize: 13 }}>
                          {it.actualQty} {it.product?.baseUnit}
                        </Text>
                      );
                    }

                    const val = countValues[it.productId]?.actualQty ?? it.actualQty;

                    return (
                      <InputNumber
                        min={0}
                        style={{ width: 110 }}
                        value={val}
                        onChange={(newVal) => {
                          setCountValues({
                            ...countValues,
                            [it.productId]: {
                              actualQty: newVal ?? 0,
                              reason: countValues[it.productId]?.reason || "",
                            },
                          });
                        }}
                      />
                    );
                  },
                },
                {
                  title: "Chênh lệch",
                  key: "diff",
                  width: 110,
                  align: "right" as const,
                  render: (_: any, it: StocktakeItem) => {
                    const actual = countValues[it.productId]?.actualQty ?? it.actualQty;
                    const diff = actual - it.systemQty;

                    return (
                      <Text
                        strong
                        style={{
                          color: diff === 0 ? "#52c41a" : diff > 0 ? "#1890ff" : "#cf1322",
                        }}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </Text>
                    );
                  },
                },
                {
                  title: "Lý do chênh lệch",
                  key: "reason",
                  render: (_: any, it: StocktakeItem) => {
                    if (isCompleted) {
                      return <Text type="secondary">{it.reason || "Không có"}</Text>;
                    }

                    const r = countValues[it.productId]?.reason ?? (it.reason || "");

                    return (
                      <Input
                        placeholder="VD: Rách bao bì, hao hụt..."
                        value={r}
                        onChange={(e) => {
                          setCountValues({
                            ...countValues,
                            [it.productId]: {
                              actualQty: countValues[it.productId]?.actualQty ?? it.actualQty,
                              reason: e.target.value,
                            },
                          });
                        }}
                      />
                    );
                  },
                },
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
