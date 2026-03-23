/*
 * 🔔 STL Platform - Notifications Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-20
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  async function loadNotifications() {
    setLoading(true);
    try {
      // 📥 Load notifications based on filter
      const url = filter === "unread"
        ? "/api/notifications?unread=true&limit=100"
        : "/api/notifications?limit=100";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      // ✅ Mark notification as read
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  async function markAllAsRead() {
    try {
      // ✅ Mark all notifications as read
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }

  function getTimeAgo(dateString: string): string {
    // ⏰ Calculate time ago from date
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "только что";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} дн назад`;
    return date.toLocaleDateString("ru");
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>
            ← Главная
          </Link>
          <h1 className={styles.title}>Уведомления</h1>

          <div className={styles.controls}>
            <div className={styles.filters}>
              <button
                className={filter === "all" ? styles.filterActive : styles.filter}
                onClick={() => setFilter("all")}
              >
                Все
              </button>
              <button
                className={filter === "unread" ? styles.filterActive : styles.filter}
                onClick={() => setFilter("unread")}
              >
                Непрочитанные
              </button>
            </div>
            {notifications.some(n => !n.isRead) && (
              <button onClick={markAllAsRead} className={styles.markAllButton}>
                Прочитать все
              </button>
            )}
          </div>
        </header>

        {loading && <p className={styles.loading}>Загрузка...</p>}

        {!loading && notifications.length === 0 && (
          <p className={styles.empty}>
            {filter === "unread" ? "Нет непрочитанных уведомлений" : "Нет уведомлений"}
          </p>
        )}

        {!loading && notifications.length > 0 && (
          <div className={styles.list}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`${styles.item} ${!notif.isRead ? styles.unread : ""}`}
              >
                <div className={styles.content}>
                  <div className={styles.itemHeader}>
                    <strong>{notif.title}</strong>
                    <span className={styles.time}>{getTimeAgo(notif.createdAt)}</span>
                  </div>
                  <p>{notif.message}</p>
                  <div className={styles.actions}>
                    {notif.linkUrl && (
                      <Link href={notif.linkUrl} className={styles.link}>
                        Перейти →
                      </Link>
                    )}
                    {!notif.isRead && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className={styles.markReadButton}
                      >
                        Отметить прочитанным
                      </button>
                    )}
                  </div>
                </div>
                {!notif.isRead && <div className={styles.dot}></div>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
