import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/route-guard";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { id } = params;
    const body = await req.json();

    const note = await prisma.internalNote.update({
      where: { id },
      data: {
        isResolved: body.isResolved !== undefined ? Boolean(body.isResolved) : undefined,
        content: body.content !== undefined ? String(body.content) : undefined,
        urgency: body.urgency !== undefined ? String(body.urgency) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error: any) {
    console.error("[API Notes PATCH] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authDel = await requireSession();
    if ("error" in authDel) return authDel.error;
    const { id } = params;

    await prisma.internalNote.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Đã xóa ghi chú" });
  } catch (error: any) {
    console.error("[API Notes DELETE] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
