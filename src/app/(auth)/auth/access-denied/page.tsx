import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="auth-card">
      <div className="auth-brand"><span className="auth-logo">SK</span><span>Sơn Khang ERP</span></div>
      <span className="auth-eyebrow">Quyền truy cập</span>
      <h1>Bạn chưa có quyền mở khu vực này.</h1>
      <p className="auth-lead">Tài khoản đã đăng nhập nhưng vai trò hoặc phạm vi dữ liệu hiện tại không cho phép thực hiện thao tác này.</p>
      <div className="auth-action-row">
        <Link className="auth-secondary-button" href="/dashboard">Về tổng quan</Link>
        <Link className="auth-danger-button" href="/auth/signout">Đổi tài khoản</Link>
      </div>
    </div>
  );
}
