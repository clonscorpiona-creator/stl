import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Direction } from "@prisma/client";

// 👥 GET /api/artists - каталог художников с фильтрацией
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const direction = url.searchParams.get("direction");

    // 🔍 Базовый запрос: пользователи с опубликованными работами
    const whereClause: any = {
      works: {
        some: {
          status: "PUBLISHED",
        },
      },
      isBanned: false,
    };

    // 🎯 Фильтр по направлению
    if (direction && Object.values(Direction).includes(direction as Direction)) {
      whereClause.directions = {
        some: {
          direction: direction as Direction,
        },
      };
    }

    const artists = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        howToWork: true,
        directions: {
          select: {
            direction: true,
          },
        },
        works: {
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          take: 3,
          select: {
            id: true,
            title: true,
            direction: true,
            media: {
              take: 1,
              orderBy: { sortOrder: "asc" },
              select: {
                url: true,
                previewUrl: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            works: {
              where: { status: "PUBLISHED" },
            },
          },
        },
      },
      orderBy: {
        works: {
          _count: "desc",
        },
      },
      take: 50,
    });

    return NextResponse.json({ artists });
  } catch (error) {
    console.error("Error fetching artists:", error);
    return NextResponse.json(
      { error: "Failed to fetch artists" },
      { status: 500 }
    );
  }
}
