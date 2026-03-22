import { prisma } from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";

// 👤 GET /api/users/[username] - получить профиль пользователя и его работы
export async function GET(_req: NextRequest, ctx: { params: Promise<{ username: string }> }) {
  const { username } = await ctx.params;
  const u = (username ?? "").trim();

  if (!u) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { username: u },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      howToWork: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const works = await prisma.work.findMany({
    where: { userId: user.id, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      description: true,
      direction: true,
      publishedAt: true,
      createdAt: true,
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({ user, works });
}
