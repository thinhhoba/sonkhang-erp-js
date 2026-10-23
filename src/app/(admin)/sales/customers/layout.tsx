import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Server-derived capability keeps accountant UI aligned with API policy. */
export default async function SalesCustomersLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const canManage = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  return React.isValidElement(children) ? React.cloneElement(children, { canManage } as { canManage: boolean }) : children;
}
