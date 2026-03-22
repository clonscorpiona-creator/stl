import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/moderation";
import { NextResponse, type NextRequest } from "next/server";

// 🔍 GET /api/moderation/works - получить работы на модерации
export async function GET(req: NextRequest) {
  const auth = await requireModerator(req);
  if (!auth.ok) return auth.response;

  const works = await prisma.work.findMany({
    where: { status: "MODERATION" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      direction: true,
      createdAt: true,
      user: { select: { id: true, username: true, email: true } },
    },
  });

  return NextResponse.json({ works });
}
