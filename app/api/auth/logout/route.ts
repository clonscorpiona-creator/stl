import { destroySession } from "@/lib/session";
import type { NextRequest } from "next/server";

// 🚪 POST /api/auth/logout - выход из системы
export async function POST(req: NextRequest) {
  return destroySession(req);
}
