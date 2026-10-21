import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    // Lấy thông tin tài khoản đang đăng nhập (Ưu tiên Admin trong DB)
    let employee = await prisma.employee.findFirst({
      where: { role: "ADMIN" },
      include: {
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!employee) {
      employee = await prisma.employee.findFirst({
        include: {
          auditLogs: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });
    }

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Chưa có thông tin nhân viên trong hệ thống" },
        { status: 404 }
      );
    }

    // Đếm tổng số thao tác
    const totalLogs = await prisma.auditLog.count({
      where: { employeeId: employee.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...employee,
        totalAuditLogs: totalLogs,
      },
    });
  } catch (error: any) {
    console.error("[API Profile GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authPut = await requireSession();
    if ("error" in authPut) return authPut.error;
    const body = await req.json();
    const { id, fullName, phone, ratePerTrip, ratePerStop, ratePerKg, baseSalary } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID nhân viên" }, { status: 400 });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        fullName: fullName || undefined,
        phone: phone || undefined,
        ratePerTrip: ratePerTrip !== undefined ? Number(ratePerTrip) : undefined,
        ratePerStop: ratePerStop !== undefined ? Number(ratePerStop) : undefined,
        ratePerKg: ratePerKg !== undefined ? Number(ratePerKg) : undefined,
        baseSalary: baseSalary !== undefined ? Number(baseSalary) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[API Profile PUT] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
