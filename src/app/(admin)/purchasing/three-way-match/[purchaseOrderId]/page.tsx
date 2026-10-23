import { ThreeWayMatch } from "@/components/purchasing/ThreeWayMatch";

export default function ThreeWayMatchPage({ params }: { params: { purchaseOrderId: string } }) { return <ThreeWayMatch purchaseOrderId={params.purchaseOrderId} />; }
