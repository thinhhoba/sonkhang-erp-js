import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/route-guard";
import { parsePositiveInt } from "@/lib/settings-validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const forbidden = requireRole(auth.user, ["ADMIN"]);
  if (forbidden) return forbidden;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action")?.trim();
  const employeeId = searchParams.get("employeeId")?.trim();
  const page = parsePositiveInt(searchParams.get("page"), 1, 10_000);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 30, 100);
  const where = { ...(action ? { action } : {}), ...(employeeId ? { employeeId } : {}) };
  try {
    const [data, total] = await prisma.$transaction([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, action: true, targetId: true, oldValue: true, newValue: true, note: true, createdAt: true, employee: { select: { id: true, code: true, fullName: true, role: true } } } }),
      prisma.auditLog.count({ where }),
    ]);
    return NextResponse.json({ success: true, data, pagination: { page, pageSize, total } });
  } catch {
    return NextResponse.json({ success: false, error: "Không thể tải nhật ký hệ thống." }, { status: 500 });
  }
}
