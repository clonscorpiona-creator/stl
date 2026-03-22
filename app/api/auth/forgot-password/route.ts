import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePasswordResetToken } from "@/lib/password-reset-token";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email обязателен" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Неверный формат email" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, we return success
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Если аккаунт с таким email существует, на него будет отправлено письмо с инструкциями по сбросу пароля.",
      });
    }

    // Generate password reset token
    const token = await generatePasswordResetToken(user.id);

    // Create reset URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

    // Send password reset email
    await sendPasswordResetEmail({
      toEmail: user.email,
      resetUrl,
    });

    return NextResponse.json({
      success: true,
      message: "Если аккаунт с таким email существует, на него будет отправлено письмо с инструкциями по сбросу пароля.",
    });
  } catch (error) {
    console.error("[forgot-password] Error:", error);
    return NextResponse.json(
      { error: "Произошла ошибка. Попробуйте позже." },
      { status: 500 }
    );
  }
}
