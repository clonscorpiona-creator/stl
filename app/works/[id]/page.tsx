/*
 * 🎨 STL Platform - Work Detail Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type WorkMedia = {
  id: string;
  type: "IMAGE" | "VIDEO" | "AUDIO";
  url: string;
  previewUrl: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};

type WorkComment = {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; username: string; displayName: string | null };
};

type WorkDetails = {
  id: string;
  title: string;
  description: string;
  direction: string;
  publishedAt: string | null;
  user: { id: string; username: string; displayName: string | null };
  media: WorkMedia[];
  comments: WorkComment[];
  _count: { likes: number; comments: number };
};

export default function WorkPage({ params }: { params: { id: string } }) {
  const workId = params.id;
  const [work, setWork] = useState<WorkDetails | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [likes, setLikes] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const emojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇",
    "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝",
    "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄",
    "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧",
    "🥵", "🥶", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁",
    "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭",
    "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈",
    "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖",
    "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙",
    "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏",
    "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶",
    "👂", "🦻", "👃", "🧠", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞",
    "💓", "💗", "💖", "💘", "💝", "💟", "🔥", "✨", "⭐", "🌟", "💫", "💥", "💢",
    "💯", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾",
    "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥊", "🥋", "⛳", "🎯", "🎮", "🎲", "🎰"
  ];

  const canComment = useMemo(() => commentText.trim().length > 0, [commentText]);

  async function load() {
    // 📥 Load work details from API
    setStatus(null);
    const res = await fetch(`/api/works/${workId}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setStatus(data?.error ?? "Не найдено");
      setWork(null);
      return;
    }
    setWork(data.work);
    setLikes(data.work?._count?.likes ?? null);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId]);

  async function like() {
    // ❤️ Add like to work
    setStatus(null);
    const res = await fetch(`/api/works/${workId}/like`, { method: "POST" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setStatus(data?.error ?? "Ошибка");
      return;
    }
    setLikes(data.likes);
  }

  async function unlike() {
    // 💔 Remove like from work
    setStatus(null);
    const res = await fetch(`/api/works/${workId}/like`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setStatus(data?.error ?? "Ошибка");
      return;
    }
    setLikes(data.likes);
  }

  async function postComment() {
    // 💬 Post new comment on work
    setStatus(null);
    const res = await fetch(`/api/works/${workId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: commentText.trim() }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setStatus(data?.error ?? "Ошибка");
      return;
    }

    setCommentText("");
    await load();
  }

  return (
    <main style={{ display: "grid", gap: 12, maxWidth: 820 }}>
      <p>
        <Link href="/works" style={{ color: "var(--accent-dark)" }}>← В галерею</Link>
      </p>

      {status && <p style={{ color: "var(--text-secondary)" }}>{status}</p>}
      {!work && !status && <p style={{ color: "var(--text-secondary)" }}>Загрузка…</p>}

      {work && (
        <>
          <header style={{ border: "2px solid var(--accent-dark)", borderRadius: 12, padding: 12, background: "var(--card-bg)" }}>
            <h1 style={{ marginTop: 0, color: "var(--text-primary)" }}>{work.title}</h1>
            <p style={{ color: "var(--text-secondary)" }}>{work.description}</p>
            <p style={{ marginTop: 8, fontSize: 14, color: "var(--text-secondary)" }}>
              Автор: <Link href={`/users/${work.user.username}`} style={{ color: "var(--accent-light)" }}>{work.user.displayName ?? work.user.username}</Link> · {work.direction}
              {work.publishedAt ? ` · опубликовано ${new Date(work.publishedAt).toLocaleString()}` : ""}
            </p>
          </header>

          <section style={{ border: "2px solid var(--accent-dark)", borderRadius: 12, padding: 12, background: "var(--card-bg)" }}>
            <h2 style={{ marginTop: 0, color: "var(--text-primary)" }}>Медиа</h2>
            {work.media.length === 0 && <p style={{ color: "var(--text-secondary)" }}>Нет медиа.</p>}

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
          </section>

          <section style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={like} style={{ padding: "8px 16px", background: "var(--accent)", color: "var(--text-primary)", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Лайк</button>
            <button onClick={unlike} style={{ padding: "8px 16px", background: "var(--accent-dark)", color: "var(--text-primary)", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Убрать лайк</button>
            <span style={{ color: "var(--text-secondary)" }}>Лайков: {likes ?? work._count.likes}</span>
          </section>

          <section style={{ border: "2px solid var(--accent-dark)", borderRadius: 12, padding: 12, background: "var(--card-bg)" }}>
            <h2 style={{ marginTop: 0, color: "var(--text-primary)" }}>Комментарии</h2>

            <div style={{ display: "grid", gap: 8, position: "relative" }}>
              <div style={{ position: "relative" }}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  placeholder="Напишите комментарий…"
                  style={{ padding: "10px 12px", borderRadius: 8, border: "2px solid var(--accent-dark)", background: "var(--card-light)", color: "var(--text-primary)", fontFamily: "inherit", fontSize: 15, width: "100%" }}
                />
                <button
                  onClick={() => setShowEmoji(!showEmoji)}
                  style={{ position: "absolute", right: 8, top: 8, background: "transparent", border: "none", cursor: "pointer", fontSize: 20, padding: 4 }}
                  title="Эмодзи"
                >
                  😊
                </button>
                {showEmoji && (
                  <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, background: "var(--card-bg)", border: "2px solid var(--accent-dark)", borderRadius: 8, padding: 8, maxWidth: 320, maxHeight: 200, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, zIndex: 10, boxShadow: "var(--shadow-lg)" }}>
                    {emojis.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCommentText(commentText + emoji);
                          setShowEmoji(false);
                        }}
                        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 20, padding: 4, borderRadius: 4, transition: "background 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={postComment} disabled={!canComment} style={{ padding: "10px 16px", background: canComment ? "var(--accent)" : "var(--accent-dark)", color: "var(--text-primary)", border: "none", borderRadius: 8, cursor: canComment ? "pointer" : "not-allowed", fontWeight: 600, opacity: canComment ? 1 : 0.5 }}>
                Отправить
              </button>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
                Комментировать могут только авторизованные пользователи.
              </p>
            </div>

            {work.comments.length === 0 && <p style={{ marginTop: 12, color: "var(--text-secondary)" }}>Пока нет комментариев.</p>}

            {work.comments.length > 0 && (
              <ul style={{ marginTop: 12, display: "grid", gap: 10, listStyle: "none", padding: 0 }}>
                {work.comments.map((c) => (
                  <li key={c.id} style={{ borderTop: "2px solid var(--accent-dark)", paddingTop: 10 }}>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {c.user.displayName ?? c.user.username} · {new Date(c.createdAt).toLocaleString()}
                    </div>
                    <div style={{ color: "var(--text-primary)" }}>{c.text}</div>
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
