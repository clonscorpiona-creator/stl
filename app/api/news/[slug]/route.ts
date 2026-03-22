import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 📰 GET /api/news/[slug] - получить новость по slug
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const post = await prisma.newsPost.findUnique({
      where: { slug },
      include: {
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

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

// 💾 PUT /api/news/[slug] - обновить новость (только админ)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

  const { slug } = await params;

  try {
    const body = await req.json();
    const { title, coverUrl, content, status, newSlug } = body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
    if (content) updateData.content = content;
    if (newSlug) updateData.slug = newSlug;

    if (status) {
      updateData.status = status;
      // 📅 Если публикуем впервые, устанавливаем publishedAt
      if (status === "PUBLISHED") {
        const existingPost = await prisma.newsPost.findUnique({
          where: { slug },
          select: { publishedAt: true },
        });
        if (!existingPost?.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }
    }

    const post = await prisma.newsPost.update({
      where: { slug },
      data: updateData,
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

    return NextResponse.json({ post });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    console.error("Error updating news:", error);
    return NextResponse.json(
      { error: "Failed to update news" },
      { status: 500 }
    );
  }
}

// 🗑️ DELETE /api/news/[slug] - удалить новость (только админ)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

  const { slug } = await params;

  try {
    await prisma.newsPost.delete({
      where: { slug },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    console.error("Error deleting news:", error);
    return NextResponse.json(
      { error: "Failed to delete news" },
      { status: 500 }
    );
  }
}
