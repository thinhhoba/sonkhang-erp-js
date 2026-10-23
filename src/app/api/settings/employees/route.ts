import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/route-guard";
import { parsePositiveInt, SettingsValidationError, validateEmployeeInput } from "@/lib/settings-validation";

function employeeAuditSnapshot(employee: { code: string; fullName: string; email: string; phone: string; avatarUrl: string | null; role: string; isActive: boolean }) {
  return { code: employee.code, fullName: employee.fullName, email: employee.email, phone: employee.phone, avatarUrl: employee.avatarUrl, role: employee.role, isActive: employee.isActive };
}

export const dynamic = "force-dynamic";

const employeeSelect = {
  id: true, code: true, fullName: true, email: true, phone: true, avatarUrl: true,
  role: true, isActive: true, createdAt: true, updatedAt: true,
} as const;

export async function GET(request: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const forbidden = requireRole(auth.user, ["ADMIN"]);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const role = searchParams.get("role")?.trim();
  const page = parsePositiveInt(searchParams.get("page"), 1, 10_000);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 20, 100);
  const where = {
    ...(role && role !== "ALL" ? { role } : {}),
    ...(q ? { OR: [
      { fullName: { contains: q, mode: "insensitive" as const } },
      { email: { contains: q, mode: "insensitive" as const } },
      { code: { contains: q, mode: "insensitive" as const } },
    ] } : {}),
  };
  try {
    const [data, total] = await prisma.$transaction([
      prisma.employee.findMany({ where, select: employeeSelect, orderBy: { fullName: "asc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.employee.count({ where }),
    ]);
    return NextResponse.json({ success: true, data, pagination: { page, pageSize, total } });
  } catch {
    return NextResponse.json({ success: false, error: "Không thể tải danh sách nhân viên." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const forbidden = requireRole(auth.user, ["ADMIN"]);
  if (forbidden) return forbidden;
  try {
    const input = validateEmployeeInput(await request.json(), { create: true });
    const created = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: { code: input.code!, fullName: input.fullName!, email: input.email!, phone: input.phone!, avatarUrl: input.avatarUrl, role: input.role || "DRIVER", isActive: input.isActive ?? true },
        select: employeeSelect,
      });
      await tx.auditLog.create({ data: { employeeId: auth.user.id!, action: "CREATE_EMPLOYEE", targetId: employee.id, oldValue: JSON.stringify({ code: null, fullName: null, email: null, phone: null, avatarUrl: null, role: null, isActive: null }), newValue: JSON.stringify(employeeAuditSnapshot(employee)), note: `Tạo tài khoản ${employee.fullName}` } });
      return employee;
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tạo nhân viên.";
    const status = error instanceof SettingsValidationError ? 400 : 409;
    return NextResponse.json({ success: false, error: status === 409 ? "Mã, email hoặc số điện thoại đã tồn tại." : message }, { status });
  }
}
