import { PageHeader } from "@/components/ui/PageHeader";
import { SalesRoutePage } from "@/components/sales/SalesRoutePage";
export default function SalesSyncStatusPage() { return <><PageHeader title="Trạng thái đồng bộ" breadcrumbs={[{ title: "Bán hàng", href: "/sales" }, { title: "Đồng bộ" }]} /><SalesRoutePage surface="sync-status" /></>; }
