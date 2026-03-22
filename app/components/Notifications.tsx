/*
 * 🔔 STL Platform - Notifications Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-20
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSocket } from "@/lib/socket";
import styles from "./Notifications.module.css";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      const socket = getSocket();
      // 🔌 Join user room for real-time notifications
      socket.emit('join-user', userId);

      // 🔔 Listen for new notifications
      socket.on('new-notification', (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      return () => {
        socket.off('new-notification');
      };
    }
  }, [userId]);

  async function loadUserId() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUserId(data.user.id);
      }
    } catch (err) {
      // 👤 User not logged in
    }
  }

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=20");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
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
      setUnreadCount((prev) => Math.max(0, prev - 1));
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
      setUnreadCount(0);
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
    return `${Math.floor(seconds / 86400)} дн назад`;
  }

  if (!userId) return null;

  return (
    <div className={styles.container}>
      <button
        className={styles.bellButton}
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Уведомления"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"/>
          <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"/>
        </svg>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Уведомления</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className={styles.markAllButton}>
                Прочитать все
              </button>
            )}
          </div>

          <div className={styles.list}>
            {loading && <p className={styles.empty}>Загрузка...</p>}
            {!loading && notifications.length === 0 && (
              <p className={styles.empty}>Нет уведомлений</p>
            )}
            {!loading &&
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`${styles.item} ${!notif.isRead ? styles.unread : ""}`}
                  onClick={() => {
                    if (!notif.isRead) markAsRead(notif.id);
                    if (notif.linkUrl) {
                      window.location.href = notif.linkUrl;
                    }
                    setShowDropdown(false);
                  }}
                >
                  <div className={styles.content}>
                    <strong>{notif.title}</strong>
                    <p>{notif.message}</p>
                    <span className={styles.time}>{getTimeAgo(notif.createdAt)}</span>
                  </div>
                  {!notif.isRead && <div className={styles.dot}></div>}
                </div>
              ))}
          </div>

          <Link href="/notifications" className={styles.viewAll} onClick={() => setShowDropdown(false)}>
            Все уведомления
          </Link>
        </div>
      )}
    </div>
  );
}
