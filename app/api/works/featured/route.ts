/*
 * 🎨 STL Platform - Featured Works API Endpoint
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const works = await prisma.work.findMany({
      where: {
        status: "PUBLISHED"
      },
      select: {
        id: true,
        title: true,
        direction: true,
        media: {
          select: {
            id: true,
            url: true,
            previewUrl: true,
            type: true,
            width: true,
            height: true
          }
        },
        user: {
          select: {
            username: true,
            displayName: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: [
        {
          likes: {
            _count: "desc"
          }
        },
        {
          publishedAt: "desc"
        }
      ],
      take: limit
    });

    return NextResponse.json({ works });
  } catch (error) {
    console.error("Error fetching featured works:", error);
    return NextResponse.json({ works: [] }, { status: 200 });
  }
}
