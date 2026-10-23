import { PageHeader } from "@/components/ui/PageHeader";
import { SalesRoutePage } from "@/components/sales/SalesRoutePage";
export default function SalesPage() { return <><PageHeader title="Bán hàng" description="Đơn bán, khách hàng, hạn mức và theo dõi đồng bộ." breadcrumbs={[{ title: "Bán hàng" }]} /><SalesRoutePage surface="overview" /></>; }
