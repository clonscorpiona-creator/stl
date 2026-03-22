import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendVerificationEmail, sendRegistrationEmail } from "@/lib/email";
import { generateToken, sha256Hex } from "@/lib/token";
import { validateEmail, validateUsername, validatePassword } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    // ✅ Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    // ✅ Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json({ error: usernameValidation.error }, { status: 400 });
    }

    // ✅ Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    // 🔐 Hash password
    const passwordHash = await hashPassword(password);

    // 👑 Check if this is the first user (should be admin)
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "USER";

    // 👤 Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role,
        emailVerifiedAt: new Date(), // Auto-verify for now (no email sending)
      },
      select: { id: true, email: true, username: true, role: true },
    });

    // 🔑 Create verification token (for future use)
    const token = generateToken(32);
    const tokenHash = sha256Hex(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // ⏰ 24h

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;

    // 📧 Send registration email with credentials
    await sendRegistrationEmail({
      toEmail: user.email,
      username: user.username,
      password: password, // Send plain password in email
    });

    // 📧 Send verification email
    await sendVerificationEmail({ toEmail: user.email, verifyUrl });

    return NextResponse.json({
      ok: true,
      message: "Регистрация успешна! Данные для входа отправлены на ваш email.",
      username: user.username
    }, { status: 201 });

  } catch (e: any) {
    console.error("Registration error:", e);

    // 🚫 Prisma unique constraint violation
    if (e?.code === "P2002") {
      const field = e?.meta?.target?.[0];
      if (field === "email") {
        return NextResponse.json({ error: "Этот email уже используется" }, { status: 409 });
      }
      if (field === "username") {
        return NextResponse.json({ error: "Этот username уже занят" }, { status: 409 });
      }
      return NextResponse.json({ error: "Email или username уже используются" }, { status: 409 });
    }

    // 🔌 Connection errors
    if (e?.code === "P1001" || e?.code === "P1002" || e?.message?.includes("connection")) {
      return NextResponse.json({
        error: "Ошибка подключения к базе данных. Попробуйте позже."
      }, { status: 503 });
    }

    // ⚠️ Generic error (don't expose details to client)
    return NextResponse.json({
      error: "Ошибка сервера. Попробуйте позже."
    }, { status: 500 });
  }
}
