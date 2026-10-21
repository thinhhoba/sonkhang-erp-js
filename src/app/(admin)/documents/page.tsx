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
  Select,
  Radio,
  message,
  Typography,
  Descriptions,
} from "antd";
import {
  FileTextOutlined,
  PlusOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  PaperClipOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export default function DocumentsPage() {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchText, setSearchText] = useState("");

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const [form] = Form.useForm();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (searchText) params.append("search", searchText);

      const res = await fetch(`/api/documents?${params.toString()}`);
      const json = await res.json();
      if (json.success) setDocuments(json.data);
    } catch {
      message.error("Lỗi khi tải kho chứng từ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [categoryFilter]);

  const handleSearch = () => {
    fetchDocuments();
  };

  const handleOpenCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      category: "INVOICE_VAT",
      fileType: "PDF",
      fileSizeKb: 350,
      uploaderName: "Kế toán / Thủ kho",
      fileUrl: "https://drive.google.com/sonkhang-docs",
    });
    setCreateDrawerOpen(true);
  };

  const handleSaveDocument = async () => {
    try {
      const values = await form.validateFields();
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (json.success) {
        message.success("Đã lưu chứng từ vào kho số hóa");
        setCreateDrawerOpen(false);
        fetchDocuments();
      } else {
        message.error(json.error || "Không thể lưu chứng từ");
      }
    } catch {
      // Validation error
    }
  };

  const getCategoryTag = (cat: string) => {
    switch (cat) {
      case "INVOICE_VAT":
        return <Tag color="blue">Hóa đơn điện tử VAT</Tag>;
      case "DELIVERY_POD":
        return <Tag color="green">Biên bản giao hàng (POD)</Tag>;
      case "VEHICLE_REG":
        return <Tag color="orange">Đăng kiểm / Bảo hiểm xe</Tag>;
      case "SUPPLIER_CONTRACT":
        return <Tag color="purple">Hợp đồng Nhà cung cấp</Tag>;
      case "FINANCIAL_REPORT":
        return <Tag color="cyan">Báo cáo tài chính</Tag>;
      default:
        return <Tag color="default">Chứng từ khác</Tag>;
    }
  };

  const getFileIcon = (type: string) => {
    if (type === "PDF") return <FilePdfOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />;
    if (type === "XLSX" || type === "CSV")
      return <FileExcelOutlined style={{ color: "#52c41a", fontSize: 18 }} />;
    if (type === "PNG" || type === "JPG")
      return <FileImageOutlined style={{ color: "#1890ff", fontSize: 18 }} />;
    return <FileTextOutlined style={{ fontSize: 18 }} />;
  };

  // Metrics
  const totalDocs = documents.length;
  const vatDocsCount = documents.filter((d) => d.category === "INVOICE_VAT").length;
  const podDocsCount = documents.filter((d) => d.category === "DELIVERY_POD").length;
  const vehicleDocsCount = documents.filter((d) => d.category === "VEHICLE_REG").length;

  const columns = [
    {
      title: "Mã chứng từ",
      dataIndex: "docCode",
      key: "docCode",
      render: (v: string) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: "Tiêu đề chứng từ",
      key: "title",
      render: (_: any, r: any) => (
        <Space align="start">
          {getFileIcon(r.fileType)}
          <div>
            <Text strong>{r.title}</Text>
            {r.referenceId && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Mã tham chiếu: <Tag>{r.referenceId}</Tag>
                </Text>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Phân loại",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => getCategoryTag(cat),
    },
    {
      title: "Người lưu trữ",
      key: "uploader",
      render: (_: any, r: any) => (
        <div>
          <Text>{r.uploaderName || "Hệ thống"}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(r.createdAt).format("DD/MM/YYYY HH:mm")}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Định dạng / Dung lượng",
      key: "format",
      render: (_: any, r: any) => (
        <Text type="secondary">
          {r.fileType} ({r.fileSizeKb} KB)
        </Text>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, r: any) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => window.open(r.fileUrl, "_blank")}
          >
            Tải về
          </Button>
          <Button
            size="small"
            onClick={() => {
              setSelectedDoc(r);
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
            Kho Lưu Trữ Chứng Từ & Hồ Sơ Số Hóa (Digital Documents)
          </Title>
          <Text type="secondary">
            Lưu trữ tập trung hóa đơn VAT, biên bản giao hàng POD xe Tera V6, giấy tờ đăng kiểm và hợp đồng
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            size="large"
          >
            Lưu Trữ Chứng Từ Mới
          </Button>
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
                <PaperClipOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Tổng Chứng Từ Số Hóa
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                  {totalDocs} hồ sơ
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                  Đã mã hóa lưu trữ
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
                <FilePdfOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Hóa Đơn Điện Tử VAT
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626", marginTop: 2 }}>
                  {vatDocsCount} hóa đơn
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
                  meInvoice & Khách hàng
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
                  background: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#16a34a",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <CheckCircleOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Biên Bản Giao Hàng (POD)
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a", marginTop: 2 }}>
                  {podDocsCount} biên bản
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                  Có chữ ký nhận F&B
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
                <FileTextOutlined />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: "block" }}>
                  Hồ Sơ Xe & Hợp Đồng
                </Text>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b", marginTop: 2 }}>
                  {vehicleDocsCount} bộ hồ sơ
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
                  Bảo hiểm & Đăng kiểm
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filter and Search Bar */}
      <Card
        bordered={false}
        style={{ marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} lg={16}>
            <Radio.Group
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="ALL">Tất cả</Radio.Button>
              <Radio.Button value="INVOICE_VAT">Hóa đơn VAT</Radio.Button>
              <Radio.Button value="DELIVERY_POD">Biên bản POD</Radio.Button>
              <Radio.Button value="VEHICLE_REG">Đăng kiểm xe</Radio.Button>
              <Radio.Button value="SUPPLIER_CONTRACT">Hợp đồng NCC</Radio.Button>
              <Radio.Button value="FINANCIAL_REPORT">Báo cáo tài chính</Radio.Button>
            </Radio.Group>
          </Col>
          <Col xs={24} lg={8}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Input
                placeholder="Tìm mã CT, tiêu đề, mã tham chiếu..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
                allowClear
              />
              <Button type="primary" onClick={handleSearch}>
                Tìm
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <Table
          columns={columns}
          dataSource={documents}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      {/* Drawer Create Document */}
      <Drawer
        title="Lưu Trữ Chứng Từ Mới Vào Kho Số Hóa"
        width={560}
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setCreateDrawerOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleSaveDocument}>
              Lưu Chứng Từ
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tiêu đề chứng từ"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề chứng từ" }]}
          >
            <Input placeholder="VD: Hóa đơn đỏ đầu vào Công ty Indomie Tháng 10/2026" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Phân loại chứng từ" name="category" rules={[{ required: true }]}>
                <Select>
                  <Option value="INVOICE_VAT">Hóa đơn điện tử VAT</Option>
                  <Option value="DELIVERY_POD">Biên bản giao nhận POD</Option>
                  <Option value="VEHICLE_REG">Hồ sơ xe / Đăng kiểm</Option>
                  <Option value="SUPPLIER_CONTRACT">Hợp đồng Nhà cung cấp</Option>
                  <Option value="FINANCIAL_REPORT">Báo cáo tài chính</Option>
                  <Option value="OTHER">Chứng từ khác</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Định dạng file" name="fileType">
                <Select>
                  <Option value="PDF">Tài liệu PDF (.pdf)</Option>
                  <Option value="XLSX">Bảng tính Excel (.xlsx)</Option>
                  <Option value="PNG">Hình ảnh PNG (.png)</Option>
                  <Option value="JPG">Hình ảnh JPG (.jpg)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Mã tham chiếu (Đơn hàng/Chuyến/PO)" name="referenceId">
                <Input placeholder="VD: TRIP-20261021-01, PO-202610..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Người lưu trữ" name="uploaderName">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Đường dẫn file chứng từ (URL Cloud / Drive)"
            name="fileUrl"
            rules={[{ required: true, message: "Vui lòng nhập URL lưu trữ chứng từ" }]}
          >
            <Input placeholder="https://storage.googleapis.com/... hoặc Drive URL" />
          </Form.Item>

          <Form.Item label="Từ khóa / Nhãn (Tags)" name="tags">
            <Input placeholder="thang10, thue, hoadon, terav6..." />
          </Form.Item>

          <Form.Item label="Ghi chú thêm" name="notes">
            <Input.TextArea rows={3} placeholder="Ghi chú nội dung chứng từ..." />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Drawer Detail Document */}
      <Drawer
        title="Chi Tiết Chứng Từ Số Hóa"
        width={560}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
      >
        {selectedDoc && (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Mã chứng từ">
              <Tag color="geekblue">{selectedDoc.docCode}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tiêu đề">
              <Text strong>{selectedDoc.title}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Phân loại">
              {getCategoryTag(selectedDoc.category)}
            </Descriptions.Item>
            <Descriptions.Item label="Mã tham chiếu">
              {selectedDoc.referenceId ? <Tag>{selectedDoc.referenceId}</Tag> : "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Người lưu trữ">
              {selectedDoc.uploaderName || "---"}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian lưu">
              {dayjs(selectedDoc.createdAt).format("DD/MM/YYYY HH:mm:ss")}
            </Descriptions.Item>
            <Descriptions.Item label="Định dạng / Kích thước">
              {selectedDoc.fileType} ({selectedDoc.fileSizeKb} KB)
            </Descriptions.Item>
            <Descriptions.Item label="Đường dẫn file">
              <a href={selectedDoc.fileUrl} target="_blank" rel="noreferrer">
                {selectedDoc.fileUrl}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">
              {selectedDoc.notes || "Không có ghi chú"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
