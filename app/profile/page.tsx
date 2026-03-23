/*
 * 👤 STL Platform - Profile Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  howToWork: string | null;
  role: string;
  emailVerifiedAt: string | null;
  createdAt: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [howToWork, setHowToWork] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setDisplayName(data.user.displayName || "");
          setBio(data.user.bio || "");
          setHowToWork(data.user.howToWork || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function logout() {
    // 🚪 Logout and redirect to home
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  async function handleSave() {
    setSaving(true);
    try {
      // 💾 Save profile changes
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, howToWork }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setEditing(false);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 800, margin: "40px auto", padding: 20 }}>
        <p>Загрузка…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={{ maxWidth: 800, margin: "40px auto", padding: 20 }}>
        <p>Вы не авторизованы.</p>
        <p>
          <Link href="/auth/register">Войти</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 20 }}>
      <Link href="/" style={{ color: "var(--accent-dark)", textDecoration: "none" }}>
        ← Главная
      </Link>

      <h1 style={{ marginTop: 20, marginBottom: 30, color: "var(--foreground)" }}>Мой профиль</h1>

      <div style={{ marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/blocked" style={{ color: "var(--foreground)", textDecoration: "none", padding: "8px 16px", border: "2px solid var(--accent-dark)", borderRadius: 8, background: "var(--card-bg)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
            <circle cx="12" cy="12" r="9"/>
            <path d="M5 5L19 19"/>
          </svg>
          Заблокированные
        </Link>
        <Link href="/stats" style={{ color: "var(--foreground)", textDecoration: "none", padding: "8px 16px", border: "2px solid var(--accent-dark)", borderRadius: 8, background: "var(--card-bg)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
            <path d="M3 20V10M9 20V4M15 20V12M21 20V8"/>
          </svg>
          Статистика
        </Link>
        <Link href="/palettes" style={{ color: "var(--foreground)", textDecoration: "none", padding: "8px 16px", border: "2px solid var(--accent-dark)", borderRadius: 8, background: "var(--card-bg)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
            <path d="M12 2C6.5 2 2 6.5 2 12C2 13.8 2.5 15.5 3.4 16.9C4 17.8 5.2 18 6.2 17.5C7.3 17 8.5 17.9 8.5 19.1V19.5C8.5 20.9 9.6 22 11 22C16.5 22 21 17.5 21 12C21 6.5 16.5 2 12 2Z"/>
            <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="7.5" r="1.5" fill="currentColor"/>
            <circle cx="16.5" cy="10.5" r="1.5" fill="currentColor"/>
          </svg>
          Мои палитры
        </Link>
        <Link href="/music" style={{ color: "var(--foreground)", textDecoration: "none", padding: "8px 16px", border: "2px solid var(--accent-dark)", borderRadius: 8, background: "var(--card-bg)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
            <path d="M9 18V5L21 3V16"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          Музыка
        </Link>
        <Link href="/inquiries" style={{ color: "var(--foreground)", textDecoration: "none", padding: "8px 16px", border: "2px solid var(--accent-dark)", borderRadius: 8, background: "var(--card-bg)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/>
            <path d="M14 2V8H20"/>
            <path d="M16 13H8M16 17H8M10 9H8"/>
          </svg>
          Заявки
        </Link>
        <button
          onClick={async () => {
            try {
              // 📄 Generate and download portfolio PDF
              const { generatePortfolioPDF } = await import("@/lib/pdfExport");
              const res = await fetch(`/api/users/${user.username}/portfolio`);
              const data = await res.json();
              if (res.ok) {
                const blob = await generatePortfolioPDF(data);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `portfolio-${user.username}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } else {
                alert("Ошибка загрузки портфолио");
              }
            } catch (err) {
              console.error(err);
              alert("Ошибка создания PDF");
            }
          }}
          style={{ color: "var(--foreground)", textDecoration: "none", padding: "8px 16px", border: "2px solid var(--accent-dark)", borderRadius: 8, background: "var(--card-bg)", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"/>
            <path d="M7 10L12 15L17 10"/>
            <path d="M12 15V3"/>
          </svg>
          Экспорт в PDF
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <section style={{ padding: 20, border: "2px solid var(--accent-dark)", borderRadius: 12, background: "var(--card-bg)" }}>
          <h2 style={{ marginTop: 0, color: "var(--text-primary)" }}>Основная информация</h2>
          <p style={{ color: "var(--text-primary)" }}>
            <strong>Email:</strong> {user.email}
          </p>
          <p style={{ color: "var(--text-primary)" }}>
            <strong>Username:</strong> @{user.username}
          </p>
          <p style={{ color: "var(--text-primary)" }}>
            <strong>Роль:</strong> {user.role}
          </p>
          <p style={{ color: "var(--text-primary)" }}>
            <strong>Email подтвержден:</strong>{" "}
            {user.emailVerifiedAt ? "Да" : "Нет"}
          </p>
        </section>

        {!editing ? (
          <section style={{ padding: 20, border: "2px solid var(--accent-dark)", borderRadius: 12, background: "var(--card-bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, color: "var(--text-primary)" }}>Публичная информация</h2>
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: "8px 16px",
                  background: "var(--accent)",
                  color: "var(--text-primary)",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Редактировать
              </button>
            </div>

            <div style={{ marginTop: 20 }}>
              <p style={{ color: "var(--text-primary)" }}>
                <strong>Отображаемое имя:</strong>{" "}
                {user.displayName || <em style={{ color: "var(--text-secondary)" }}>Не указано</em>}
              </p>
              <p style={{ color: "var(--text-primary)" }}>
                <strong>О себе:</strong>{" "}
                {user.bio || <em style={{ color: "var(--text-secondary)" }}>Не указано</em>}
              </p>
              <p style={{ color: "var(--text-primary)" }}>
                <strong>Как со мной работать:</strong>{" "}
                {user.howToWork || <em style={{ color: "var(--text-secondary)" }}>Не указано</em>}
              </p>
            </div>

            <Link
              href={`/users/${user.username}`}
              style={{
                display: "inline-block",
                marginTop: 16,
                color: "var(--accent-light)",
                textDecoration: "underline",
              }}
            >
              Посмотреть публичный профиль →
            </Link>
          </section>
        ) : (
          <section style={{ padding: 20, border: "2px solid var(--accent-dark)", borderRadius: 12, background: "var(--card-bg)" }}>
            <h2 style={{ marginTop: 0, color: "var(--text-primary)" }}>Редактирование профиля</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "var(--text-primary)" }}>
                  Отображаемое имя
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ваше имя"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "2px solid var(--accent-dark)",
                    fontSize: 15,
                    background: "var(--card-light)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "var(--text-primary)" }}>
                  О себе
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Расскажите о себе"
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "2px solid var(--accent-dark)",
                    fontSize: 15,
                    fontFamily: "inherit",
                    resize: "vertical",
                    background: "var(--card-light)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "var(--text-primary)" }}>
                  Как со мной работать
                </label>
                <textarea
                  value={howToWork}
                  onChange={(e) => setHowToWork(e.target.value)}
                  placeholder="Опишите ваши условия работы, сроки, предпочтения..."
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "2px solid var(--accent-dark)",
                    fontSize: 15,
                    fontFamily: "inherit",
                    resize: "vertical",
                    background: "var(--card-light)",
                    color: "var(--text-primary)",
                  }}
                />
                <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
                  Эта информация поможет клиентам понять, как с вами лучше взаимодействовать
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    background: saving ? "var(--accent-dark)" : "var(--accent)",
                    color: "var(--text-primary)",
                    border: "none",
                    borderRadius: 8,
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: 15,
                    fontWeight: 600,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setDisplayName(user.displayName || "");
                    setBio(user.bio || "");
                    setHowToWork(user.howToWork || "");
                  }}
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    color: "var(--text-secondary)",
                    border: "2px solid var(--accent-dark)",
                    borderRadius: 8,
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: 15,
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          </section>
        )}

        <section style={{ padding: 20, border: "2px solid var(--accent-dark)", borderRadius: 12, background: "var(--card-bg)" }}>
          <h2 style={{ marginTop: 0, color: "var(--text-primary)" }}>Быстрые ссылки</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/artists" style={{ color: "var(--accent-light)", fontWeight: 500 }}>
              Каталог художников →
            </Link>
            <Link href="/works/new" style={{ color: "var(--accent-light)", fontWeight: 500 }}>
              Добавить работу →
            </Link>
          </div>
        </section>

        <button
          onClick={logout}
          style={{
            padding: "10px 20px",
            background: "var(--accent-dark)",
            color: "var(--text-primary)",
            border: "2px solid var(--foreground)",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Выйти
        </button>
      </div>
    </main>
  );
}
