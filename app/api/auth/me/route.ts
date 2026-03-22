import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

// 👤 GET /api/auth/me - получить текущего пользователя
export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session.userId) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user });
}
