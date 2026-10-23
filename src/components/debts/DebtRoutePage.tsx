import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessDebtSurface, type DebtSurface } from "@/lib/debts";
import { DebtPage, type DebtPageKind } from "@/components/debts/DebtPage";

export async function DebtRoutePage({
  kind,
  surface,
  id,
}: {
  kind: DebtPageKind;
  surface: DebtSurface;
  id?: string;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string; isActive?: boolean } | undefined;
  if (!user?.id || user.isActive === false) redirect("/auth/signin");
  if (!canAccessDebtSurface(user.role, surface)) redirect("/auth/access-denied");
  return <DebtPage kind={kind} id={id} canViewPayables={canAccessDebtSurface(user.role, "payables")} />;
}
