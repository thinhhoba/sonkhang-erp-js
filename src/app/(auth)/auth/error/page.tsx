import Link from "next/link";

const errorContent: Record<string, { title: string; description: string }> = {
  AccessDenied: {
    title: "Tài khoản chưa được cấp quyền",
    description: "Email Google này chưa thuộc danh sách nhân sự hoạt động hoặc tài khoản đã bị khóa.",
  },
  Configuration: {
    title: "Cấu hình đăng nhập chưa sẵn sàng",
    description: "Dịch vụ xác thực đang được cấu hình. Vui lòng liên hệ quản trị hệ thống.",
  },
  OAuthSignin: {
    title: "Không thể kết nối Google",
    description: "Phiên kết nối Google không thể khởi tạo. Hãy thử lại sau ít phút.",
  },
  OAuthCallback: {
    title: "Google không thể xác nhận phiên",
    description: "Quá trình xác thực bị gián đoạn hoặc đã hết hạn. Vui lòng đăng nhập lại.",
  },
  Default: {
    title: "Đăng nhập chưa thành công",
    description: "Đã có lỗi trong quá trình xác thực. Không có dữ liệu nào được thay đổi.",
  },
};

type AuthErrorPageProps = { searchParams?: { error?: string | string[] } };

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const code = typeof searchParams?.error === "string" ? searchParams.error : "Default";
  const content = errorContent[code] ?? errorContent.Default;

  return (
    <div className="auth-card">
      <div className="auth-brand"><span className="auth-logo">SK</span><span>Sơn Khang ERP</span></div>
      <span className="auth-eyebrow">Xác thực tài khoản</span>
      <h1>{content.title}</h1>
      <p className="auth-lead">{content.description}</p>
      <div className="auth-action-row">
        <Link className="auth-secondary-button" href="/">Trang chủ</Link>
        <Link className="auth-danger-button" href="/auth/signin">Thử đăng nhập lại</Link>
      </div>
    </div>
  );
}
