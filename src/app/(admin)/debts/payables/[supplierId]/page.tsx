import { DebtRoutePage } from "@/components/debts/DebtRoutePage";

export default function PayableDetailPage({ params }: { params: { supplierId: string } }) {
  return <DebtRoutePage kind="payable-detail" surface="payable-detail" id={params.supplierId} />;
}
