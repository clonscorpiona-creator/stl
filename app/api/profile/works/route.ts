import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

// 📁 GET /api/profile/works - получить все работы текущего пользователя
export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const works = await prisma.work.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      direction: true,
      status: true,
      createdAt: true,
      publishedAt: true,
      rejectionReason: true,
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({ works });
}
