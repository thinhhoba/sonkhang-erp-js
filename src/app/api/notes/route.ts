import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");

    const where: any = {};
    if (department && department !== "ALL") {
      where.department = department;
    }

    const notes = await prisma.internalNote.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            code: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error: any) {
    console.error("[API Notes GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authPost = await requireSession();
    if ("error" in authPost) return authPost.error;
    const body = await req.json();
    const { authorName, department, content, urgency = "NORMAL", employeeId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Nội dung ghi chú không được để trống" },
        { status: 400 }
      );
    }

    const note = await prisma.internalNote.create({
      data: {
        authorName: authorName || "Kế toán / Điều phối",
        department: department || "GENERAL",
        content: content.trim(),
        urgency: urgency || "NORMAL",
        employeeId: employeeId || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            code: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (error: any) {
    console.error("[API Notes POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
