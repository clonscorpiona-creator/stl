import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createNotification, type NotificationType } from "@/lib/notifications";

// Valid art directions
const VALID_DIRECTIONS = [
  "ILLUSTRATION",
  "ANIMATION",
  "DESIGN",
  "3D",
  "PHOTOGRAPHY",
  "TRADITIONAL",
  "DIGITAL",
  "CONCEPT_ART",
];

// Inquiry statuses
const INQUIRY_STATUS = {
  NEW: "NEW",
  IN_PROGRESS: "IN_PROGRESS",
  CLOSED: "CLOSED",
} as const;

// 📥 GET /api/inquiries - список заявок текущего пользователя
export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "received"; // received | created

  try {
    const inquiries = await prisma.inquiry.findMany({
      where:
        type === "created"
          ? { creatorUserId: session.userId }
          : { recipientUserId: session.userId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            text: true,
            createdAt: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}

// 📤 POST /api/inquiries - создание новой заявки
export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { recipientUserId, direction, subject, message } = body;

    // ✅ Валидация
    if (!recipientUserId || !direction || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!VALID_DIRECTIONS.includes(direction)) {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
    }

    if (recipientUserId === session.userId) {
      return NextResponse.json(
        { error: "Cannot create inquiry to yourself" },
        { status: 400 }
      );
    }

    // 🔍 Проверка существования получателя
    const recipient = await prisma.user.findUnique({
      where: { id: recipientUserId },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // ✉️ Проверка email verification
    const creator = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!creator?.emailVerifiedAt) {
      return NextResponse.json(
        { error: "Email verification required" },
        { status: 403 }
      );
    }

    // 🚫 Проверка блокировки
    const isBlocked = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: recipientUserId,
          blockedId: session.userId
        }
      }
    });

    if (isBlocked) {
      return NextResponse.json(
        { error: "You are blocked by this user" },
        { status: 403 }
      );
    }

    // ⏱️ Rate limiting: проверка количества заявок за последние 24 часа
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentInquiries = await prisma.inquiry.count({
      where: {
        creatorUserId: session.userId,
        createdAt: { gte: oneDayAgo },
      },
    });

    if (recentInquiries >= 3) {
      return NextResponse.json(
        { error: "Daily inquiry limit reached (3 per day)" },
        { status: 429 }
      );
    }

    // 💾 Создание заявки с первым сообщением
    const inquiry = await prisma.inquiry.create({
      data: {
        creatorUserId: session.userId,
        recipientUserId,
        direction,
        subject,
        status: INQUIRY_STATUS.NEW,
        messages: {
          create: {
            senderUserId: session.userId,
            text: message,
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 🔔 Create notification for recipient
    const sender = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { username: true, displayName: true }
    });

    await createNotification({
      userId: recipientUserId,
      type: "INQUIRY_CREATED",
      title: "Новая заявка",
      message: `${sender?.displayName || sender?.username} отправил вам заявку: ${subject}`,
      link: `/inquiries/${inquiry.id}`
    });

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return NextResponse.json(
      { error: "Failed to create inquiry" },
      { status: 500 }
    );
  }
}
