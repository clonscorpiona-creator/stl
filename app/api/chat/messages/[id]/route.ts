import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 🗑️ DELETE /api/chat/messages/[id] - удалить сообщение (модератор или автор)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  const session = await getSession(req, res);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: messageId } = await params;

  const message = await prisma.channelMessage.findUnique({
    where: { id: messageId },
    select: { userId: true, deletedAt: true }
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (message.deletedAt) {
    return NextResponse.json({ error: "Already deleted" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true }
  });

  const isModerator = user?.role === "MODERATOR" || user?.role === "ADMIN";
  const isAuthor = message.userId === session.userId;

  // 🔒 Только модератор или автор могут удалить
  if (!isModerator && !isAuthor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const deletedMessage = await prisma.channelMessage.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        deletedById: session.userId
      },
      select: {
        id: true,
        channel: {
          select: { slug: true }
        }
      }
    });

    // 📡 Emit WebSocket event to channel room
    if (global.io) {
      global.io.to(`channel:${deletedMessage.channel.slug}`).emit('message-deleted', messageId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
