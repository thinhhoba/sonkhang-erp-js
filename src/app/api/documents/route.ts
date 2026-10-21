import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/route-guard";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { docCode: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { referenceId: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
      ];
    }

    const docs = await prisma.documentRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const authPost = await requireSession();
    if ("error" in authPost) return authPost.error;
    const body = await req.json();
    const { title, category, fileUrl, fileType, fileSizeKb, referenceId, uploadedById, uploaderName, tags, notes } = body;

    const count = await prisma.documentRecord.count();
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const docCode = `CT-${todayStr}-${String(count + 1).padStart(4, "0")}`;

    const doc = await prisma.documentRecord.create({
      data: {
        docCode,
        title,
        category: category || "OTHER",
        fileUrl: fileUrl || "https://drive.google.com/sonkhang-docs",
        fileType: fileType || "PDF",
        fileSizeKb: Number(fileSizeKb) || 250,
        referenceId,
        uploadedById,
        uploaderName: uploaderName || "Quản trị viên",
        tags,
        notes,
      },
    });

    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
