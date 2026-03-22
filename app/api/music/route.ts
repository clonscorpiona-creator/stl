import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// 🎵 GET /api/music - получить список песен
export async function GET() {
  try {
    const songs = await prisma.song.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({ songs });
  } catch (error) {
    console.error("Error fetching songs:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 📤 POST /api/music - загрузить песню (только админ)
export async function POST(req: NextRequest) {
  const res = new NextResponse();
  const session = await getSession(req, res);

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, artist, album, coverUrl, fileUrl, duration, fileSize } = body;

    if (!title || !fileUrl) {
      return NextResponse.json(
        { error: "Title and file URL are required" },
        { status: 400 }
      );
    }

    const song = await prisma.song.create({
      data: {
        title,
        artist: artist || null,
        album: album || null,
        coverUrl: coverUrl || null,
        fileUrl,
        duration: duration || null,
        fileSize: fileSize ? BigInt(fileSize) : null,
        uploadedById: session.userId,
      },
    });

    return NextResponse.json({ song }, { status: 201 });
  } catch (error) {
    console.error("Error creating song:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
