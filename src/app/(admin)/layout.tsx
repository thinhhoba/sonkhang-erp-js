import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ErpShell, type ShellUser } from "@/components/erp/ErpShell";
import { isAdminShellRole } from "@/config/navigation";

/**
 * The desktop shell fails closed before rendering any protected page. More
 * granular resource authorization remains enforced by route handlers.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const sessionUser = (session?.user || {}) as {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    fullName?: string;
    role?: string;
    code?: string;
    isActive?: boolean;
  };

  if (!sessionUser.id || sessionUser.isActive === false) redirect("/auth/signin");
  if (sessionUser.role === "DRIVER") redirect("/driver-app");
  if (!isAdminShellRole(sessionUser.role)) redirect("/auth/access-denied");

  const user: ShellUser = {
    id: sessionUser.id,
    name: sessionUser.fullName || sessionUser.name || "Người dùng Sơn Khang",
    email: sessionUser.email || undefined,
    image: sessionUser.image || undefined,
    role: sessionUser.role,
    code: sessionUser.code || undefined,
  };

  return <ErpShell user={user}>{children}</ErpShell>;
}
