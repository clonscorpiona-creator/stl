import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 🎨 GET /api/palettes/[id] - получить палитру
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const palette = await prisma.colorPalette.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        colors: true,
        isPublic: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    if (!palette) {
      return NextResponse.json({ error: "Palette not found" }, { status: 404 });
    }

    return NextResponse.json({ palette });
  } catch (error) {
    console.error("Error fetching palette:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 💾 PUT /api/palettes/[id] - обновить палитру
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.colorPalette.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Palette not found" }, { status: 404 });
    }

    if (existing.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, colors, isPublic } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (colors) {
      if (!Array.isArray(colors) || colors.length === 0 || colors.length > 10) {
        return NextResponse.json(
          { error: "Colors must be an array of 1-10 hex colors" },
          { status: 400 }
        );
      }
      updateData.colors = JSON.stringify(colors);
    }
    if (typeof isPublic === "boolean") updateData.isPublic = isPublic;

    const palette = await prisma.colorPalette.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        colors: true,
        isPublic: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ palette });
  } catch (error) {
    console.error("Error updating palette:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🗑️ DELETE /api/palettes/[id] - удалить палитру
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.colorPalette.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Palette not found" }, { status: 404 });
    }

    if (existing.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.colorPalette.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting palette:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
