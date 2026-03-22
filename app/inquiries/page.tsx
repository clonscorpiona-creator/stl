/*
 * 📋 STL Platform - Inquiries Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type InquiryStatus = "NEW" | "ACTIVE" | "CLOSED";

type Inquiry = {
  id: string;
  subject: string;
  direction: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
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
  messages: { text: string; createdAt: string }[];
  _count: { messages: number };
};

const statusLabels: Record<InquiryStatus, string> = {
  NEW: "Новая",
  ACTIVE: "Активная",
  CLOSED: "Закрыта",
};

const statusColors: Record<InquiryStatus, string> = {
  NEW: "var(--accent-light)",
  ACTIVE: "var(--accent)",
  CLOSED: "var(--text-secondary)",
};

export default function InquiriesPage() {
  const [type, setType] = useState<"received" | "created">("received");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 📥 Load inquiries based on type
    setLoading(true);
    fetch(`/api/inquiries?type=${type}`)
      .then((r) => r.json())
      .then((data) => {
        setInquiries(data.inquiries || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [type]);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <header style={{ marginBottom: 30 }}>
        <Link href="/" style={{ color: "var(--accent-dark)", textDecoration: "none" }}>
          ← Главная
        </Link>
        <h1 style={{ marginTop: 10, marginBottom: 20, color: "var(--foreground)" }}>Заявки</h1>

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => setType("received")}
            style={{
              padding: "10px 20px",
              background: type === "received" ? "var(--accent)" : "transparent",
              color: type === "received" ? "var(--text-primary)" : "var(--text-secondary)",
              border: "2px solid var(--accent-dark)",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Входящие
          </button>
          <button
            onClick={() => setType("created")}
            style={{
              padding: "10px 20px",
              background: type === "created" ? "var(--accent)" : "transparent",
              color: type === "created" ? "var(--text-primary)" : "var(--text-secondary)",
              border: "2px solid var(--accent-dark)",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Исходящие
          </button>
        </div>
      </header>

      {loading && <p style={{ color: "var(--text-secondary)" }}>Загрузка...</p>}

      {!loading && inquiries.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
          <p>Заявок пока нет</p>
          {type === "created" && (
            <Link
              href="/artists"
              style={{
                display: "inline-block",
                marginTop: 20,
                padding: "10px 20px",
                background: "var(--accent)",
                color: "var(--text-primary)",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Найти художника
            </Link>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {inquiries.map((inquiry) => {
          // 👤 Determine the other user in the inquiry
          const otherUser = type === "received" ? inquiry.creator : inquiry.recipient;
          const lastMessage = inquiry.messages[0];

          return (
            <Link
              key={inquiry.id}
              href={`/inquiries/${inquiry.id}`}
              style={{
                display: "block",
                padding: 16,
                border: "2px solid var(--accent-dark)",
                borderRadius: 12,
                textDecoration: "none",
                color: "inherit",
                transition: "all 0.2s",
                background: "var(--card-bg)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: "var(--text-primary)" }}>{inquiry.subject}</h3>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    background: statusColors[inquiry.status],
                    color: "var(--foreground)",
                    borderRadius: 12,
                    fontWeight: 600,
                  }}
                >
                  {statusLabels[inquiry.status]}
                </span>
              </div>

              <p style={{ margin: "8px 0", fontSize: 14, color: "var(--text-secondary)" }}>
                {type === "received" ? "От" : "Для"}: {otherUser.displayName || otherUser.username}
              </p>

              {lastMessage && (
                <p
                  style={{
                    margin: "8px 0",
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lastMessage.text}
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {inquiry._count.messages} {inquiry._count.messages === 1 ? "сообщение" : "сообщений"}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {new Date(inquiry.updatedAt).toLocaleDateString("ru")}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
