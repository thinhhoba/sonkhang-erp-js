import { PurchaseInvoiceDetail } from "@/components/purchasing/PurchasingReadOnlyDetail";

export default function PurchasingInvoiceDetailPage({ params }: { params: { invoiceId: string } }) { return <PurchaseInvoiceDetail invoiceId={params.invoiceId} />; }
