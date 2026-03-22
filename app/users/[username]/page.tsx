/*
 * 👤 STL Platform - User Profile Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PublicUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  howToWork: string | null;
  createdAt: string;
};

type UserWorkItem = {
  id: string;
  title: string;
  description: string;
  direction: string;
  publishedAt: string | null;
  createdAt: string;
  _count: { likes: number; comments: number };
};

type UserPageResponse = {
  user: PublicUser;
  works: UserWorkItem[];
};

export default function UserPage({ params }: { params: { username: string } }) {
  const username = params.username;
  const [data, setData] = useState<UserPageResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  useEffect(() => {
    setStatus(null);
    setData(null);

    Promise.all([
      fetch(`/api/users/${encodeURIComponent(username)}`).then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error(d?.error ?? "Not found");
        return d as UserPageResponse;
      }),
      fetch("/api/auth/me").then((r) => r.json()).catch(() => ({ user: null })),
    ])
      .then(([userData, meData]) => {
        setData(userData);
        setCurrentUser(meData.user);

        // 🔍 Check block status if logged in and viewing another user
        if (meData.user && meData.user.username !== username) {
          fetch(`/api/users/${encodeURIComponent(username)}/block/status`)
            .then((r) => r.json())
            .then((d) => setIsBlocked(d.isBlocked || false))
            .catch(() => {});
        }
      })
      .catch((e) => setStatus(e?.message ?? "Не найдено"));
  }, [username]);

  return (
    <main style={{ display: "grid", gap: 12, maxWidth: 860 }}>
      <p>
        <Link href="/works" style={{ color: "var(--accent-dark)" }}>← В галерею</Link>
      </p>

      {!data && !status && <p style={{ color: "var(--text-secondary)" }}>Загрузка…</p>}
      {status && <p style={{ color: "var(--text-secondary)" }}>{status}</p>}

      {data && (
        <>
          <section style={{ border: "2px solid var(--accent-dark)", borderRadius: 12, padding: 12, background: "var(--card-bg)" }}>
            <h1 style={{ marginTop: 0, marginBottom: 6, color: "var(--text-primary)" }}>{data.user.displayName ?? data.user.username}</h1>
            <p style={{ marginTop: 0, color: "var(--text-secondary)" }}>@{data.user.username}</p>
            {data.user.bio && <p style={{ marginTop: 10, color: "var(--text-primary)" }}>{data.user.bio}</p>}

            {currentUser && currentUser.id !== data.user.id && (
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                {currentUser.emailVerifiedAt && (
                  <Link
                    href={`/inquiries/new?recipient=${data.user.id}`}
                    style={{
                      display: "inline-block",
                      padding: "10px 20px",
                      background: "var(--accent)",
                      color: "var(--text-primary)",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 15,
                      fontWeight: 600,
                    }}
                  >
                    Написать по проекту
                  </Link>
                )}
                <button
                  onClick={async () => {
                    setBlockLoading(true);
                    try {
                      const method = isBlocked ? "DELETE" : "POST";
                      const res = await fetch(`/api/users/${encodeURIComponent(username)}/block`, {
                        method
                      });
                      if (res.ok) {
                        setIsBlocked(!isBlocked);
                      } else {
                        const data = await res.json();
                        alert(data.error || "Ошибка");
                      }
                    } catch (err) {
                      alert("Ошибка сети");
                    } finally {
                      setBlockLoading(false);
                    }
                  }}
                  disabled={blockLoading}
                  style={{
                    padding: "10px 20px",
                    background: isBlocked ? "var(--text-secondary)" : "var(--accent-dark)",
                    color: "var(--text-primary)",
                    border: isBlocked ? "none" : "2px solid var(--foreground)",
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: blockLoading ? "not-allowed" : "pointer",
                    opacity: blockLoading ? 0.6 : 1,
                  }}
                >
                  {blockLoading ? "..." : isBlocked ? "Разблокировать" : "Заблокировать"}
                </button>
              </div>
            )}
          </section>

          {data.user.howToWork && (
            <section style={{ border: "2px solid var(--accent-dark)", borderRadius: 12, padding: 12, background: "var(--card-bg)" }}>
              <h2 style={{ marginTop: 0, color: "var(--text-primary)" }}>Как со мной работать</h2>
              <p style={{ whiteSpace: "pre-wrap", margin: 0, color: "var(--text-primary)" }}>{data.user.howToWork}</p>
            </section>
          )}

          <section style={{ border: "2px solid var(--accent-dark)", borderRadius: 12, padding: 12, background: "var(--card-bg)" }}>
            <h2 style={{ marginTop: 0, color: "var(--text-primary)" }}>Работы</h2>

            {data.works.length === 0 && <p style={{ color: "var(--text-secondary)" }}>Пока нет опубликованных работ.</p>}

            {data.works.length > 0 && (
              <ul style={{ display: "grid", gap: 12, listStyle: "none", padding: 0, margin: 0 }}>
                {data.works.map((w) => (
                  <li key={w.id} style={{ border: "2px solid var(--accent-dark)", borderRadius: 12, padding: 12, background: "var(--card-light)" }}>
                    <h3 style={{ marginTop: 0, marginBottom: 6, color: "var(--text-primary)" }}>
                      <Link href={`/works/${w.id}`} style={{ color: "var(--accent-light)" }}>{w.title}</Link>
                    </h3>
                    <p style={{ marginTop: 0, marginBottom: 8, color: "var(--text-secondary)" }}>{w.description}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
                      {w.direction} · лайков {w._count.likes}, комментариев {w._count.comments}
                      {w.publishedAt ? ` · ${new Date(w.publishedAt).toLocaleString()}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
