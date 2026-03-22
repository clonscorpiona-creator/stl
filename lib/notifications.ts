import { prisma } from "@/lib/prisma";

// Notification types
export type NotificationType =
  | "WORK_LIKE"
  | "WORK_COMMENT"
  | "WORK_APPROVED"
  | "WORK_REJECTED"
  | "INQUIRY_MESSAGE"
  | "INQUIRY_CREATED"
  | "SYSTEM";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  fromUserId,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  fromUserId?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        fromUserId,
      },
    });

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
