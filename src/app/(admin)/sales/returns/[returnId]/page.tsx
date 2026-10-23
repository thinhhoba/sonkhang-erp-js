import { PageHeader } from "@/components/ui/PageHeader";
import { SalesRoutePage } from "@/components/sales/SalesRoutePage";
export default function SalesReturnPage({ params }: { params: { returnId: string } }) { return <><PageHeader title="Chi tiết hàng trả" breadcrumbs={[{ title: "Bán hàng", href: "/sales" }, { title: "Hàng trả", href: "/sales/returns" }, { title: "Chi tiết" }]} /><SalesRoutePage surface="return-detail" id={params.returnId} /></>; }
