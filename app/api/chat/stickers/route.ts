import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 😊 GET /api/chat/stickers - получить список стикеров
export async function GET() {
  try {
    const stickers = await prisma.sticker.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        src: true
      }
    });

    return NextResponse.json({ stickers });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 📝 POST /api/chat/stickers - создать стикер (только админ)
export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true }
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const src = typeof body?.src === "string" ? body.src.trim() : "";
  const order = typeof body?.order === "number" ? body.order : 0;

  if (!id || !title || !src) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const sticker = await prisma.sticker.create({
      data: { id, title, src, order }
    });

    return NextResponse.json({ sticker }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Sticker ID already exists" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
