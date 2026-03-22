import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

// ✏️ GET /api/works/[id]/manage - получить работу для редактирования
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const work = await prisma.work.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      direction: true,
      status: true,
      rejectionReason: true,
      createdAt: true,
      publishedAt: true,
      media: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, type: true, url: true, sortOrder: true },
      },
    },
  });

  if (!work || work.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ work });
}
