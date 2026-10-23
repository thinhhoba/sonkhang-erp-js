import { PageHeader } from "@/components/ui/PageHeader";
import { SalesRoutePage } from "@/components/sales/SalesRoutePage";
export default function SalesCustomerPage({ params }: { params: { customerId: string } }) { return <><PageHeader title="Hồ sơ khách hàng" breadcrumbs={[{ title: "Bán hàng", href: "/sales" }, { title: "Khách hàng", href: "/sales/customers" }, { title: "Chi tiết" }]} /><SalesRoutePage surface="customer-detail" id={params.customerId} /></>; }
