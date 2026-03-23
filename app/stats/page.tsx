/*
 * 📊 STL Platform - User Statistics Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-20
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type UserStats = {
  totalWorks: number;
  publishedWorks: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  worksByDirection: Array<{
    direction: string;
    count: number;
  }>;
  recentActivity: number;
  mostLikedWork: {
    id: string;
    title: string;
    _count: {
      likes: number;
    };
  } | null;
};

const DIRECTION_LABELS: Record<string, string> = {
  ILLUSTRATION_2D: "2D иллюстрация",
  GRAPHIC_DESIGN: "Графический дизайн",
  MOTION: "Моушн-дизайн",
  MODELING_3D: "3D моделирование",
  VISUALIZATION_3D: "3D визуализация",
  PRINTING_3D: "3D печать",
  WEB_DESIGN: "Веб-дизайн",
};

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndStats();
  }, []);

  async function loadUserAndStats() {
    try {
      // 👤 Get current user
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();

      if (!meData.user) {
        setLoading(false);
        return;
      }

      setUsername(meData.user.username);

      // 📊 Get stats
      const statsRes = await fetch(`/api/users/${meData.user.username}/stats`);
      const statsData = await statsRes.json();

      if (statsRes.ok) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p>Загрузка...</p>
        </main>
      </div>
    );
  }

  if (!username || !stats) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p>Вы не авторизованы</p>
          <Link href="/auth/login">Войти</Link>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <Link href="/profile" className={styles.backLink}>
            ← Профиль
          </Link>
          <h1 className={styles.title}>Моя статистика</h1>
        </header>

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 20V10M9 20V4M15 20V12M21 20V8"/>
              </svg>
            </div>
            <div className={styles.cardValue}>{stats.totalWorks}</div>
            <div className={styles.cardLabel}>Всего работ</div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.3 2 18.2 3.6 20 6.2"/>
                <path d="M22 4L12 14L9 11"/>
              </svg>
            </div>
            <div className={styles.cardValue}>{stats.publishedWorks}</div>
            <div className={styles.cardLabel}>Опубликовано</div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61C19.5 3.27 17.66 2.5 15.75 2.5C13.84 2.5 12 3.27 10.66 4.61L12 5.97L13.34 4.61C14.22 3.73 15.45 3.23 16.75 3.23C18.05 3.23 19.28 3.73 20.16 4.61C21.04 5.49 21.54 6.72 21.54 8.02C21.54 9.32 21.04 10.55 20.16 11.43L12 19.59L3.84 11.43C2.96 10.55 2.46 9.32 2.46 8.02C2.46 6.72 2.96 5.49 3.84 4.61C4.72 3.73 5.95 3.23 7.25 3.23C8.55 3.23 9.78 3.73 10.66 4.61L12 5.97"/>
              </svg>
            </div>
            <div className={styles.cardValue}>{stats.totalLikes}</div>
            <div className={styles.cardLabel}>Лайков получено</div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"/>
              </svg>
            </div>
            <div className={styles.cardValue}>{stats.totalComments}</div>
            <div className={styles.cardLabel}>Комментариев</div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Работы по направлениям</h2>
          {stats.worksByDirection.length === 0 ? (
            <p className={styles.empty}>Нет опубликованных работ</p>
          ) : (
            <div className={styles.directionList}>
              {stats.worksByDirection.map((item) => (
                <div key={item.direction} className={styles.directionItem}>
                  <span className={styles.directionName}>
                    {DIRECTION_LABELS[item.direction] || item.direction}
                  </span>
                  <span className={styles.directionCount}>{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Активность</h2>
          <div className={styles.activityCard}>
            <p>
              <strong>За последние 30 дней:</strong> {stats.recentActivity} работ
            </p>
            {stats.mostLikedWork && (
              <p>
                <strong>Самая популярная работа:</strong>{" "}
                <Link href={`/works/${stats.mostLikedWork.id}`} className={styles.workLink}>
                  {stats.mostLikedWork.title}
                </Link>{" "}
                ({stats.mostLikedWork._count.likes} лайков)
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
