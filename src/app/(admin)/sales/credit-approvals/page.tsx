import { PageHeader } from "@/components/ui/PageHeader";
import { SalesRoutePage } from "@/components/sales/SalesRoutePage";
export default function CreditApprovalsPage() { return <><PageHeader title="Phê duyệt hạn mức" description="Chỉ ADMIN được thực hiện quyết định." breadcrumbs={[{ title: "Bán hàng", href: "/sales" }, { title: "Phê duyệt hạn mức" }]} /><SalesRoutePage surface="credit-approvals" /></>; }
