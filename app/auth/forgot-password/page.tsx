/*
 * 🔐 STL Platform - Forgot Password Page
 * 📦 Version: 2.0.0
 * 📅 Updated: 2026-03-22
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import defaultStyles from "../login/login.module.css";
import modernStyles from "../login/login-modern.module.css";
import bakeryStyles from "../login/login-bakery.module.css";
import minimalistStyles from "../login/login-minimalist.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<string>('with-sidebar');

  const emailValid = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!emailValid) {
      setError("Неверный формат email");
      return;
    }

    if (!email) {
      setError("Введите email");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Ошибка отправки");
        setLoading(false);
        return;
      }

      setSuccess(data.message || "Письмо с инструкциями отправлено на ваш email");
      setEmail("");
    } catch (err) {
      setError("Ошибка сети. Проверьте подключение.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Забыли пароль?</h1>
        <p className={styles.subtitle}>
          Введите ваш email, и мы отправим инструкции по восстановлению пароля
        </p>

        <form onSubmit={onSubmit} className={styles.form}>
          {success && (
            <div className={styles.successBox}>
              {success}
            </div>
          )}

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
              disabled={loading || !!success}
              autoFocus
            />
            {email && !emailValid && (
              <span className={styles.fieldError}>Неверный формат email</span>
            )}
          </div>

          {error && (
            <div className={styles.errorBox}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || !emailValid || !email || !!success}
          >
            {loading ? "Отправка..." : "Отправить инструкции"}
          </button>

          <p className={styles.linkText}>
            Вспомнили пароль? <Link href="/auth/login" className={styles.link}>Войти</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
