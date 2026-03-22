/*
 * 🔍 STL Platform - Works Moderation Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ModerationWorkItem = {
  id: string;
  title: string;
  direction: string;
  createdAt: string;
  user: { id: string; username: string; email: string };
};

export default function ModerationWorksPage() {
  const [works, setWorks] = useState<ModerationWorkItem[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  async function load() {
    setStatus(null);
    const res = await fetch("/api/moderation/works");
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setStatus(data?.error ?? "Нет доступа");
      setWorks([]);
      return;
    }
    setWorks(data.works);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    setStatus(null);
    const res = await fetch(`/api/moderation/works/${id}/approve`, { method: "POST" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setStatus(data?.error ?? "Ошибка");
      return;
    }
    setWorks((ws) => (ws ? ws.filter((w) => w.id !== id) : ws));
  }

  async function reject(id: string) {
    setStatus(null);
    const reason = (rejectReason[id] ?? "").trim();
    const res = await fetch(`/api/moderation/works/${id}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setStatus(data?.error ?? "Ошибка");
      return;
    }
    setWorks((ws) => (ws ? ws.filter((w) => w.id !== id) : ws));
  }

  const empty = useMemo(() => works && works.length === 0, [works]);

  return (
    <main style={{ display: "grid", gap: 12, maxWidth: 860 }}>
      <h1 style={{ color: "var(--foreground)" }}>Модерация работ</h1>

      <p style={{ margin: 0 }}>
        <Link href="/works" style={{ color: "var(--accent-dark)" }}>← В галерею</Link>
      </p>

      {status && <p style={{ color: "var(--text-secondary)" }}>{status}</p>}
      {!works && <p style={{ color: "var(--text-secondary)" }}>Загрузка…</p>}
      {empty && <p style={{ color: "var(--text-secondary)" }}>Очередь пуста.</p>}

      {works && works.length > 0 && (
        <ul style={{ display: "grid", gap: 12, listStyle: "none", padding: 0 }}>
          {works.map((w) => (
            <li key={w.id} style={{ border: "2px solid var(--accent-dark)", borderRadius: 12, padding: 12, background: "var(--card-bg)" }}>
              <h2 style={{ marginTop: 0, marginBottom: 6, color: "var(--text-primary)" }}>{w.title}</h2>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
                {w.direction} · {new Date(w.createdAt).toLocaleString()} · автор {w.user.username} ({w.user.email})
              </p>

              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button onClick={() => approve(w.id)} style={{ padding: "8px 16px", background: "var(--accent)", color: "var(--text-primary)", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Опубликовать</button>
                <input
                  value={rejectReason[w.id] ?? ""}
                  onChange={(e) => setRejectReason((m) => ({ ...m, [w.id]: e.target.value }))}
                  placeholder="Причина отклонения (необязательно)"
                  style={{ flex: "1 1 260px", padding: "8px 12px", borderRadius: 8, border: "2px solid var(--accent-dark)", background: "var(--card-light)", color: "var(--text-primary)" }}
                />
                <button onClick={() => reject(w.id)} style={{ padding: "8px 16px", background: "var(--accent-dark)", color: "var(--text-primary)", border: "2px solid var(--foreground)", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Отклонить</button>
              </div>

              <p style={{ marginTop: 10, marginBottom: 0 }}>
                <Link href={`/works/${w.id}/edit`} style={{ color: "var(--accent-light)", fontWeight: 600 }}>Открыть (как автор)</Link>
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
