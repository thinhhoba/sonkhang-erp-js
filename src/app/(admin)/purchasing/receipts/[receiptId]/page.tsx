import { ReceiptDetail } from "@/components/purchasing/PurchasingReadOnlyDetail";

export default function PurchasingReceiptDetailPage({ params }: { params: { receiptId: string } }) { return <ReceiptDetail receiptId={params.receiptId} />; }
