import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePasswordResetToken, deletePasswordResetToken } from "@/lib/password-reset-token";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    // Validate inputs
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Токен обязателен" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Пароль обязателен" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Пароль должен содержать минимум 8 символов" },
        { status: 400 }
      );
    }

    // Validate token
    const userId = await validatePasswordResetToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: "Недействительный или истекший токен" },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Delete the used token
    await deletePasswordResetToken(token);

    return NextResponse.json({
      success: true,
      message: "Пароль успешно изменен",
    });
  } catch (error) {
    console.error("[reset-password] Error:", error);
    return NextResponse.json(
      { error: "Произошла ошибка. Попробуйте позже." },
      { status: 500 }
    );
  }
}
