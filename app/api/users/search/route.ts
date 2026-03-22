import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// 🔍 GET /api/users/search - поиск пользователей
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q") || "";

  if (query.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { displayName: { contains: query } },
          { email: { contains: query } },
        ],
      },
      take: 20,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
