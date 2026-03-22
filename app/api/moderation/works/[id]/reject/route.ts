import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/moderation";
import { NextResponse, type NextRequest } from "next/server";
import { createNotification, type NotificationType } from "@/lib/notifications";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireModerator(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  const updated = await prisma.work.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectionReason: reason || "Отклонено",
    },
    select: {
      id: true,
      status: true,
      userId: true,
      title: true
    },
  });

  // 🔔 Create notification for work author
  await createNotification({
    userId: updated.userId,
    type: "WORK_REJECTED",
    title: "Работа отклонена",
    message: `Ваша работа "${updated.title}" отклонена модератором. Причина: ${reason || "Не указана"}`,
    link: `/works/${updated.id}`
  });

  return NextResponse.json({ work: updated });
}
