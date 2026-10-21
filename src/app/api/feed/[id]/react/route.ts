import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/route-guard";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const body = await req.json();
    const { userId, userName, reactionType } = body;

    const existing = await prisma.postReaction.findUnique({
      where: {
        postId_userId: {
          postId: params.id,
          userId: userId || "user-default",
        },
      },
    });

    if (existing) {
      // Toggle off
      await prisma.postReaction.delete({
        where: { id: existing.id },
      });
      await prisma.companyPost.update({
        where: { id: params.id },
        data: { likesCount: { decrement: 1 } },
      });
      return NextResponse.json({ success: true, action: "UNREACTED" });
    }

    await prisma.postReaction.create({
      data: {
        postId: params.id,
        userId: userId || "user-default",
        userName: userName || "Nhân viên Sơn Khang",
        reactionType: reactionType || "HEART",
      },
    });

    await prisma.companyPost.update({
      where: { id: params.id },
      data: { likesCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, action: "REACTED" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
