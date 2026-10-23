import { PageHeader } from "@/components/ui/PageHeader";
import { AuditLogTable } from "@/components/settings/AuditLogTable";
import { requireAdminPage } from "@/lib/admin-page-guard";

export default async function SettingsAuditLogsPage() {
  await requireAdminPage();
  return <><PageHeader title="Nhật ký hệ thống" description="Bản ghi chỉ đọc cho các thao tác nhạy cảm và thay đổi quản trị." breadcrumbs={[{ title: "Thiết lập hệ thống", href: "/settings" }, { title: "Nhật ký hệ thống" }]} /><AuditLogTable /></>;
}
