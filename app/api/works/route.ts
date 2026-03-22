import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

// 📚 GET /api/works - получить список опубликованных работ
export async function GET() {
  const works = await prisma.work.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      description: true,
      direction: true,
      publishedAt: true,
      createdAt: true,
      user: { select: { id: true, username: true, displayName: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({ works });
}

// ➕ POST /api/works - создать новую работу
export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const direction = typeof body?.direction === "string" ? body.direction : null;

  if (!title || !description || !direction) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const work = await prisma.work.create({
    data: {
      userId: session.userId,
      title,
      description,
      direction,
      status: "DRAFT",
    },
    select: { id: true },
  });

  return NextResponse.json({ work }, { status: 201 });
}
