import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 📊 GET /api/users/[username]/stats - получить статистику пользователя
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [
      totalWorks,
      publishedWorks,
      totalLikes,
      totalComments,
      totalViews,
      worksByDirection,
      recentActivity
    ] = await Promise.all([
      // 📁 Total works
      prisma.work.count({
        where: { userId: user.id }
      }),

      // ✅ Published works
      prisma.work.count({
        where: { userId: user.id, status: "PUBLISHED" }
      }),

      // ❤️ Total likes received
      prisma.workLike.count({
        where: {
          work: { userId: user.id }
        }
      }),

      // 💬 Total comments received
      prisma.workComment.count({
        where: {
          work: { userId: user.id }
        }
      }),

      // 👁️ Total views (placeholder - would need view tracking)
      Promise.resolve(0),

      // 🎯 Works by direction
      prisma.work.groupBy({
        by: ['direction'],
        where: { userId: user.id, status: "PUBLISHED" },
        _count: true
      }),

      // 📅 Recent activity (last 30 days)
      prisma.work.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // 🏆 Get most liked work
    const mostLikedWork = await prisma.work.findFirst({
      where: { userId: user.id, status: "PUBLISHED" },
      orderBy: {
        likes: { _count: "desc" }
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: { likes: true }
        }
      }
    });

    return NextResponse.json({
      stats: {
        totalWorks,
        publishedWorks,
        totalLikes,
        totalComments,
        totalViews,
        worksByDirection: worksByDirection.map(item => ({
          direction: item.direction,
          count: item._count
        })),
        recentActivity,
        mostLikedWork
      }
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
