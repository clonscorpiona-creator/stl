/*
 * 📝 STL Platform - Register Page
 * 📦 Version: 2.0.0
 * 📅 Updated: 2026-03-21
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import defaultStyles from "./register.module.css";
import modernStyles from "./register-modern.module.css";
import bakeryStyles from "./register-bakery.module.css";
import minimalistStyles from "./register-minimalist.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // ✅ Client-side validation
  const emailValid = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const usernameValid = username.length === 0 || (username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username));
  const passwordValid = password.length === 0 || password.length >= 8;
  const passwordsMatch = password === confirmPassword || confirmPassword.length === 0;

  // 💪 Password strength
  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  const passwordStrength = getPasswordStrength();
  const strengthLabels = ["", "Слабый", "Средний", "Хороший", "Отличный"];
  const strengthColors = ["", "#dc3545", "#ffc107", "#28a745", "#007bff"];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // ✅ Client-side validation
    if (!emailValid) {
      setError("Неверный формат email");
      return;
    }

    if (!usernameValid) {
      setError("Username должен быть минимум 3 символа и содержать только буквы, цифры, _ и -");
      return;
    }

    if (!passwordValid) {
      setError("Пароль должен быть минимум 8 символов");
      return;
    }

    if (!passwordsMatch) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Ошибка регистрации");
        setLoading(false);
        return;
      }

      // 🎉 Success - redirect to login
      router.push("/auth/login?registered=true");
    } catch (err) {
      setError("Ошибка сети. Проверьте подключение.");
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Регистрация</h1>
        <p className={styles.subtitle}>Создайте аккаунт в сообществе СТЛ</p>

        {/* Admin info banner */}
        <div className={styles.infoBox}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          <div>
            <strong>Первый пользователь становится администратором</strong>
            <p>Первый зарегистрированный пользователь автоматически получает роль администратора и доступ к админ-панели</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className={styles.form} autoComplete="on">
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
              autoComplete="email"
              disabled={loading}
            />
            {email && !emailValid && (
              <span className={styles.fieldError}>Неверный формат email</span>
            )}
          </div>

          {/* Username */}
          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`${styles.input} ${username && !usernameValid ? styles.inputError : ""}`}
              required
              autoComplete="username"
              disabled={loading}
              minLength={3}
              maxLength={30}
            />
            {username && !usernameValid && (
              <span className={styles.fieldError}>
                Минимум 3 символа, только буквы, цифры, _ и -
              </span>
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
                className={`${styles.input} ${password && !passwordValid ? styles.inputError : ""}`}
                required
                autoComplete="new-password"
                disabled={loading}
                minLength={8}
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
            {password && passwordStrength > 0 && (
              <div className={styles.strengthMeter}>
                <div
                  className={styles.strengthBar}
                  style={{
                    width: `${(passwordStrength / 4) * 100}%`,
                    backgroundColor: strengthColors[passwordStrength],
                  }}
                />
                <span
                  className={styles.strengthLabel}
                  style={{ color: strengthColors[passwordStrength] }}
                >
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
            )}
            {password && !passwordValid && (
              <span className={styles.fieldError}>Минимум 8 символов</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Подтвердите пароль
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${styles.input} ${confirmPassword && !passwordsMatch ? styles.inputError : ""}`}
              required
              autoComplete="off"
              disabled={loading}
            />
            {confirmPassword && !passwordsMatch && (
              <span className={styles.fieldError}>Пароли не совпадают</span>
            )}
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
            disabled={loading || !emailValid || !usernameValid || !passwordValid || !passwordsMatch}
          >
            {loading ? "Регистрация..." : "Создать аккаунт"}
          </button>

          {/* Login link */}
          <p className={styles.linkText}>
            Уже есть аккаунт? <Link href="/auth/login" className={styles.link}>Войти</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
