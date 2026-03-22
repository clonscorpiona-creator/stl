/*
 * 📋 STL Platform - Inquiry Detail Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type InquiryStatus = "NEW" | "ACTIVE" | "CLOSED";

type Message = {
  id: string;
  text: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
  };
};

type Inquiry = {
  id: string;
  subject: string;
  direction: string;
  status: InquiryStatus;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    displayName: string | null;
  };
  recipient: {
    id: string;
    username: string;
    displayName: string | null;
  };
  messages: Message[];
};

const statusLabels: Record<InquiryStatus, string> = {
  NEW: "Новая",
  ACTIVE: "Активная",
  CLOSED: "Закрыта",
};

export default function InquiryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    // 📥 Load inquiry and current user data
    Promise.all([
      fetch(`/api/inquiries/${params.id}`).then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ])
      .then(([inquiryData, meData]) => {
        if (inquiryData.inquiry) {
          setInquiry(inquiryData.inquiry);
        }
        if (meData.user) {
          setCurrentUserId(meData.user.id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    // 📜 Auto-scroll to latest message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [inquiry?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    // 📤 Send new message in inquiry
    e.preventDefault();
    if (!messageText.trim()) return;

    setError("");
    setSending(true);

    try {
      const res = await fetch(`/api/inquiries/${params.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: messageText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      // 🔄 Update local messages list
      setInquiry((prev) =>
        prev ? { ...prev, messages: [...prev.messages, data.message] } : null
      );
      setMessageText("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (action: "accept" | "close") => {
    // 🔄 Change inquiry status (accept/close)
    try {
      const res = await fetch(`/api/inquiries/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      // 🔄 Update local inquiry status
      setInquiry((prev) => (prev ? { ...prev, status: data.inquiry.status } : null));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
        <p>Загрузка...</p>
      </main>
    );
  }

  if (!inquiry) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
        <p>Заявка не найдена</p>
        <Link href="/inquiries">← К списку заявок</Link>
      </main>
    );
  }

  const isRecipient = currentUserId === inquiry.recipient.id;
  const otherUser = isRecipient ? inquiry.creator : inquiry.recipient;

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <Link href="/inquiries" style={{ color: "var(--accent-dark)", textDecoration: "none" }}>
        ← К списку заявок
      </Link>

      <header
        style={{
          marginTop: 20,
          padding: 20,
          background: "var(--card-bg)",
          borderRadius: 12,
          marginBottom: 20,
          border: "2px solid var(--accent-dark)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <h1 style={{ margin: 0, marginBottom: 8, fontSize: 24, color: "var(--text-primary)" }}>{inquiry.subject}</h1>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>
              {isRecipient ? "От" : "Для"}: {otherUser.displayName || otherUser.username}
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
              Направление: {inquiry.direction}
            </p>
          </div>
          <span
            style={{
              fontSize: 14,
              padding: "6px 14px",
              background: inquiry.status === "CLOSED" ? "var(--text-secondary)" : "var(--accent)",
              color: inquiry.status === "CLOSED" ? "var(--foreground)" : "var(--text-primary)",
              borderRadius: 16,
              fontWeight: 600,
            }}
          >
            {statusLabels[inquiry.status]}
          </span>
        </div>

        {isRecipient && inquiry.status === "NEW" && (
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button
              onClick={() => handleStatusChange("accept")}
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
              Принять заявку
            </button>
            <button
              onClick={() => handleStatusChange("close")}
              style={{
                padding: "8px 16px",
                background: "var(--accent-dark)",
                color: "var(--text-primary)",
                border: "2px solid var(--foreground)",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Отклонить
            </button>
          </div>
        )}

        {isRecipient && inquiry.status === "ACTIVE" && (
          <button
            onClick={() => handleStatusChange("close")}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              background: "var(--text-secondary)",
              color: "var(--foreground)",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Закрыть заявку
          </button>
        )}
      </header>

      <div
        style={{
          border: "2px solid var(--accent-dark)",
          borderRadius: 12,
          padding: 20,
          minHeight: 400,
          maxHeight: 600,
          overflowY: "auto",
          marginBottom: 20,
          background: "var(--card-bg)",
        }}
      >
        {inquiry.messages.map((msg) => {
          const isOwn = msg.sender.id === currentUserId;
          return (
            <div
              key={msg.id}
              style={{
                marginBottom: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: isOwn ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  padding: "12px 16px",
                  background: isOwn ? "var(--accent)" : "var(--card-light)",
                  color: "var(--text-primary)",
                  borderRadius: 12,
                  borderTopRightRadius: isOwn ? 4 : 12,
                  borderTopLeftRadius: isOwn ? 12 : 4,
                }}
              >
                {!isOwn && (
                  <p style={{ margin: 0, marginBottom: 4, fontSize: 13, opacity: 0.8, color: "var(--text-secondary)" }}>
                    {msg.sender.displayName || msg.sender.username}
                  </p>
                )}
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.text}</p>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                {new Date(msg.createdAt).toLocaleString("ru")}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {inquiry.status !== "CLOSED" && (
        <form onSubmit={handleSendMessage} style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Написать сообщение..."
              rows={3}
              disabled={sending}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "2px solid var(--accent-dark)",
                fontSize: 15,
                fontFamily: "inherit",
                resize: "none",
                background: "var(--card-light)",
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
              <div style={{ position: "absolute", right: 0, bottom: "100%", marginBottom: 4, background: "var(--card-bg)", border: "2px solid var(--accent-dark)", borderRadius: 8, padding: 8, maxWidth: 320, maxHeight: 200, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, zIndex: 10, boxShadow: "var(--shadow-lg)" }}>
                {emojis.map((emoji, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setMessageText(messageText + emoji);
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
          <button
            type="submit"
            disabled={sending || !messageText.trim()}
            style={{
              padding: "12px 24px",
              background: sending || !messageText.trim() ? "var(--accent-dark)" : "var(--accent)",
              color: "var(--text-primary)",
              border: "none",
              borderRadius: 8,
              cursor: sending || !messageText.trim() ? "not-allowed" : "pointer",
              fontSize: 15,
              fontWeight: 600,
              alignSelf: "flex-end",
              opacity: sending || !messageText.trim() ? 0.5 : 1,
            }}
          >
            {sending ? "..." : "Отправить"}
          </button>
        </form>
      )}

      {inquiry.status === "CLOSED" && (
        <div
          style={{
            padding: 16,
            background: "var(--card-light)",
            borderRadius: 8,
            textAlign: "center",
            color: "var(--text-secondary)",
            border: "2px solid var(--accent-dark)",
          }}
        >
          Заявка закрыта. Отправка сообщений невозможна.
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "var(--accent-dark)",
            border: "2px solid var(--foreground)",
            borderRadius: 8,
            color: "var(--text-primary)",
          }}
        >
          {error}
        </div>
      )}
    </main>
  );
}
