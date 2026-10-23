import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/route-guard";
import { SettingsValidationError, validateEmployeeInput } from "@/lib/settings-validation";
import { isSerializationConflict, withSerializableRetry } from "@/lib/settings-transaction";

export const dynamic = "force-dynamic";

const employeeSelect = {
  id: true, code: true, fullName: true, email: true, phone: true, avatarUrl: true, role: true, isActive: true,
  baseSalary: true, ratePerTrip: true, ratePerStop: true, ratePerKg: true, createdAt: true, updatedAt: true,
} as const;

type Context = { params: { employeeId: string } };

function employeeAuditSnapshot(employee: { code: string; fullName: string; email: string; phone: string; avatarUrl: string | null; role: string; isActive: boolean }) {
  return { code: employee.code, fullName: employee.fullName, email: employee.email, phone: employee.phone, avatarUrl: employee.avatarUrl, role: employee.role, isActive: employee.isActive };
}

async function authorize() {
  const auth = await requireSession();
  if ("error" in auth) return auth;
  const forbidden = requireRole(auth.user, ["ADMIN"]);
  return forbidden ? { error: forbidden } : auth;
}

export async function GET(_: Request, { params }: Context) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  try {
    const employee = await prisma.employee.findUnique({ where: { id: params.employeeId }, select: employeeSelect });
    if (!employee) return NextResponse.json({ success: false, error: "Không tìm thấy nhân viên." }, { status: 404 });
    return NextResponse.json({ success: true, data: employee });
  } catch {
    return NextResponse.json({ success: false, error: "Không thể tải thông tin nhân viên." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;
  try {
    if (!params.employeeId?.trim()) return NextResponse.json({ success: false, error: "Mã nhân viên không hợp lệ." }, { status: 400 });
    const input = validateEmployeeInput(await request.json());
    const data = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Prisma.EmployeeUpdateInput;
    if (!Object.keys(data).length) return NextResponse.json({ success: false, error: "Không có thay đổi hợp lệ." }, { status: 400 });
    const updated = await withSerializableRetry(() => prisma.$transaction(async (tx) => {
      const current = await tx.employee.findUnique({ where: { id: params.employeeId }, select: employeeSelect });
      if (!current) throw new Error("NOT_FOUND");
      const demotesAdmin = current.role === "ADMIN" && ((input.role !== undefined && input.role !== "ADMIN") || input.isActive === false);
      if (demotesAdmin) {
        const activeAdminCount = await tx.employee.count({ where: { role: "ADMIN", isActive: true } });
        if (activeAdminCount <= 1) throw new Error("LAST_ADMIN");
      }
      const changesOwnSecurity = current.id === auth.user.id && (
        (input.role !== undefined && input.role !== current.role) ||
        (input.isActive !== undefined && input.isActive !== current.isActive) ||
        (input.email !== undefined && input.email !== current.email)
      );
      if (changesOwnSecurity) {
        throw new Error("SELF_SECURITY_CHANGE");
      }
      const employee = await tx.employee.update({ where: { id: current.id }, data, select: employeeSelect });
      await tx.auditLog.create({ data: { employeeId: auth.user.id!, action: "UPDATE_EMPLOYEE", targetId: employee.id, oldValue: JSON.stringify(employeeAuditSnapshot(current)), newValue: JSON.stringify(employeeAuditSnapshot(employee)), note: `Cập nhật tài khoản ${employee.fullName}` } });
      return employee;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể cập nhật nhân viên.";
    if (message === "NOT_FOUND") return NextResponse.json({ success: false, error: "Không tìm thấy nhân viên." }, { status: 404 });
    if (message === "LAST_ADMIN") return NextResponse.json({ success: false, error: "Không thể khóa hoặc hạ quyền quản trị viên cuối cùng." }, { status: 409 });
    if (message === "SELF_SECURITY_CHANGE") return NextResponse.json({ success: false, error: "Không thể tự thay đổi email, vai trò hoặc trạng thái hoạt động của tài khoản đang đăng nhập." }, { status: 409 });
    if (isSerializationConflict(error)) return NextResponse.json({ success: false, error: "Dữ liệu vừa được thay đổi bởi phiên khác. Vui lòng tải lại và thử lại." }, { status: 409 });
    if (error instanceof SettingsValidationError) return NextResponse.json({ success: false, error: message }, { status: 400 });
    return NextResponse.json({ success: false, error: "Mã, email hoặc số điện thoại đã tồn tại." }, { status: 409 });
  }
}
