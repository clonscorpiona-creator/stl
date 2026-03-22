import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 💬 GET /api/chat/channels - получить список каналов
export async function GET() {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        isReadonly: true,
        _count: {
          select: { messages: true }
        }
      }
    });

    return NextResponse.json({ channels });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 📝 POST /api/chat/channels - создать новый канал (только админ)
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
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : null;
  const isReadonly = body?.isReadonly === true;

  if (!slug || !title) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const channel = await prisma.channel.create({
      data: {
        slug,
        title,
        description,
        isReadonly,
        createdById: session.userId
      }
    });

    return NextResponse.json({ channel }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Channel slug already exists" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
