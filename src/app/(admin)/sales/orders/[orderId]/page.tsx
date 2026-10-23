import { PageHeader } from "@/components/ui/PageHeader";
import { SalesRoutePage } from "@/components/sales/SalesRoutePage";
export default function SalesOrderPage({ params }: { params: { orderId: string } }) { return <><PageHeader title="Chi tiết đơn bán" breadcrumbs={[{ title: "Bán hàng", href: "/sales" }, { title: "Đơn bán", href: "/sales/orders" }, { title: "Chi tiết" }]} /><SalesRoutePage surface="order-detail" id={params.orderId} /></>; }
