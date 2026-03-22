import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";
import { createNotification, type NotificationType } from "@/lib/notifications";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: workId } = await ctx.params;

  try {
    await prisma.workLike.create({
      data: {
        userId: session.userId,
        workId,
      },
    });

    // 📋 Get work details for notification
    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: {
        userId: true,
        title: true,
        user: {
          select: { username: true, displayName: true }
        }
      }
    });

    // 🔔 Create notification for work author (if not liking own work)
    if (work && work.userId !== session.userId) {
      const liker = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { username: true, displayName: true }
      });

      await createNotification({
        userId: work.userId,
        type: NotificationType.WORK_LIKE,
        title: "Новый лайк",
        message: `${liker?.displayName || liker?.username} оценил вашу работу "${work.title}"`,
        linkUrl: `/works/${workId}`
      });
    }
  } catch (e: any) {
    if (e?.code !== "P2002") {
      console.error(e);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }

  const count = await prisma.workLike.count({ where: { workId } });
  return NextResponse.json({ ok: true, likes: count });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: workId } = await ctx.params;

  await prisma.workLike.delete({
    where: {
      userId_workId: { userId: session.userId, workId },
    },
  });

  const count = await prisma.workLike.count({ where: { workId } });
  return NextResponse.json({ ok: true, likes: count });
}
