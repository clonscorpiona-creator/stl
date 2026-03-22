import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 🔍 GET /api/users/[username]/block - проверить статус блокировки
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await params;

  try {
    const userToCheck = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!userToCheck) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const block = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.userId,
          blockedId: userToCheck.id
        }
      }
    });

    return NextResponse.json({ isBlocked: !!block });
  } catch (error) {
    console.error("Error checking block status:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
