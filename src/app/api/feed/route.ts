import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/route-guard";

export async function GET() {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const posts = await prisma.companyPost.findMany({
      include: {
        reactions: true,
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ success: true, data: posts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const body = await req.json();
    const { title, content, department, postType, authorName, authorRole, pinned } = body;

    const post = await prisma.companyPost.create({
      data: {
        title,
        content,
        department: department || "GENERAL",
        postType: postType || "ANNOUNCEMENT",
        authorName: authorName || "Ban Giám Đốc",
        authorRole: authorRole || "Quản trị viên",
        pinned: Boolean(pinned),
      },
      include: {
        reactions: true,
        comments: true,
      },
    });

    return NextResponse.json({ success: true, data: post });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
