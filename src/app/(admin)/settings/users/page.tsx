import { PageHeader } from "@/components/ui/PageHeader";
import { EmployeeDirectory } from "@/components/settings/EmployeeDirectory";
import { requireAdminPage } from "@/lib/admin-page-guard";

export default async function SettingsUsersPage() {
  await requireAdminPage();
  return <><PageHeader title="Người dùng" description="Quản lý danh sách whitelist Google và quyền truy cập của nhân viên." breadcrumbs={[{ title: "Thiết lập hệ thống", href: "/settings" }, { title: "Người dùng" }]} /><EmployeeDirectory /></>;
}
