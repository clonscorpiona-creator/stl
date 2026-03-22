/*
 * 🛡️ STL Platform - Chat Moderation Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function ChatModerationPage() {
  const [userId, setUserId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [reason, setReason] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function banUser(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    const res = await fetch("/api/chat/bans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId,
        channelId: channelId || null,
        reason: reason || null,
        durationMinutes
      })
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("Пользователь забанен");
      setUserId("");
      setChannelId("");
      setReason("");
      setDurationMinutes(null);
    } else {
      setStatus(data.error || "Ошибка");
    }

    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <Link href="/chat" style={{ color: "var(--accent)", marginBottom: 20, display: "block" }}>
        ← Назад в чат
      </Link>

      <h1 style={{ fontSize: 36, marginBottom: 10, color: "var(--text-primary)" }}>
        Модерация чата
      </h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 40 }}>
        Управление банами и модерация сообщений
      </p>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Забанить пользователя</h2>
        <form onSubmit={banUser} className={styles.form}>
          <div className={styles.formGroup}>
            <label>ID пользователя</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="uuid пользователя"
              required
              className={styles.input}
            />
            <small>Можно найти в профиле или сообщениях</small>
          </div>

          <div className={styles.formGroup}>
            <label>ID канала (опционально)</label>
            <input
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="Оставьте пустым для глобального бана"
              className={styles.input}
            />
            <small>Если пусто - бан во всех каналах</small>
          </div>

          <div className={styles.formGroup}>
            <label>Причина</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Нарушение правил сообщества"
              className={styles.textarea}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Длительность (минуты)</label>
            <input
              type="number"
              value={durationMinutes || ""}
              onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Оставьте пустым для перманентного бана"
              className={styles.input}
              min="1"
            />
            <small>Примеры: 60 (1 час), 1440 (1 день), 10080 (неделя)</small>
          </div>

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Применение..." : "Забанить"}
          </button>

          {status && <p className={styles.status}>{status}</p>}
        </form>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Инструкции</h2>
        <div className={styles.instructions}>
          <h3>Удаление сообщений</h3>
          <p>
            Наведите на сообщение в чате и нажмите кнопку "×" в правом верхнем углу.
            Модераторы и администраторы могут удалять любые сообщения.
          </p>

          <h3>Типы банов</h3>
          <ul>
            <li><strong>Глобальный бан:</strong> Не указывайте ID канала</li>
            <li><strong>Бан в канале:</strong> Укажите ID конкретного канала</li>
            <li><strong>Временный бан:</strong> Укажите длительность в минутах</li>
            <li><strong>Перманентный бан:</strong> Оставьте длительность пустой</li>
          </ul>

          <h3>Получение ID пользователя</h3>
          <p>
            ID пользователя можно найти в URL его профиля или через API.
            В будущих версиях будет добавлена кнопка "Забанить" прямо в сообщениях.
          </p>
        </div>
      </div>
    </main>
  );
}
