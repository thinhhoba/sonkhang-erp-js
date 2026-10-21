import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export interface SessionUser {
  id?: string;
  role?: string;
  isActive?: boolean;
  fullName?: string;
  code?: string;
}

/**
 * Lấy session, trả 401 nếu chưa đăng nhập hoặc tài khoản bị khóa.
 * Trả về { session, user } hoặc NextResponse lỗi.
 */
export async function requireSession(): Promise<
  { session: any; user: SessionUser } | { error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  const user = (session?.user || {}) as SessionUser;

  if (!session || !user?.id) {
    return {
      error: NextResponse.json(
        { success: false, error: "Chưa đăng nhập!" },
        { status: 401 }
      ),
    };
  }

  if (user.isActive === false) {
    return {
      error: NextResponse.json(
        { success: false, error: "Tài khoản đã bị khóa!" },
        { status: 401 }
      ),
    };
  }

  return { session, user };
}

/**
 * Kiểm tra vai trò, trả 403 nếu không đủ quyền.
 */
export function requireRole(
  user: SessionUser,
  allowedRoles: string[]
): NextResponse | null {
  if (!user.role || !allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { success: false, error: "Không có quyền thực hiện thao tác này!" },
      { status: 403 }
    );
  }
  return null;
}
