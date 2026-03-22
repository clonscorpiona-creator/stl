import { Resend } from "resend";
import { render } from "@react-email/components";
import VerificationEmail from "./email-templates/verification";
import PasswordResetEmail from "./email-templates/password-reset";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@stl.com";

export async function sendVerificationEmail(params: {
  toEmail: string;
  verifyUrl: string;
}) {
  // If no API key is configured, fall back to console logging
  if (!resend) {
    console.log("\n[STL] Verify email for", params.toEmail);
    console.log(params.verifyUrl, "\n");
    return;
  }

  try {
    const emailHtml = await render(
      VerificationEmail({ verifyUrl: params.verifyUrl })
    );

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: "Подтвердите ваш email - СТЛ",
      html: emailHtml,
    });

    if (error) {
      console.error("[STL] Email send error:", error);
      throw new Error("Failed to send verification email");
    }

    console.log("[STL] Verification email sent:", data);
  } catch (error) {
    console.error("[STL] Failed to send verification email:", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(params: {
  toEmail: string;
  resetUrl: string;
}) {
  // If no API key is configured, fall back to console logging
  if (!resend) {
    console.log("\n[STL] Password reset email for", params.toEmail);
    console.log(params.resetUrl, "\n");
    return;
  }

  try {
    const emailHtml = await render(
      PasswordResetEmail({ resetUrl: params.resetUrl })
    );

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: "Сброс пароля - СТЛ",
      html: emailHtml,
    });

    if (error) {
      console.error("[STL] Email send error:", error);
      throw new Error("Failed to send password reset email");
    }

    console.log("[STL] Password reset email sent:", data);
  } catch (error) {
    console.error("[STL] Failed to send password reset email:", error);
    throw error;
  }
}

export async function sendRegistrationEmail(params: {
  toEmail: string;
  username: string;
  password: string;
}) {
  // If no API key is configured, fall back to console logging
  if (!resend) {
    console.log("\n[STL] Registration email for", params.toEmail);
    console.log("Username:", params.username);
    console.log("Password:", params.password, "\n");
    return;
  }

  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Добро пожаловать в СТЛ!</h2>
        <p>Ваша регистрация успешно завершена.</p>
        <p><strong>Данные для входа:</strong></p>
        <ul>
          <li>Username: <strong>${params.username}</strong></li>
          <li>Password: <strong>${params.password}</strong></li>
        </ul>
        <p>Войдите на сайт: <a href="${APP_URL}/auth/login">${APP_URL}/auth/login</a></p>
        <p>С уважением,<br/>Команда СТЛ</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.toEmail,
      subject: "Регистрация в СТЛ - Данные для входа",
      html: emailHtml,
    });

    if (error) {
      console.error("[STL] Email send error:", error);
      throw new Error("Failed to send registration email");
    }

    console.log("[STL] Registration email sent:", data);
  } catch (error) {
    console.error("[STL] Failed to send registration email:", error);
    throw error;
  }
}
