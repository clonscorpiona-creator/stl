import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function requireModerator(request: NextRequest) {
  const session = await getSession();

  if (!session.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  // Check if user is moderator or admin
  if (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden: Moderator access required" }, { status: 403 })
    };
  }

  return { ok: true as const, user: session.user };
}
