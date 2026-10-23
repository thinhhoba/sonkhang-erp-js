import { PurchaseOrderEditor } from "@/components/purchasing/PurchaseOrderEditor";

export default function PurchaseOrderDetailPage({ params }: { params: { purchaseOrderId: string } }) { return <PurchaseOrderEditor purchaseOrderId={params.purchaseOrderId} />; }
