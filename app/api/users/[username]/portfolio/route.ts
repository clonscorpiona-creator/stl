import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// 📁 GET /api/users/[username]/portfolio - получить данные портфолио для экспорта
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        directions: {
          select: {
            direction: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const works = await prisma.work.findMany({
      where: {
        userId: user.id,
        status: "PUBLISHED"
      },
      orderBy: { publishedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        description: true,
        direction: true,
        publishedAt: true,
        media: {
          take: 3,
          orderBy: { createdAt: "asc" },
          select: {
            url: true,
            type: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    return NextResponse.json({
      user: {
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        directions: user.directions.map(d => d.direction)
      },
      works
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
