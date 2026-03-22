import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { InquiryStatus } from "@prisma/client";

// 📋 GET /api/inquiries/[id] - просмотр заявки
export async function GET(
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
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
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
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 🔒 Проверка доступа
    if (
      inquiry.creatorUserId !== session.userId &&
      inquiry.recipientUserId !== session.userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ inquiry });
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiry" },
      { status: 500 }
    );
  }
}

// 💾 PATCH /api/inquiries/[id] - обновление статуса заявки
export async function PATCH(
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
    const { action } = body; // accept | close

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 🔒 Только получатель может менять статус
    if (inquiry.recipientUserId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let newStatus: InquiryStatus;
    let closedAt: Date | null = null;

    if (action === "accept") {
      newStatus = InquiryStatus.ACTIVE;
    } else if (action === "close") {
      newStatus = InquiryStatus.CLOSED;
      closedAt = new Date();
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: {
        status: newStatus,
        closedAt,
      },
    });

    return NextResponse.json({ inquiry: updated });
  } catch (error) {
    console.error("Error updating inquiry:", error);
    return NextResponse.json(
      { error: "Failed to update inquiry" },
      { status: 500 }
    );
  }
}
