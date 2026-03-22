/*
 * ✉️ STL Platform - Verify Email Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setStatus("error");
        setError("Нет токена");
        return;
      }

      // ✉️ Verify email token
      const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);

      if (cancelled) return;

      if (!res.ok) {
        setStatus("error");
        setError(data?.error ?? "Ошибка");
        return;
      }

      setStatus("ok");
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <>
      <h1>Подтверждение почты</h1>

      {status === "pending" && <p>Проверяем токен…</p>}

      {status === "ok" && (
        <>
          <p>Почта подтверждена. Теперь можно войти.</p>
          <p>
            <Link href="/auth/login">Перейти ко входу</Link>
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <p>Не удалось подтвердить почту.</p>
          {error && <p>{error}</p>}
        </>
      )}
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <main>
      <Suspense fallback={<p>Загрузка...</p>}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
