import type { Metadata } from "next";
import DeliveryScene from "@/components/three/DeliveryScene";
import "./auth.css";

export const metadata: Metadata = {
  title: "Đăng nhập | Sơn Khang ERP",
  description: "Cổng đăng nhập bảo mật dành cho nhân sự Sơn Khang.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-visual" aria-label="Minh họa mạng lưới giao vận Sơn Khang">
        <DeliveryScene />
      </section>
      <section className="auth-content">
        <div className="auth-mobile-brand" aria-hidden="true">
          <span className="auth-logo">SK</span>
          <span>Sơn Khang ERP</span>
        </div>
        {children}
        <p className="auth-copyright">© 2026 Sơn Khang · Hệ thống vận hành nội bộ</p>
      </section>
    </main>
  );
}
