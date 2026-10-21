"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Spin,
  Alert,
  Divider,
  Input,
  Select,
  Form,
  Badge,
  Avatar,
  message,
  Tabs,
  Popconfirm,
  List,
  Progress,
  Timeline,
  Rate,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  CommentOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  DollarOutlined,
  CarOutlined,
  HeartOutlined,
  HeartFilled,
  TrophyOutlined,
  FireOutlined,
  CrownOutlined,
  PushpinOutlined,
  SmileOutlined,
  StarFilled,
  ThunderboltOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface AuditLogEntry {
  id: string;
  action: string;
  targetId: string;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  createdAt: string;
}

interface EmployeeProfile {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  baseSalary: number;
  ratePerTrip: number;
  ratePerStop: number;
  ratePerKg: number;
  totalAuditLogs: number;
  auditLogs: AuditLogEntry[];
}

export default function ProfileAndSocialPage() {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);

  // Social feed state
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostType, setNewPostType] = useState("ANNOUNCEMENT");
  const [newPostDept, setNewPostDept] = useState("GENERAL");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");
  const [noteForm] = Form.useForm();

  // 1. Fetch Profile
  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch {
      message.error("Lỗi khi tải hồ sơ");
    } finally {
      setLoadingProfile(false);
    }
  };

  // 2. Fetch Company Feed
  const fetchFeed = async () => {
    try {
      setLoadingFeed(true);
      const res = await fetch("/api/feed");
      const json = await res.json();
      if (json.success) {
        setPosts(json.data);
      }
    } catch {
      message.error("Lỗi khi tải bảng tin công ty");
    } finally {
      setLoadingFeed(false);
    }
  };

  // 3. Fetch Internal Notes
  const fetchNotes = async () => {
    try {
      setLoadingNotes(true);
      const params = new URLSearchParams();
      if (selectedDeptFilter && selectedDeptFilter !== "ALL") {
        params.append("department", selectedDeptFilter);
      }
      const res = await fetch(`/api/notes?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setNotes(json.data || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchFeed();
    fetchNotes();
  }, []);

  // Post new feed item
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      message.warning("Vui lòng nhập nội dung bài viết");
      return;
    }

    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPostTitle || undefined,
          content: newPostContent,
          postType: newPostType,
          department: newPostDept,
          authorName: profile?.fullName || "Thành viên Sơn Khang",
          authorRole: profile?.role || "Quản trị viên",
        }),
      });

      const json = await res.json();
      if (json.success) {
        message.success("Đã đăng bài viết lên Bảng tin Doanh Nghiệp!");
        setNewPostTitle("");
        setNewPostContent("");
        fetchFeed();
      } else {
        message.error(json.error || "Không thể đăng bài");
      }
    } catch {
      message.error("Lỗi kết nối máy chủ");
    }
  };

  // React to post (Heart/Like)
  const handleReactPost = async (postId: string) => {
    try {
      const res = await fetch(`/api/feed/${postId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile?.id || "user-current",
          userName: profile?.fullName || "Bạn",
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchFeed();
      }
    } catch {
      // Ignore
    }
  };

  // Comment on post
  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`/api/feed/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text.trim(),
          userName: profile?.fullName || "Bạn",
          userId: profile?.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCommentInputs({ ...commentInputs, [postId]: "" });
        fetchFeed();
      }
    } catch {
      message.error("Lỗi khi gửi bình luận");
    }
  };

  // Create note
  const handleCreateNote = async (values: any) => {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: profile?.fullName || "Admin Sơn Khang",
          department: values.department,
          urgency: values.urgency || "NORMAL",
          content: values.content,
          employeeId: profile?.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        message.success("Đã đăng ghi chú điều phối nội bộ!");
        noteForm.resetFields();
        fetchNotes();
      }
    } catch {
      message.error("Lỗi khi đăng ghi chú");
    }
  };

  const handleToggleResolveNote = async (noteId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: !currentStatus }),
      });
      fetchNotes();
    } catch {
      // Ignore
    }
  };

  if (loadingProfile) {
    return (
      <div style={{ textAlign: "center", padding: 100 }}>
        <Spin size="large" tip="Đang tải thông tin nhân viên..." />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Profile Header Banner */}
      <Card
        bordered={false}
        style={{
          marginBottom: 24,
          background: "linear-gradient(135deg, #1890ff 0%, #002766 100%)",
          color: "#fff",
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        }}
      >
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Space size={20} align="center">
              <Avatar
                size={80}
                icon={<UserOutlined />}
                style={{ backgroundColor: "#0050b3", border: "3px solid #fff" }}
              />
              <div>
                <Space>
                  <Title level={3} style={{ color: "#fff", margin: 0 }}>
                    {profile?.fullName || "Nhân viên Sơn Khang"}
                  </Title>
                  <Tag color="gold" icon={<CrownOutlined />} style={{ fontWeight: "bold" }}>
                    {profile?.role || "ADMIN"}
                  </Tag>
                  <Badge status="success" text={<span style={{ color: "#fff" }}>Đang hoạt động</span>} />
                </Space>
                <div style={{ marginTop: 6 }}>
                  <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                    Mã NV: <strong>{profile?.code || "SK-001"}</strong> • Email: {profile?.email} • SĐT:{" "}
                    {profile?.phone}
                  </Text>
                </div>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: "right" }}>
            <Space direction="vertical" size={2}>
              <Text style={{ color: "rgba(255,255,255,0.8)" }}>Điểm Uy Tín & Đóng Góp:</Text>
              <Space>
                <Rate disabled defaultValue={5} character={<StarFilled style={{ color: "#faad14" }} />} />
                <Text strong style={{ color: "#faad14", fontSize: 18 }}>
                  5.0 / 5.0
                </Text>
              </Space>
              <Tag color="cyan">Chiến Binh Xuất Sắc Tháng 10/2026</Tag>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Tabs */}
      <Card bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <Tabs
          defaultActiveKey="feed"
          size="large"
          items={[
            // TAB 1: COMPANY FEED
            {
              key: "feed",
              label: (
                <Space>
                  <FireOutlined style={{ color: "#ff4d4f" }} />
                  <span>Bảng Tin Doanh Nghiệp (Company Feed)</span>
                </Space>
              ),
              children: (
                <Row gutter={[24, 24]}>
                  {/* Left: Create Post */}
                  <Col xs={24} lg={8}>
                    <Card
                      title="Chia Sẻ & Thông Báo Nội Bộ"
                      size="small"
                      style={{ marginBottom: 20, backgroundColor: "#fafafa" }}
                    >
                      <Form layout="vertical">
                        <Form.Item label="Tiêu đề (Tùy chọn)">
                          <Input
                            placeholder="Tiêu đề thông báo..."
                            value={newPostTitle}
                            onChange={(e) => setNewPostTitle(e.target.value)}
                          />
                        </Form.Item>
                        <Row gutter={8}>
                          <Col span={12}>
                            <Form.Item label="Chủ đề">
                              <Select value={newPostType} onChange={(v) => setNewPostType(v)}>
                                <Option value="ANNOUNCEMENT">📢 Thông báo</Option>
                                <Option value="RECOGNITION">🏆 Vinh danh KPI</Option>
                                <Option value="DISCUSSION">💬 Thảo luận</Option>
                                <Option value="EVENT">🎉 Sự kiện</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="Bộ phận">
                              <Select value={newPostDept} onChange={(v) => setNewPostDept(v)}>
                                <Option value="GENERAL">Toàn công ty</Option>
                                <Option value="LOGISTICS">Điều phối / Giao vận</Option>
                                <Option value="ACCOUNTING">Kế toán</Option>
                                <Option value="WAREHOUSE">Kho hàng</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item label="Nội dung bài viết">
                          <TextArea
                            rows={4}
                            placeholder="Chia sẻ tin tức, kết quả giao hàng Tera V6, lời cảm ơn đồng đội..."
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                          />
                        </Form.Item>
                        <Button
                          type="primary"
                          block
                          icon={<SendOutlined />}
                          onClick={handleCreatePost}
                        >
                          Đăng Lên Bảng Tin
                        </Button>
                      </Form>
                    </Card>

                    {/* Quick Community Guidelines */}
                    <Card size="small" title="Văn Hóa Sơn Khang Food">
                      <List size="small">
                        <List.Item>🚚 Giao hàng chuẩn xác, đúng giờ và an toàn tuyệt đối</List.Item>
                        <List.Item>📦 Kiểm đếm tỉ mỉ, bảo quản hàng lạnh đúng tiêu chuẩn -18°C</List.Item>
                        <List.Item>🤝 Hỗ trợ đồng đội, minh bạch tiền mặt và đối soát công nợ</List.Item>
                      </List>
                    </Card>
                  </Col>

                  {/* Right: Posts Feed */}
                  <Col xs={24} lg={16}>
                    {loadingFeed ? (
                      <Spin tip="Đang tải bảng tin..." />
                    ) : posts.length === 0 ? (
                      <Card style={{ textAlign: "center", padding: 40 }}>
                        <Text type="secondary">Chưa có bài viết nào trên bảng tin. Hãy là người đầu tiên chia sẻ!</Text>
                      </Card>
                    ) : (
                      posts.map((post) => (
                        <Card
                          key={post.id}
                          style={{
                            marginBottom: 16,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            borderLeft: post.pinned ? "4px solid #1890ff" : undefined,
                          }}
                        >
                          <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                            <Col>
                              <Space>
                                <Avatar style={{ backgroundColor: "#1890ff" }}>
                                  {post.authorName?.[0] || "U"}
                                </Avatar>
                                <div>
                                  <Text strong>{post.authorName}</Text>{" "}
                                  <Tag color="blue">{post.authorRole}</Tag>
                                  <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      {dayjs(post.createdAt).fromNow()} •{" "}
                                      <Tag>{post.department}</Tag>
                                    </Text>
                                  </div>
                                </div>
                              </Space>
                            </Col>
                            <Col>
                              {post.pinned && (
                                <Tag icon={<PushpinOutlined />} color="red">
                                  Ghim đầu bảng
                                </Tag>
                              )}
                              <Tag color="purple">{post.postType}</Tag>
                            </Col>
                          </Row>

                          {post.title && (
                            <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
                              {post.title}
                            </Title>
                          )}
                          <Paragraph style={{ whiteSpace: "pre-line" }}>{post.content}</Paragraph>

                          <Divider style={{ margin: "12px 0" }} />

                          {/* Reaction & Comments bar */}
                          <Row justify="space-between" align="middle">
                            <Col>
                              <Button
                                type="text"
                                icon={
                                  post.reactions?.some((r: any) => r.userId === profile?.id) ? (
                                    <HeartFilled style={{ color: "#ff4d4f", fontSize: 16 }} />
                                  ) : (
                                    <HeartOutlined style={{ fontSize: 16 }} />
                                  )
                                }
                                onClick={() => handleReactPost(post.id)}
                              >
                                {post.reactions?.length || 0} Yêu thích
                              </Button>
                              <Button type="text" icon={<CommentOutlined />}>
                                {post.comments?.length || 0} Bình luận
                              </Button>
                            </Col>
                          </Row>

                          {/* Comments List */}
                          {post.comments && post.comments.length > 0 && (
                            <div style={{ marginTop: 12, backgroundColor: "#f9f9f9", padding: 12, borderRadius: 6 }}>
                              {post.comments.map((cm: any) => (
                                <div key={cm.id} style={{ marginBottom: 8 }}>
                                  <Text strong style={{ fontSize: 13 }}>
                                    {cm.userName}:
                                  </Text>{" "}
                                  <Text style={{ fontSize: 13 }}>{cm.content}</Text>
                                  <div>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      {dayjs(cm.createdAt).fromNow()}
                                    </Text>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Comment input */}
                          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                            <Input
                              placeholder="Viết bình luận..."
                              size="small"
                              value={commentInputs[post.id] || ""}
                              onChange={(e) =>
                                setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                              }
                              onPressEnter={() => handleAddComment(post.id)}
                            />
                            <Button
                              size="small"
                              type="primary"
                              icon={<SendOutlined />}
                              onClick={() => handleAddComment(post.id)}
                            >
                              Gửi
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                  </Col>
                </Row>
              ),
            },

            // TAB 2: KPI & ACHIEVEMENT WALL
            {
              key: "achievements",
              label: (
                <Space>
                  <TrophyOutlined style={{ color: "#faad14" }} />
                  <span>Tường Thành Tích & KPI</span>
                </Space>
              ),
              children: (
                <div>
                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} md={6}>
                      <Card bordered={false} style={{ textAlign: "center", backgroundColor: "#fffbe6" }}>
                        <TrophyOutlined style={{ fontSize: 36, color: "#faad14" }} />
                        <Title level={4} style={{ margin: "12px 0 4px" }}>
                          Tay Lái Vàng
                        </Title>
                        <Text type="secondary">Hoàn thành &gt; 50 chuyến xe Tera V6 an toàn</Text>
                        <div style={{ marginTop: 12 }}>
                          <Tag color="gold">Huy Hiệu Hạng Nhất</Tag>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card bordered={false} style={{ textAlign: "center", backgroundColor: "#f6ffed" }}>
                        <CheckCircleOutlined style={{ fontSize: 36, color: "#52c41a" }} />
                        <Title level={4} style={{ margin: "12px 0 4px" }}>
                          Két Sắt Chuẩn 100%
                        </Title>
                        <Text type="secondary">Thu nộp COD khớp từng đồng không lệch</Text>
                        <div style={{ marginTop: 12 }}>
                          <Tag color="green">Kế Toán Tinh Nhuệ</Tag>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card bordered={false} style={{ textAlign: "center", backgroundColor: "#e6f7ff" }}>
                        <InboxOutlined style={{ fontSize: 36, color: "#1890ff" }} />
                        <Title level={4} style={{ margin: "12px 0 4px" }}>
                          Kho Hàng Chuẩn Chỉ
                        </Title>
                        <Text type="secondary">Kiểm kê định kỳ độ lệch &lt; 0.1%</Text>
                        <div style={{ marginTop: 12 }}>
                          <Tag color="blue">Thủ Kho Xuất Sắc</Tag>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card bordered={false} style={{ textAlign: "center", backgroundColor: "#f9f0ff" }}>
                        <ThunderboltOutlined style={{ fontSize: 36, color: "#722ed1" }} />
                        <Title level={4} style={{ margin: "12px 0 4px" }}>
                          Xử Lý Tốc Độ
                        </Title>
                        <Text type="secondary">Duyệt PO và đối chiếu 3 bên &lt; 15 phút</Text>
                        <div style={{ marginTop: 12 }}>
                          <Tag color="purple">Hiệu Suất Vượt Trội</Tag>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Card title="Tiến Độ Mục Tiêu KPI Cá Nhân Quý 4/2026" style={{ marginBottom: 20 }}>
                    <div style={{ marginBottom: 16 }}>
                      <Row justify="space-between">
                        <Text strong>Tỷ lệ hoàn thành chỉ tiêu chuyến xe / đơn hàng:</Text>
                        <Text strong>92% (Vượt mức 85%)</Text>
                      </Row>
                      <Progress percent={92} status="active" strokeColor="#52c41a" />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Row justify="space-between">
                        <Text strong>Tỷ lệ giải quyết ghi chú và sự vụ vận hành:</Text>
                        <Text strong>98%</Text>
                      </Row>
                      <Progress percent={98} strokeColor="#1890ff" />
                    </div>

                    <div>
                      <Row justify="space-between">
                        <Text strong>Định mức tiết kiệm nhiên liệu xe Tera V6:</Text>
                        <Text strong>105% (Tiết kiệm 8.5L / 100km so với định mức 9.5L)</Text>
                      </Row>
                      <Progress percent={100} strokeColor="#faad14" />
                    </div>
                  </Card>
                </div>
              ),
            },

            // TAB 3: ACTIVITY TIMELINE
            {
              key: "timeline",
              label: (
                <Space>
                  <ClockCircleOutlined style={{ color: "#1890ff" }} />
                  <span>Dòng Thời Gian Hoạt Động (Timeline)</span>
                </Space>
              ),
              children: (
                <div>
                  <Title level={5} style={{ marginBottom: 16 }}>
                    Nhật Ký Thao Tác Hệ Thống & Kiểm Toán Cá Nhân
                  </Title>
                  <Timeline
                    items={(profile?.auditLogs || []).map((log) => ({
                      color:
                        log.action === "SETTLE_CASH"
                          ? "green"
                          : log.action === "CLOSE_TRIP"
                          ? "blue"
                          : log.action === "SETTLE_RETURN_STOCK"
                          ? "orange"
                          : "gray",
                      children: (
                        <div>
                          <Space>
                            <Tag color="blue">{log.action}</Tag>
                            <Text strong>{log.note || "Thao tác trên đối tượng " + log.targetId}</Text>
                          </Space>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(log.createdAt).format("DD/MM/YYYY HH:mm:ss")} ({dayjs(log.createdAt).fromNow()})
                            </Text>
                          </div>
                        </div>
                      ),
                    }))}
                  />
                  {(!profile?.auditLogs || profile.auditLogs.length === 0) && (
                    <Text type="secondary">Chưa có nhật ký hoạt động nào được ghi nhận.</Text>
                  )}
                </div>
              ),
            },

            // TAB 4: INTERNAL NOTES
            {
              key: "notes",
              label: (
                <Space>
                  <CommentOutlined style={{ color: "#722ed1" }} />
                  <span>Ghi Chú Điều Phối Nội Bộ</span>
                </Space>
              ),
              children: (
                <div>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={8}>
                      <Card title="Gửi Ghi Chú / Bàn Giao Khẩn Cấp" size="small">
                        <Form form={noteForm} layout="vertical" onFinish={handleCreateNote}>
                          <Form.Item
                            name="department"
                            label="Bộ phận tiếp nhận"
                            rules={[{ required: true }]}
                            initialValue="GENERAL"
                          >
                            <Select>
                              <Option value="GENERAL">Toàn bộ / Chung</Option>
                              <Option value="DISPATCH">Điều phối & Giao vận</Option>
                              <Option value="WAREHOUSE">Kho & Bốc xếp</Option>
                              <Option value="ACCOUNTING">Kế toán & Thu ngân</Option>
                            </Select>
                          </Form.Item>

                          <Form.Item
                            name="urgency"
                            label="Mức độ khẩn cấp"
                            rules={[{ required: true }]}
                            initialValue="NORMAL"
                          >
                            <Select>
                              <Option value="NORMAL">Bình thường</Option>
                              <Option value="HIGH">Ưu tiên cao</Option>
                              <Option value="URGENT">Khẩn cấp</Option>
                            </Select>
                          </Form.Item>

                          <Form.Item
                            name="content"
                            label="Nội dung"
                            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
                          >
                            <TextArea rows={4} placeholder="Nhập nội dung ghi chú bàn giao..." />
                          </Form.Item>

                          <Button type="primary" block htmlType="submit">
                            Đăng Ghi Chú
                          </Button>
                        </Form>
                      </Card>
                    </Col>

                    <Col xs={24} lg={16}>
                      <Card
                        title="Danh Sách Ghi Chú Đang Xử Lý"
                        size="small"
                        extra={
                          <Select
                            value={selectedDeptFilter}
                            onChange={(val) => setSelectedDeptFilter(val)}
                            style={{ width: 180 }}
                          >
                            <Option value="ALL">Tất cả bộ phận</Option>
                            <Option value="DISPATCH">Giao vận</Option>
                            <Option value="WAREHOUSE">Kho</Option>
                            <Option value="ACCOUNTING">Kế toán</Option>
                          </Select>
                        }
                      >
                        <List
                          loading={loadingNotes}
                          dataSource={notes}
                          renderItem={(item: any) => (
                            <List.Item
                              actions={[
                                <Button
                                  key="resolve"
                                  size="small"
                                  type={item.isResolved ? "default" : "primary"}
                                  onClick={() => handleToggleResolveNote(item.id, item.isResolved)}
                                >
                                  {item.isResolved ? "Mở lại" : "Đã xong"}
                                </Button>,
                              ]}
                            >
                              <List.Item.Meta
                                title={
                                  <Space>
                                    <Tag color={item.urgency === "URGENT" ? "red" : item.urgency === "HIGH" ? "orange" : "blue"}>
                                      {item.urgency}
                                    </Tag>
                                    <Tag>{item.department}</Tag>
                                    <Text delete={item.isResolved}>{item.content}</Text>
                                  </Space>
                                }
                                description={`Bởi: ${item.authorName} • ${dayjs(item.createdAt).fromNow()}`}
                              />
                            </List.Item>
                          )}
                          locale={{ emptyText: "Không có ghi chú nào" }}
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },

            // TAB 5: SALARY & CONTRACT
            {
              key: "salary",
              label: (
                <Space>
                  <DollarOutlined style={{ color: "#52c41a" }} />
                  <span>Hợp Đồng & Định Mức Lương</span>
                </Space>
              ),
              children: (
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Mã nhân viên">{profile?.code}</Descriptions.Item>
                  <Descriptions.Item label="Vai trò / Chức danh">{profile?.role}</Descriptions.Item>
                  <Descriptions.Item label="Lương cơ bản">
                    {profile?.baseSalary ? `${profile.baseSalary.toLocaleString("vi-VN")} đ` : "Theo hợp đồng"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Định mức chuyến xe (Tera V6)">
                    {profile?.ratePerTrip?.toLocaleString("vi-VN")} đ / chuyến
                  </Descriptions.Item>
                  <Descriptions.Item label="Định mức điểm giao thành công">
                    {profile?.ratePerStop?.toLocaleString("vi-VN")} đ / điểm dừng
                  </Descriptions.Item>
                  <Descriptions.Item label="Định mức tải trọng thực giao">
                    {profile?.ratePerKg?.toLocaleString("vi-VN")} đ / kg
                  </Descriptions.Item>
                </Descriptions>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
