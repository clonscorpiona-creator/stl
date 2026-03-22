import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 🚫 POST /api/chat/bans - забанить пользователя (модератор/админ)
export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true }
  });

  const isModerator = user?.role === "MODERATOR" || user?.role === "ADMIN";
  if (!isModerator) {
    return NextResponse.json({ error: "Moderator only" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const channelId = typeof body?.channelId === "string" ? body.channelId : null;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : null;
  const durationMinutes = typeof body?.durationMinutes === "number" ? body.durationMinutes : null;

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const expiresAt = durationMinutes
    ? new Date(Date.now() + durationMinutes * 60 * 1000)
    : null;

  try {
    const ban = await prisma.channelBan.create({
      data: {
        userId,
        channelId,
        reason,
        expiresAt,
        bannedById: session.userId
      }
    });

    return NextResponse.json({ ban }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
