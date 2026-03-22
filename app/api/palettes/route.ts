import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 🎨 GET /api/palettes - получить палитры пользователя
export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  const url = new URL(req.url);
  const isPublic = url.searchParams.get("public") === "true";
  const userId = url.searchParams.get("userId");

  try {
    const where: any = {};

    if (isPublic) {
      where.isPublic = true;
      if (userId) {
        where.userId = userId;
      }
    } else {
      if (!session?.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      where.userId = session.userId;
    }

    const palettes = await prisma.colorPalette.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        colors: true,
        isPublic: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({ palettes });
  } catch (error) {
    console.error("Error fetching palettes:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 💾 POST /api/palettes - создать новую палитру
export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, colors, isPublic } = body;

    if (!name || !colors || !Array.isArray(colors) || colors.length === 0) {
      return NextResponse.json(
        { error: "Name and colors are required" },
        { status: 400 }
      );
    }

    if (colors.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 colors per palette" },
        { status: 400 }
      );
    }

    // ✅ Validate hex colors
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const color of colors) {
      if (!hexRegex.test(color)) {
        return NextResponse.json(
          { error: "Invalid color format. Use hex colors like #FF5733" },
          { status: 400 }
        );
      }
    }

    const palette = await prisma.colorPalette.create({
      data: {
        userId: session.userId,
        name,
        colors: JSON.stringify(colors),
        isPublic: isPublic || false,
      },
      select: {
        id: true,
        name: true,
        colors: true,
        isPublic: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ palette }, { status: 201 });
  } catch (error) {
    console.error("Error creating palette:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
