import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 📰 GET /api/news - получить список новостей
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status") || "PUBLISHED";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

  try {
    const where = statusParam === "all" ? {} : { status: statusParam as any };

    const posts = await prisma.newsPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        coverUrl: true,
        content: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

// 📝 POST /api/news - создать новость (только админ)
export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { slug, title, coverUrl, content, status } = body;

    if (!slug || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const publishedAt = status === "PUBLISHED" ? new Date() : null;

    const post = await prisma.newsPost.create({
      data: {
        slug,
        title,
        coverUrl: coverUrl || null,
        content,
        status: status || "DRAFT",
        publishedAt,
        authorId: session.userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }
    console.error("Error creating news:", error);
    return NextResponse.json(
      { error: "Failed to create news" },
      { status: 500 }
    );
  }
}
