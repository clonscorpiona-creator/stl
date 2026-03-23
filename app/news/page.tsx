/*
 * 📰 STL Platform - News Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type NewsPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  publishedAt: string;
  author: {
    displayName: string | null;
    username: string;
  };
};

export default function NewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
    loadUserRole();
  }, []);

  async function loadPosts() {
    // 📥 Load published news posts
    try {
      const res = await fetch("/api/news?status=PUBLISHED&limit=20");
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Failed to load news:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserRole() {
    // 👤 Check user role for admin features
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.user) {
        setUserRole(data.user.role);
      }
    } catch (err) {
      // 🚫 User not logged in
    }
  }

  function getExcerpt(content: string, maxLength: number = 200): string {
    // ✂️ Truncate content to excerpt length
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  }

  function getCategoryFromContent(content: string): string {
    // 🔍 Simple category detection based on keywords
    const lower = content.toLowerCase();
    if (lower.includes("обновлен") || lower.includes("версия")) return "Обновления";
    if (lower.includes("функци") || lower.includes("возможност")) return "Функции";
    if (lower.includes("дизайн") || lower.includes("тем")) return "Дизайн";
    if (lower.includes("оптимизац") || lower.includes("улучшен")) return "Улучшения";
    return "Сообщество";
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

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>
            ← Главная
          </Link>
          <h1 className={styles.title}>Новости</h1>
          <p className={styles.subtitle}>Последние обновления и события</p>
          {userRole === "ADMIN" && (
            <Link href="/news/admin" className={styles.adminLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                <circle cx="12" cy="12" r="2"/>
                <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"/>
              </svg>
              Управление новостями
            </Link>
          )}
        </header>

        {posts.length === 0 ? (
          <p className={styles.empty}>Новостей пока нет</p>
        ) : (
          <div className={styles.newsGrid}>
            {posts.map((item) => (
              <article key={item.id} className={styles.newsCard}>
                <div className={styles.newsHeader}>
                  <span className={styles.category}>{getCategoryFromContent(item.content)}</span>
                  <time className={styles.date}>
                    {new Date(item.publishedAt).toLocaleDateString("ru")}
                  </time>
                </div>
                <h2 className={styles.newsTitle}>{item.title}</h2>
                <p className={styles.excerpt}>{getExcerpt(item.content)}</p>
                <div className={styles.newsFooter}>
                  <span className={styles.author}>
                    {item.author.displayName || item.author.username}
                  </span>
                  <Link href={`/news/${item.slug}`} className={styles.readMore}>
                    Читать далее →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
