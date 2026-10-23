import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

const homeByRole: Record<string, string> = { ADMIN:"/pwa/executive", EXECUTIVE:"/pwa/executive", ACCOUNTANT:"/pwa/accounting", SALES:"/pwa/sales", WAREHOUSE:"/pwa/warehouse", DISPATCHER:"/pwa/delivery", DRIVER:"/pwa/delivery" };
export default async function PwaEntry() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string; isActive?: boolean } | undefined;
  if (!user?.id || user.isActive === false) redirect("/auth/signin?callbackUrl=/pwa");
  const target = user.role ? homeByRole[user.role] : undefined;
  redirect(target || "/auth/access-denied");
}
