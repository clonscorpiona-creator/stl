import { getSession } from "@/lib/session";
import { NextRequest } from "next/server";

export async function requireModerator(request: NextRequest) {
  const session = await getSession();

  if (!session.user) {
    return { error: "Unauthorized", status: 401 };
  }

  // Check if user is moderator or admin
  if (session.user.role !== "MODERATOR" && session.user.role !== "ADMIN") {
    return { error: "Forbidden: Moderator access required", status: 403 };
  }

  return { user: session.user };
}
