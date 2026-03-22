import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Valid art directions
const VALID_DIRECTIONS = [
  "ILLUSTRATION",
  "ANIMATION",
  "DESIGN",
  "3D",
  "PHOTOGRAPHY",
  "TRADITIONAL",
  "DIGITAL",
  "CONCEPT_ART",
];

// 🔍 GET /api/works/search - поиск работ
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q") || "";
  const direction = url.searchParams.get("direction");
  const userId = url.searchParams.get("userId");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  try {
    const where: any = {
      status: "PUBLISHED",
    };

    // 🔍 Text search in title and description
    if (query.trim()) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    // 🎯 Filter by direction
    if (direction && VALID_DIRECTIONS.includes(direction)) {
      where.direction = direction;
    }

    // 👤 Filter by user
    if (userId) {
      where.userId = userId;
    }

    const [works, total] = await Promise.all([
      prisma.work.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          description: true,
          direction: true,
          publishedAt: true,
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          media: {
            take: 1,
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              url: true,
              type: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.work.count({ where }),
    ]);

    return NextResponse.json({
      works,
      total,
      limit,
      offset,
      hasMore: offset + works.length < total,
    });
  } catch (error) {
    console.error("Error searching works:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
