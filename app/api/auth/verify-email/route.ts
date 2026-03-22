import { prisma } from "@/lib/prisma";
import { sha256Hex } from "@/lib/token";
import { NextResponse, type NextRequest } from "next/server";

// ✉️ POST /api/auth/verify-email - подтвердить email по токену
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const tokenHash = sha256Hex(token);

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { userId: true, expiresAt: true },
  });

  if (!record) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.emailVerificationToken.delete({ where: { tokenHash } });
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.delete({ where: { tokenHash } }),
  ]);

  return NextResponse.json({ ok: true });
}
