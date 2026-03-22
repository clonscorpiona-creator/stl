/*
 * 💬 STL Platform - Chat Admin Page (Enhanced)
 * 📦 Version: 2.0.0
 * 📅 Created: 2026-03-20
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import ThemeSwitcher from "../../components/ThemeSwitcher";

type Channel = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isReadonly: boolean;
};

type Ban = {
  id: string;
  reason: string | null;
  expiresAt: string | null;
  createdAt: string;
  channel: {
    slug: string;
    title: string;
  } | null;
  user: {
    id: string;
    username: string;
    displayName: string | null;
  };
  bannedBy: {
    username: string;
    displayName: string | null;
  };
};

export default function ChatAdminPage() {
  const [activeTab, setActiveTab] = useState<"channels" | "bans">("channels");

  // 📋 Channels state
  const [channels, setChannels] = useState<Channel[]>([]);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isReadonly, setIsReadonly] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  // 🚫 Bans state
  const [bans, setBans] = useState<Ban[]>([]);
  const [banUsername, setBanUsername] = useState("");
  const [banChannelId, setBanChannelId] = useState<string>("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<string>("24");
  const [isPermanent, setIsPermanent] = useState(false);

  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChannels();
    loadBans();
  }, []);

  async function loadChannels() {
    const res = await fetch("/api/chat/channels");
    const data = await res.json();
    if (res.ok) {
      setChannels(data.channels);
    }
  }

  async function loadBans() {
    const res = await fetch("/api/chat/bans?active=true");
    const data = await res.json();
    if (res.ok) {
      setBans(data.bans);
    }
  }

  async function createChannel(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    const res = await fetch("/api/chat/channels", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, title, description, isReadonly })
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("Канал создан!");
      setSlug("");
      setTitle("");
      setDescription("");
      setIsReadonly(false);
      loadChannels();
    } else {
      setStatus(data.error || "Ошибка");
    }

    setLoading(false);
  }

  async function updateChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!editingChannel) return;

    setStatus(null);
    setLoading(true);

    const res = await fetch(`/api/chat/channels/${editingChannel.slug}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, description, isReadonly })
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("Канал обновлен!");
      setEditingChannel(null);
      setSlug("");
      setTitle("");
      setDescription("");
      setIsReadonly(false);
      loadChannels();
    } else {
      setStatus(data.error || "Ошибка");
    }

    setLoading(false);
  }

  async function deleteChannel(channelSlug: string) {
    if (!confirm("Удалить этот канал? Все сообщения будут удалены.")) return;

    const res = await fetch(`/api/chat/channels/${channelSlug}`, {
      method: "DELETE",
    });

    if (res.ok) {
      loadChannels();
      setStatus("Канал удален");
    } else {
      const data = await res.json();
      setStatus(data.error || "Ошибка удаления");
    }
  }

  function startEditChannel(channel: Channel) {
    setEditingChannel(channel);
    setSlug(channel.slug);
    setTitle(channel.title);
    setDescription(channel.description || "");
    setIsReadonly(channel.isReadonly);
  }

  function cancelEdit() {
    setEditingChannel(null);
    setSlug("");
    setTitle("");
    setDescription("");
    setIsReadonly(false);
  }

  async function createBan(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    // 🔍 Find user by username
    const userRes = await fetch(`/api/users/search?q=${banUsername}`);
    const userData = await userRes.json();

    if (!userRes.ok || !userData.users || userData.users.length === 0) {
      setStatus("Пользователь не найден");
      setLoading(false);
      return;
    }

    const user = userData.users.find((u: any) => u.username === banUsername);
    if (!user) {
      setStatus("Пользователь не найден");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/chat/bans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        channelId: banChannelId || null,
        reason: banReason || null,
        durationHours: isPermanent ? null : parseInt(banDuration),
      })
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("Бан выдан!");
      setBanUsername("");
      setBanChannelId("");
      setBanReason("");
      setBanDuration("24");
      setIsPermanent(false);
      loadBans();
    } else {
      setStatus(data.error || "Ошибка");
    }

    setLoading(false);
  }

  async function removeBan(banId: string) {
    if (!confirm("Снять бан с этого пользователя?")) return;

    const res = await fetch(`/api/chat/bans/${banId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      loadBans();
      setStatus("Бан снят");
    } else {
      const data = await res.json();
      setStatus(data.error || "Ошибка");
    }
  }

  return (
    <div className={styles.page}>
      <ThemeSwitcher />
      <main className={styles.main}>
        <Link href="/chat" className={styles.backLink}>
          ← Назад в чат
        </Link>

        <h1 className={styles.title}>Управление чатом</h1>
        <p className={styles.subtitle}>Панель администратора</p>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "channels" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("channels")}
          >
            Каналы
          </button>
          <button
            className={`${styles.tab} ${activeTab === "bans" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("bans")}
          >
            Баны
          </button>
        </div>

        {status && <div className={styles.statusMessage}>{status}</div>}

        {activeTab === "channels" && (
          <>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {editingChannel ? "Редактировать канал" : "Создать новый канал"}
              </h2>
              <form onSubmit={editingChannel ? updateChannel : createChannel} className={styles.form}>
                {!editingChannel && (
                  <div className={styles.formGroup}>
                    <label>Slug (URL)</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="web-design"
                      required
                      className={styles.input}
                    />
                    <small>Только латиница, цифры и дефисы</small>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label>Название</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="WEB-дизайн"
                    required
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Описание</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Обсуждение веб-дизайна и UI/UX"
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={isReadonly}
                      onChange={(e) => setIsReadonly(e.target.checked)}
                    />
                    <span>Только для чтения (анонсы)</span>
                  </label>
                </div>

                <div className={styles.buttonGroup}>
                  <button type="submit" disabled={loading} className={styles.button}>
                    {loading ? "Сохранение..." : editingChannel ? "Обновить канал" : "Создать канал"}
                  </button>
                  {editingChannel && (
                    <button type="button" onClick={cancelEdit} className={styles.buttonSecondary}>
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Существующие каналы ({channels.length})</h2>
              <div className={styles.channelList}>
                {channels.map((ch) => (
                  <div key={ch.id} className={styles.channelCard}>
                    <div>
                      <h3 className={styles.channelTitle}>#{ch.title}</h3>
                      <p className={styles.channelSlug}>/{ch.slug}</p>
                      {ch.description && (
                        <p className={styles.channelDesc}>{ch.description}</p>
                      )}
                    </div>
                    <div className={styles.channelActions}>
                      {ch.isReadonly && (
                        <span className={styles.readonlyBadge}>Только чтение</span>
                      )}
                      <button
                        onClick={() => startEditChannel(ch)}
                        className={styles.editButton}
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => deleteChannel(ch.slug)}
                        className={styles.deleteButton}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "bans" && (
          <>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Выдать бан</h2>
              <form onSubmit={createBan} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Username пользователя</label>
                  <input
                    type="text"
                    value={banUsername}
                    onChange={(e) => setBanUsername(e.target.value)}
                    placeholder="username"
                    required
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Канал (оставьте пустым для бана во всех каналах)</label>
                  <select
                    value={banChannelId}
                    onChange={(e) => setBanChannelId(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">Все каналы</option>
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        #{ch.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Причина</label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Нарушение правил чата"
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={isPermanent}
                      onChange={(e) => setIsPermanent(e.target.checked)}
                    />
                    <span>Постоянный бан</span>
                  </label>
                </div>

                {!isPermanent && (
                  <div className={styles.formGroup}>
                    <label>Длительность (часов)</label>
                    <select
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value)}
                      className={styles.select}
                    >
                      <option value="1">1 час</option>
                      <option value="6">6 часов</option>
                      <option value="24">24 часа</option>
                      <option value="72">3 дня</option>
                      <option value="168">7 дней</option>
                      <option value="720">30 дней</option>
                    </select>
                  </div>
                )}

                <button type="submit" disabled={loading} className={styles.button}>
                  {loading ? "Выдача бана..." : "Выдать бан"}
                </button>
              </form>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Активные баны ({bans.length})</h2>
              <div className={styles.banList}>
                {bans.length === 0 ? (
                  <p className={styles.emptyMessage}>Активных банов нет</p>
                ) : (
                  bans.map((ban) => (
                    <div key={ban.id} className={styles.banCard}>
                      <div className={styles.banInfo}>
                        <h3 className={styles.banUser}>
                          {ban.user.displayName || ban.user.username}
                        </h3>
                        <p className={styles.banDetail}>
                          <strong>Канал:</strong> {ban.channel ? `#${ban.channel.title}` : "Все каналы"}
                        </p>
                        {ban.reason && (
                          <p className={styles.banDetail}>
                            <strong>Причина:</strong> {ban.reason}
                          </p>
                        )}
                        <p className={styles.banDetail}>
                          <strong>Выдал:</strong> {ban.bannedBy.displayName || ban.bannedBy.username}
                        </p>
                        <p className={styles.banDetail}>
                          <strong>Истекает:</strong>{" "}
                          {ban.expiresAt
                            ? new Date(ban.expiresAt).toLocaleString("ru")
                            : "Постоянный"}
                        </p>
                      </div>
                      <button
                        onClick={() => removeBan(ban.id)}
                        className={styles.unbanButton}
                      >
                        Разбанить
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
