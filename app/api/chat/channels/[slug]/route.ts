import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// ✏️ PUT /api/chat/channels/[slug] - обновить канал
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session?.userId) {
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
    const { title, description, isReadonly } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isReadonly !== undefined) updateData.isReadonly = isReadonly;

    const channel = await prisma.channel.update({
      where: { slug },
      data: updateData,
    });

    return NextResponse.json({ channel });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    console.error("Error updating channel:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🗑️ DELETE /api/chat/channels/[slug] - удалить канал
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session?.userId) {
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
    await prisma.channel.delete({
      where: { slug },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    console.error("Error deleting channel:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
