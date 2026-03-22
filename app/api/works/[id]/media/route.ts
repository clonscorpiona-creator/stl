import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

// 🖼️ POST /api/works/[id]/media - добавить медиафайл к работе
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: workId } = await ctx.params;

  const work = await prisma.work.findUnique({ where: { id: workId }, select: { id: true, userId: true, status: true } });
  if (!work || work.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (work.status !== "DRAFT" && work.status !== "REJECTED") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const type = typeof body?.type === "string" ? body.type : "";

  if (!url || (type !== "IMAGE" && type !== "VIDEO" && type !== "AUDIO")) {
    return NextResponse.json({ error: "Invalid media" }, { status: 400 });
  }

  const media = await prisma.workMedia.create({
    data: {
      workId,
      type,
      url,
      sortOrder: 0,
    },
    select: { id: true },
  });

  return NextResponse.json({ media }, { status: 201 });
}
