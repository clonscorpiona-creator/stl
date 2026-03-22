import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// ✅ POST /api/notifications/mark-all-read - отметить все уведомления как прочитанные
export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: session.userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error marking all as read:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
