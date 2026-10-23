import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

export default function WorkspaceLandingPage() {
  return (
    <>
      <PageHeader
        title="Không gian làm việc nội bộ"
        description="Điểm vào chung cho hồ sơ, tài liệu và hoạt động phối hợp."
        breadcrumbs={[{ title: "Tổng quan", href: "/dashboard" }, { title: "Không gian làm việc" }]}
      />
      <div className="erp-landing-grid">
        <Link className="erp-landing-card" href="/profile">
          <strong>Hồ sơ và hoạt động</strong>
          <span>Xem hồ sơ cá nhân và trao đổi nội bộ hiện có.</span>
        </Link>
        <Link className="erp-landing-card" href="/documents">
          <strong>Tài liệu nội bộ</strong>
          <span>Tra cứu chứng từ và tài liệu đã số hóa.</span>
        </Link>
      </div>
    </>
  );
}
