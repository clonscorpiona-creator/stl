import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 💬 GET /api/chat/channels/[slug]/messages - получить сообщения канала
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

  try {
    const channel = await prisma.channel.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const messages = await prisma.channelMessage.findMany({
      where: {
        channelId: channel.id,
        deletedAt: null
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        text: true,
        stickerId: true,
        createdAt: true,
        editedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json({ messages: messages.reverse() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 📤 POST /api/chat/channels/[slug]/messages - отправить сообщение
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const res = NextResponse.next();
  const session = await getSession(req, res);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { emailVerifiedAt: true, isBanned: true }
  });

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Email not verified" }, { status: 403 });
  }

  if (user.isBanned) {
    return NextResponse.json({ error: "User is banned" }, { status: 403 });
  }

  const channel = await prisma.channel.findUnique({
    where: { slug },
    select: { id: true, isReadonly: true }
  });

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  // 🚫 Проверка бана в канале
  const ban = await prisma.channelBan.findFirst({
    where: {
      userId: session.userId,
      OR: [
        { channelId: channel.id },
        { channelId: null } // глобальный бан
      ],
      AND: [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      ]
    }
  });

  if (ban) {
    return NextResponse.json({ error: "You are banned from this channel" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const type = body?.type === "STICKER" ? "STICKER" : "TEXT";
  const text = typeof body?.text === "string" ? body.text.trim() : null;
  const stickerId = typeof body?.stickerId === "string" ? body.stickerId : null;

  if (type === "TEXT" && !text) {
    return NextResponse.json({ error: "Message text required" }, { status: 400 });
  }

  if (type === "STICKER" && !stickerId) {
    return NextResponse.json({ error: "Sticker ID required" }, { status: 400 });
  }

  try {
    const message = await prisma.channelMessage.create({
      data: {
        channelId: channel.id,
        userId: session.userId,
        type,
        text,
        stickerId
      },
      select: {
        id: true,
        type: true,
        text: true,
        stickerId: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true
          }
        }
      }
    });

    // 📡 Emit WebSocket event to channel room
    if (global.io) {
      global.io.to(`channel:${slug}`).emit('new-message', message);
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
