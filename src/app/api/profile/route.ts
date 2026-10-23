import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

const profileSelect = {
  id: true, code: true, fullName: true, email: true, phone: true, avatarUrl: true,
  role: true, isActive: true, createdAt: true, updatedAt: true,
} as const;

function profileSnapshot(employee: { fullName: string; phone: string; avatarUrl: string | null }) {
  return { fullName: employee.fullName, phone: employee.phone, avatarUrl: employee.avatarUrl };
}

function readProfileInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid");
  const input = value as Record<string, unknown>;
  const allowed = ["fullName", "phone", "avatarUrl"];
  if (Object.keys(input).some((key) => !allowed.includes(key))) throw new Error("invalid");
  if ("fullName" in input && typeof input.fullName !== "string") throw new Error("invalid");
  if ("phone" in input && typeof input.phone !== "string") throw new Error("invalid");
  if ("avatarUrl" in input && input.avatarUrl !== null && typeof input.avatarUrl !== "string") throw new Error("invalid");
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : undefined;
  const phone = typeof input.phone === "string" ? input.phone.trim() : undefined;
  const avatarUrl = input.avatarUrl === null ? null : typeof input.avatarUrl === "string" ? input.avatarUrl.trim() : undefined;
  if (fullName !== undefined && (!fullName || fullName.length > 160)) throw new Error("invalid");
  if (phone !== undefined && (!/^\+?[0-9 .-]{7,32}$/.test(phone))) throw new Error("invalid");
  if (avatarUrl !== undefined && avatarUrl !== null && (avatarUrl.length > 2048 || !/^https:\/\//i.test(avatarUrl))) throw new Error("invalid");
  if (fullName === undefined && phone === undefined && avatarUrl === undefined) throw new Error("invalid");
  return { fullName, phone, avatarUrl };
}

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const employee = await prisma.employee.findUnique({ where: { id: auth.user.id! }, select: profileSelect });
    if (!employee) return NextResponse.json({ success: false, error: "Không tìm thấy hồ sơ nhân viên" }, { status: 404 });
    return NextResponse.json({ success: true, data: employee });
  } catch {
    console.error("Profile GET failed");
    return NextResponse.json({ success: false, error: "Không thể tải hồ sơ" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    let input: ReturnType<typeof readProfileInput>;
    try { input = readProfileInput(await req.json()); } catch { return NextResponse.json({ success: false, error: "Dữ liệu hồ sơ không hợp lệ" }, { status: 400 }); }
    const employee = await prisma.$transaction(async (tx) => {
      const current = await tx.employee.findUnique({ where: { id: auth.user.id! }, select: { id: true, fullName: true, phone: true, avatarUrl: true } });
      if (!current) throw new Error("not-found");
      const updated = await tx.employee.update({ where: { id: auth.user.id! }, data: input, select: profileSelect });
      await tx.auditLog.create({ data: { employeeId: auth.user.id!, action: "UPDATE_OWN_PROFILE", targetId: auth.user.id!, oldValue: JSON.stringify(profileSnapshot(current)), newValue: JSON.stringify(profileSnapshot(updated)), note: "Cập nhật hồ sơ cá nhân" } });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    if (error instanceof Error && error.message === "not-found") return NextResponse.json({ success: false, error: "Không tìm thấy hồ sơ nhân viên" }, { status: 404 });
    console.error("Profile PUT failed");
    return NextResponse.json({ success: false, error: "Không thể cập nhật hồ sơ" }, { status: 500 });
  }
}
