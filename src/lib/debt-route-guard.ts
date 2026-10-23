import { NextResponse } from "next/server";
import { canAccessDebtSurface, type DebtSurface } from "@/lib/debts";
import { requireSession, type SessionUser } from "@/lib/route-guard";

export async function requireDebtApiAccess(surface: DebtSurface): Promise<
  { user: SessionUser } | { error: NextResponse }
> {
  const auth = await requireSession();
  if ("error" in auth) return auth;
  if (!canAccessDebtSurface(auth.user.role, surface)) {
    return {
      error: NextResponse.json(
        { success: false, error: "Không có quyền truy cập dữ liệu công nợ này." },
        { status: 403 }
      ),
    };
  }
  return { user: auth.user };
}
