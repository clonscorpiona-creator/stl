import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 🗑️ DELETE /api/news/[slug]/comments/[id] - удалить комментарий
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const comment = await prisma.newsComment.findUnique({
      where: { id },
      select: {
        userId: true,
        deletedAt: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.deletedAt) {
      return NextResponse.json(
        { error: "Comment already deleted" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    // Только автор или модератор/админ могут удалить
    if (comment.userId !== session.userId && user?.role !== "MODERATOR" && user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.newsComment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: session.userId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
