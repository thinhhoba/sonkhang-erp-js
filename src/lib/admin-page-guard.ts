import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

/** Defense in depth for admin pages; middleware is not the only authorization boundary. */
export async function requireAdminPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string; isActive?: boolean } | undefined;
  if (!user?.id || user.isActive === false) redirect("/auth/signin");
  if (user.role !== "ADMIN") redirect("/auth/access-denied");
  return user;
}
