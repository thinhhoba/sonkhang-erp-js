import SignOutActions from "@/components/auth/SignOutActions";

export default function SignOutPage() {
  return (
    <div className="auth-card">
      <div className="auth-brand"><span className="auth-logo">SK</span><span>Sơn Khang ERP</span></div>
      <span className="auth-eyebrow">Bảo mật phiên làm việc</span>
      <h1>Bạn muốn đăng xuất?</h1>
      <p className="auth-lead">Phiên làm việc trên thiết bị này sẽ kết thúc. Các tác vụ chưa lưu có thể bị mất.</p>
      <SignOutActions />
    </div>
  );
}
