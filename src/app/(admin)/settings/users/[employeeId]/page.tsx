import { PageHeader } from "@/components/ui/PageHeader";
import { EmployeeEditor } from "@/components/settings/EmployeeEditor";
import { requireAdminPage } from "@/lib/admin-page-guard";

export default async function SettingsUserDetailPage({ params }: { params: { employeeId: string } }) {
  await requireAdminPage();
  return <><PageHeader title="Chi tiết nhân viên" description="Cập nhật whitelist, vai trò và trạng thái hoạt động. Mọi thay đổi đều được audit." breadcrumbs={[{ title: "Thiết lập hệ thống", href: "/settings" }, { title: "Người dùng", href: "/settings/users" }, { title: "Chi tiết nhân viên" }]} /><EmployeeEditor employeeId={params.employeeId} /></>;
}
