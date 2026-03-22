import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 🚫 POST /api/users/[username]/block - заблокировать пользователя
export async function POST(
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
    // 🔍 Найти пользователя для блокировки
    const userToBlock = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true }
    });

    if (!userToBlock) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ⛔ Нельзя заблокировать самого себя
    if (userToBlock.id === session.userId) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    // 💾 Создать блокировку
    await prisma.userBlock.create({
      data: {
        blockerId: session.userId,
        blockedId: userToBlock.id
      }
    });

    return NextResponse.json({ ok: true, blocked: userToBlock.username });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "User already blocked" }, { status: 409 });
    }
    console.error("Error blocking user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ✅ DELETE /api/users/[username]/block - разблокировать пользователя
export async function DELETE(
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
    // 🔍 Найти пользователя для разблокировки
    const userToUnblock = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true }
    });

    if (!userToUnblock) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🗑️ Удалить блокировку
    const deleted = await prisma.userBlock.deleteMany({
      where: {
        blockerId: session.userId,
        blockedId: userToUnblock.id
      }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "User not blocked" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, unblocked: userToUnblock.username });
  } catch (error) {
    console.error("Error unblocking user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
