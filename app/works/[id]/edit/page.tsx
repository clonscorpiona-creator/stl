/*
 * ✏️ STL Platform - Work Edit Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MediaItem = {
  id: string;
  type: "IMAGE" | "VIDEO" | "AUDIO";
  url: string;
  sortOrder: number;
};

type WorkManage = {
  id: string;
  title: string;
  description: string;
  direction: string;
  status: string;
  rejectionReason: string | null;
  media: MediaItem[];
};

export default function WorkEditPage({ params }: { params: { id: string } }) {
  const workId = params.id;
  const [work, setWork] = useState<WorkManage | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO" | "AUDIO">("IMAGE");
  const [mediaUrl, setMediaUrl] = useState("");

  const canAddMedia = useMemo(() => mediaUrl.trim().length > 0, [mediaUrl]);

  async function load() {
    setStatus(null);
    const res = await fetch(`/api/works/${workId}/manage`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setStatus(data?.error ?? "Ошибка загрузки");
      setWork(null);
      return;
    }
    setWork(data.work);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId]);

  async function addMedia() {
    setStatus(null);
    const res = await fetch(`/api/works/${workId}/media`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: mediaUrl.trim(), type: mediaType }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setStatus(data?.error ?? "Ошибка" );
      return;
    }

    setMediaUrl("");
    await load();
  }

  async function submitToModeration() {
    setStatus(null);
    const res = await fetch(`/api/works/${workId}/submit`, { method: "POST" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setStatus(data?.error ?? "Ошибка");
      return;
    }

    setWork((w) => (w ? { ...w, status: data.work.status, rejectionReason: null } : w));
    setStatus("Отправлено на модерацию");
  }

  return (
    <main style={{ display: "grid", gap: 12, maxWidth: 760 }}>
      <h1 style={{ color: "var(--foreground)" }}>Редактирование работы</h1>

      <p>
        <Link href="/works" style={{ color: "var(--accent-dark)" }}>← В галерею</Link>
      </p>

      {!work && !status && <p style={{ color: "var(--text-secondary)" }}>Загрузка…</p>}
      {status && <p style={{ color: "var(--text-secondary)" }}>{status}</p>}

      {work && (
        <>
          <section style={{ border: "2px solid var(--accent-dark)", borderRadius: 12, padding: 12, background: "var(--card-bg)" }}>
            <h2 style={{ marginTop: 0, color: "var(--text-primary)" }}>{work.title}</h2>
            <p style={{ color: "var(--text-secondary)" }}>{work.description}</p>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Направление: {work.direction} · Статус: <b>{work.status}</b>
            </p>
            {work.status === "REJECTED" && work.rejectionReason && (
              <p style={{ color: "var(--accent-dark)", fontWeight: 600 }}>Причина отклонения: {work.rejectionReason}</p>
            )}
          </section>

          <section style={{ border: "2px solid var(--accent-dark)", borderRadius: 12, padding: 12, background: "var(--card-bg)" }}>
            <h2 style={{ marginTop: 0, color: "var(--text-primary)" }}>Медиа</h2>

            {work.media.length === 0 && <p style={{ color: "var(--text-secondary)" }}>Пока нет медиа.</p>}

            {work.media.length > 0 && (
              <ul style={{ display: "grid", gap: 8, listStyle: "none", padding: 0 }}>
                {work.media.map((m) => (
                  <li key={m.id} style={{ border: "2px solid var(--accent-dark)", borderRadius: 12, padding: 10, background: "var(--card-light)" }}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{m.type}</div>
                    <a href={m.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent-light)" }}>
                      {m.url}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <fieldset style={{ padding: 12, borderRadius: 12, marginTop: 12, border: "2px solid var(--accent-dark)", background: "var(--card-light)" }}>
              <legend style={{ color: "var(--text-primary)", fontWeight: 600 }}>Добавить медиа (URL)</legend>
              <label style={{ color: "var(--text-primary)" }}>
                Тип
                <select value={mediaType} onChange={(e) => setMediaType(e.target.value as any)} style={{ marginLeft: 8, padding: "6px 10px", borderRadius: 8, border: "2px solid var(--accent-dark)", background: "var(--card-bg)", color: "var(--text-primary)" }}>
                  <option value="IMAGE">IMAGE</option>
                  <option value="VIDEO">VIDEO</option>
                  <option value="AUDIO">AUDIO</option>
                </select>
              </label>
              <label style={{ display: "block", marginTop: 8, color: "var(--text-primary)" }}>
                URL
                <input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                  style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 12px", borderRadius: 8, border: "2px solid var(--accent-dark)", background: "var(--card-bg)", color: "var(--text-primary)" }}
                />
              </label>
              <button onClick={addMedia} disabled={!canAddMedia} style={{ marginTop: 10, padding: "8px 16px", background: canAddMedia ? "var(--accent)" : "var(--accent-dark)", color: "var(--text-primary)", border: "none", borderRadius: 8, cursor: canAddMedia ? "pointer" : "not-allowed", fontWeight: 600, opacity: canAddMedia ? 1 : 0.5 }}>
                Добавить
              </button>
              {(work.status !== "DRAFT" && work.status !== "REJECTED") && (
                <p style={{ marginTop: 10, color: "var(--text-secondary)", fontSize: 13 }}>
                  Медиа можно добавлять только для DRAFT/REJECTED.
                </p>
              )}
            </fieldset>
          </section>

          <section style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={submitToModeration}
              disabled={work.status !== "DRAFT" && work.status !== "REJECTED"}
              style={{ padding: "10px 20px", background: (work.status === "DRAFT" || work.status === "REJECTED") ? "var(--accent)" : "var(--accent-dark)", color: "var(--text-primary)", border: "none", borderRadius: 8, cursor: (work.status === "DRAFT" || work.status === "REJECTED") ? "pointer" : "not-allowed", fontWeight: 600, opacity: (work.status === "DRAFT" || work.status === "REJECTED") ? 1 : 0.5 }}
            >
              Отправить на модерацию
            </button>
            <Link href={`/works/${workId}`} style={{ color: "var(--accent-light)", fontWeight: 600 }}>Открыть публичную страницу</Link>
          </section>
        </>
      )}
    </main>
  );
}
