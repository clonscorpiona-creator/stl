import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";
import { createNotification } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: workId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const comment = await prisma.workComment.create({
    data: {
      workId,
      userId: session.userId,
      text,
    },
    select: {
      id: true,
      text: true,
      createdAt: true,
      user: { select: { id: true, username: true, displayName: true } },
    },
  });

  // 📋 Get work details for notification
  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: {
      userId: true,
      title: true,
    }
  });

  // 🔔 Create notification for work author (if not commenting on own work)
  if (work && work.userId !== session.userId) {
    const commenter = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { username: true, displayName: true }
    });

    await createNotification({
      userId: work.userId,
      type: NotificationType.WORK_COMMENT,
      title: "Новый комментарий",
      message: `${commenter?.displayName || commenter?.username} прокомментировал вашу работу "${work.title}"`,
      linkUrl: `/works/${workId}`
    });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
