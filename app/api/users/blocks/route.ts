import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 🚫 GET /api/users/blocks - получить список заблокированных пользователей
export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const blocks = await prisma.userBlock.findMany({
      where: { blockerId: session.userId },
      select: {
        blockedId: true,
        createdAt: true,
        blocked: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ blocks });
  } catch (error) {
    console.error("Error fetching blocks:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
