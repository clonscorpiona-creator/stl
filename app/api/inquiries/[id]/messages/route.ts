import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createNotification, type NotificationType } from "@/lib/notifications";

// 📤 POST /api/inquiries/[id]/messages - отправка сообщения в заявке
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  const session = await getSession(req, res);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { text } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 }
      );
    }

    // 🔍 Проверка существования заявки и доступа
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, username: true, displayName: true } },
        recipient: { select: { id: true, username: true, displayName: true } }
      }
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    // 🔒 Проверка доступа
    if (
      inquiry.creatorUserId !== session.userId &&
      inquiry.recipientUserId !== session.userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ Проверка статуса заявки
    if (inquiry.status === "CLOSED") {
      return NextResponse.json(
        { error: "Cannot send messages to closed inquiry" },
        { status: 400 }
      );
    }

    // ⏱️ Rate limiting: проверка количества сообщений за последние 1 минуту
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentMessages = await prisma.inquiryMessage.count({
      where: {
        inquiryId: id,
        senderUserId: session.userId,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentMessages >= 5) {
      return NextResponse.json(
        { error: "Message rate limit exceeded (5 per minute)" },
        { status: 429 }
      );
    }

    // 💾 Создание сообщения
    const message = await prisma.inquiryMessage.create({
      data: {
        inquiryId: id,
        senderUserId: session.userId,
        text: text.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        attachments: true,
      },
    });

    // 🔄 Обновление updatedAt заявки
    await prisma.inquiry.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // 🔔 Create notification for the other party
    const recipientId = session.userId === inquiry.creatorUserId
      ? inquiry.recipientUserId
      : inquiry.creatorUserId;

    const sender = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { username: true, displayName: true }
    });

    await createNotification({
      userId: recipientId,
      type: "INQUIRY_MESSAGE",
      title: "Новое сообщение в заявке",
      message: `${sender?.displayName || sender?.username}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
      link: `/inquiries/${id}`
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
