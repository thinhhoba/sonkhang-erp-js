import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/route-guard";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const body = await req.json();
    const { content, userName, userId, userAvatar } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: "Nội dung bình luận không được trống" }, { status: 400 });
    }

    const comment = await prisma.postComment.create({
      data: {
        postId: params.id,
        content: content.trim(),
        userName: userName || "Nhân viên Sơn Khang",
        userId: userId || null,
        userAvatar,
      },
    });

    return NextResponse.json({ success: true, data: comment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
