import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// ✅ DELETE /api/chat/bans/[id] - удалить бан (разбанить)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (user?.role !== "ADMIN" && user?.role !== "MODERATOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const ban = await prisma.channelBan.findUnique({
      where: { id },
    });

    if (!ban) {
      return NextResponse.json({ error: "Ban not found" }, { status: 404 });
    }

    await prisma.channelBan.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting ban:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
