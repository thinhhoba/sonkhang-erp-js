import { PageHeader } from "@/components/ui/PageHeader";
import { SalesRoutePage } from "@/components/sales/SalesRoutePage";
export default function SalesOrdersPage() { return <><PageHeader title="Đơn bán" description="Dữ liệu nguồn từ Sapo." breadcrumbs={[{ title: "Bán hàng", href: "/sales" }, { title: "Đơn bán" }]} /><SalesRoutePage surface="orders" /></>; }
