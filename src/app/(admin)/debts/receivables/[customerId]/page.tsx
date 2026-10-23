import { DebtRoutePage } from "@/components/debts/DebtRoutePage";

export default function ReceivableDetailPage({ params }: { params: { customerId: string } }) {
  return <DebtRoutePage kind="receivable-detail" surface="receivable-detail" id={params.customerId} />;
}
