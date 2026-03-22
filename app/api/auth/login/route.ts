import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { getSession, requireSessionPassword } from "@/lib/session";
import { validateEmail } from "@/lib/validation";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    requireSessionPassword();

    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    // ✅ Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    // ✅ Validate password is provided
    if (!password) {
      return NextResponse.json({ error: "Пароль обязателен" }, { status: 400 });
    }

    // 🔍 Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        emailVerifiedAt: true,
        isBanned: true,
      },
    });

    // 🔒 Generic error message for security (don't reveal if user exists)
    if (!user) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }

    // 🚫 Check if user is banned
    if (user.isBanned) {
      return NextResponse.json({
        error: "Ваш аккаунт заблокирован. Обратитесь в поддержку."
      }, { status: 403 });
    }

    // 🔐 Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }

    // ✉️ Check email verification (optional - currently auto-verified)
    // if (!user.emailVerifiedAt) {
    //   return NextResponse.json({
    //     error: "Email не подтвержден. Проверьте почту."
    //   }, { status: 403 });
    // }

    // 🔑 Create session
    const res = NextResponse.json({
      ok: true,
      message: "Вход выполнен успешно",
      username: user.username
    });

    const session = await getSession(req, res);
    session.userId = user.id;
    await session.save();

    return res;

  } catch (e: any) {
    console.error("Login error:", e);

    // 🔌 Connection errors
    if (e?.code === "P1001" || e?.code === "P1002" || e?.message?.includes("connection")) {
      return NextResponse.json({
        error: "Ошибка подключения к базе данных. Попробуйте позже."
      }, { status: 503 });
    }

    // ⚠️ Generic error (don't expose details)
    return NextResponse.json({
      error: "Ошибка сервера. Попробуйте позже."
    }, { status: 500 });
  }
}
