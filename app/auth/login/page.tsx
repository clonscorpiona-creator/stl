/*
 * 🔐 STL Platform - Login Page
 * 📦 Version: 2.0.0
 * 📅 Updated: 2026-03-21
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import defaultStyles from "./login.module.css";
import modernStyles from "./login-modern.module.css";
import bakeryStyles from "./login-bakery.module.css";
import minimalistStyles from "./login-minimalist.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<string>('with-sidebar');

  // Detect current layout
  useEffect(() => {
    const layout = localStorage.getItem('site-layout') || 'with-sidebar';
    setCurrentLayout(layout);

    const checkLayout = () => {
      const layoutAttr = document.documentElement.getAttribute('data-layout');
      if (layoutAttr) {
        setCurrentLayout(layoutAttr);
      }
    };

    const observer = new MutationObserver(checkLayout);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-layout']
    });

    return () => observer.disconnect();
  }, []);

  // Select styles based on layout
  const styles = currentLayout === 'modern-dark' ? modernStyles :
                 currentLayout === 'bakery-warm' ? bakeryStyles :
                 currentLayout === 'minimalist-modern' ? minimalistStyles :
                 defaultStyles;

  // ✅ Show success message if redirected from registration
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Регистрация успешна! Теперь войдите в аккаунт.");
    }
    if (searchParams.get("reset") === "success") {
      setSuccess("Пароль успешно изменен! Теперь войдите с новым паролем.");
    }
  }, [searchParams]);

  // ✅ Client-side validation
  const emailValid = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // ✅ Client-side validation
    if (!emailValid) {
      setError("Неверный формат email");
      return;
    }

    if (!password) {
      setError("Введите пароль");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Ошибка входа");
        setLoading(false);
        return;
      }

      // 🎉 Success - redirect to profile
      router.push("/profile");
    } catch (err) {
      setError("Ошибка сети. Проверьте подключение.");
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Вход</h1>
        <p className={styles.subtitle}>Войдите в свой аккаунт СТЛ</p>

        <form onSubmit={onSubmit} className={styles.form} autoComplete="on">
          {/* Success message */}
          {success && (
            <div className={styles.successBox}>
              {success}
            </div>
          )}

          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${styles.input} ${email && !emailValid ? styles.inputError : ""}`}
              required
              autoComplete="username email"
              disabled={loading}
              autoFocus
            />
            {email && !emailValid && (
              <span className={styles.fieldError}>Неверный формат email</span>
            )}
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Пароль
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.togglePassword}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.88 9.88C9.33786 10.4221 9.02786 11.1544 9.02786 11.92C9.02786 12.6856 9.33786 13.4179 9.88 13.96M14.12 14.12C14.6621 13.5779 14.9721 12.8456 14.9721 12.08C14.9721 11.3144 14.6621 10.5821 14.12 10.04M3 3L21 21M10.5 5.5C11 5.3 11.5 5.2 12 5.2C19 5.2 22 12 22 12C21.5 13 20.5 14.5 19 15.5M6.5 8.5C4.5 10 2 12 2 12C2 12 5 18.8 12 18.8C13.5 18.8 14.8 18.3 16 17.5"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className={styles.errorBox}>
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || !emailValid || !password}
          >
            {loading ? "Вход..." : "Войти"}
          </button>

          {/* Forgot password link */}
          <p className={styles.linkText}>
            <Link href="/auth/forgot-password" className={styles.link}>Забыли пароль?</Link>
          </p>

          {/* Register link */}
          <p className={styles.linkText}>
            Нет аккаунта? <Link href="/auth/register" className={styles.link}>Зарегистрироваться</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
