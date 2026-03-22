import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

// 📤 POST /api/works/[id]/submit - отправить работу на модерацию
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const work = await prisma.work.findUnique({ where: { id }, select: { id: true, userId: true, status: true } });
  if (!work || work.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (work.status !== "DRAFT" && work.status !== "REJECTED") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.work.update({
    where: { id },
    data: { status: "MODERATION", rejectionReason: null },
    select: { id: true, status: true },
  });

  return NextResponse.json({ work: updated });
}
