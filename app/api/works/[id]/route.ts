import { prisma } from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const work = await prisma.work.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      direction: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      rejectionReason: true,
      user: { select: { id: true, username: true, displayName: true } },
      media: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          type: true,
          url: true,
          previewUrl: true,
          mimeType: true,
          width: true,
          height: true,
          durationSeconds: true,
        },
      },
      _count: { select: { likes: true, comments: true } },
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          text: true,
          createdAt: true,
          user: { select: { id: true, username: true, displayName: true } },
        },
      },
    },
  });

  if (!work) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 🔒 For MVP: show only published works publicly
  if (work.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ work });
}
