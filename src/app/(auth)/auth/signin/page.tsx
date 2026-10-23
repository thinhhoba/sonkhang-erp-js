import Link from "next/link";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { safeInternalCallback } from "@/components/auth/safe-callback";

type SignInPageProps = {
  searchParams?: { callbackUrl?: string | string[]; error?: string | string[] };
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  const callbackUrl = safeInternalCallback(searchParams?.callbackUrl);
  const hasError = typeof searchParams?.error === "string";

  return (
    <div className="auth-card">
      <div className="auth-brand"><span className="auth-logo">SK</span><span>Sơn Khang ERP</span></div>
      <span className="auth-eyebrow">Cổng vận hành nội bộ</span>
      <h1>Chào mừng bạn<br />quay trở lại.</h1>
      <p className="auth-lead">Đăng nhập bằng tài khoản Google đã được Sơn Khang cấp quyền.</p>

      {hasError ? (
        <div className="auth-alert" role="alert">
          Không thể đăng nhập tài khoản này. Vui lòng kiểm tra quyền truy cập hoặc xem <Link className="auth-text-link" href="/auth/error">chi tiết lỗi</Link>.
        </div>
      ) : null}

      <GoogleSignInButton callbackUrl={callbackUrl} />
      <div className="auth-divider"><span>Đăng nhập nhanh &amp; bảo mật</span></div>
      <p className="auth-security-note">
        <span className="auth-shield" aria-hidden="true">✓</span>
        <span>Hệ thống chỉ chấp nhận email nằm trong danh sách nhân sự đang hoạt động. Phiên đăng nhập được bảo vệ bởi Google OAuth.</span>
      </p>
    </div>
  );
}
