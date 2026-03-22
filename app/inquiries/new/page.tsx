/*
 * 📋 STL Platform - New Inquiry Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Direction = "ILLUSTRATION_2D" | "GRAPHIC_DESIGN" | "MOTION" | "MODELING_3D" | "VISUALIZATION_3D" | "PRINTING_3D" | "WEB_DESIGN";

const directionLabels: Record<Direction, string> = {
  ILLUSTRATION_2D: "2D-иллюстрация",
  GRAPHIC_DESIGN: "Графический дизайн",
  MOTION: "Моушн-дизайн",
  MODELING_3D: "3D-моделирование",
  VISUALIZATION_3D: "Визуализация",
  PRINTING_3D: "3D-печать",
  WEB_DESIGN: "WEB-дизайн",
};

function NewInquiryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipientId = searchParams.get("recipient");

  const [recipient, setRecipient] = useState<any>(null);
  const [direction, setDirection] = useState<Direction>("ILLUSTRATION_2D");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  useEffect(() => {
    // 👤 Load recipient user data
    if (!recipientId) return;

    fetch(`/api/users/${recipientId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setRecipient(data.user);
        }
      })
      .catch(() => {});
  }, [recipientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    // 📤 Submit new inquiry
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientUserId: recipientId,
          direction,
          subject,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create inquiry");
      }

      router.push(`/inquiries/${data.inquiry.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!recipientId) {
    return (
      <main style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
        <p>Получатель не указан</p>
        <Link href="/artists">← К каталогу художников</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <Link href="/artists" style={{ color: "var(--accent-dark)", textDecoration: "none" }}>
        ← Назад
      </Link>

      <h1 style={{ marginTop: 20, marginBottom: 10, color: "var(--foreground)" }}>Новая заявка</h1>

      {recipient && (
        <p style={{ color: "var(--text-secondary)", marginBottom: 30 }}>
          Получатель: <strong>{recipient.displayName || recipient.username}</strong>
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "var(--foreground)" }}>
            Направление проекта
          </label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as Direction)}
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "2px solid var(--accent-dark)",
              fontSize: 15,
              background: "var(--card-bg)",
              color: "var(--text-primary)",
            }}
          >
            {Object.entries(directionLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "var(--foreground)" }}>
            Тема заявки
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={200}
            placeholder="Например: Иллюстрация для книги"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "2px solid var(--accent-dark)",
              fontSize: 15,
              background: "var(--card-bg)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500, color: "var(--foreground)" }}>
            Описание проекта
          </label>
          <div style={{ position: "relative" }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={8}
              placeholder="Опишите ваш проект, сроки, бюджет и другие важные детали..."
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "2px solid var(--accent-dark)",
                fontSize: 15,
                fontFamily: "inherit",
                resize: "vertical",
                background: "var(--card-bg)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="button"
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
                    type="button"
                    onClick={() => {
                      setMessage(message + emoji);
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
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "var(--accent-dark)",
              border: "2px solid var(--foreground)",
              borderRadius: 8,
              color: "var(--text-primary)",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 24px",
            background: loading ? "var(--accent-dark)" : "var(--accent)",
            color: "var(--text-primary)",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Отправка..." : "Отправить заявку"}
        </button>
      </form>

      <div
        style={{
          marginTop: 30,
          padding: 16,
          background: "var(--card-bg)",
          borderRadius: 8,
          fontSize: 14,
          color: "var(--text-secondary)",
          border: "2px solid var(--accent-dark)",
        }}
      >
        <p style={{ margin: 0, marginBottom: 8, color: "var(--text-primary)" }}>
          <strong>Обратите внимание:</strong>
        </p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>Вы можете отправить до 3 заявок в день</li>
          <li>Художник получит уведомление о вашей заявке</li>
          <li>После отправки вы сможете продолжить общение в чате заявки</li>
        </ul>
      </div>
    </main>
  );
}

export default function NewInquiryPage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>Загрузка...</div>}>
      <NewInquiryForm />
    </Suspense>
  );
}
