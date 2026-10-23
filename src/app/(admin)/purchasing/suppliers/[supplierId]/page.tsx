import { SupplierDetail } from "@/components/purchasing/PurchasingReadOnlyDetail";

export default function PurchasingSupplierDetailPage({ params }: { params: { supplierId: string } }) { return <SupplierDetail supplierId={params.supplierId} />; }
