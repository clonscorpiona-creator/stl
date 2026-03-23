/*
 * 🎨 STL Platform - Works Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import Link from "next/link";
import styles from "./page.module.css";

export default function WorksPage() {
  const works = [
    {
      id: 1,
      title: "Футуристический город",
      author: "Алексей Иванов",
      category: "3D",
      views: 1240,
      likes: 89
    },
    {
      id: 2,
      title: "Портрет в стиле аниме",
      author: "Мария Петрова",
      category: "2D",
      views: 856,
      likes: 124
    },
    {
      id: 3,
      title: "Анимация логотипа",
      author: "Дмитрий Сидоров",
      category: "Motion",
      views: 2100,
      likes: 156
    },
    {
      id: 4,
      title: "Интерьер гостиной",
      author: "Елена Смирнова",
      category: "Визуализация",
      views: 1580,
      likes: 98
    },
    {
      id: 5,
      title: "Персонаж для игры",
      author: "Игорь Козлов",
      category: "3D",
      views: 1920,
      likes: 142
    },
    {
      id: 6,
      title: "Иллюстрация к книге",
      author: "Ольга Новикова",
      category: "2D",
      views: 1050,
      likes: 87
    }
  ];

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>
            ← Главная
          </Link>
          <h1 className={styles.title}>Портфолио</h1>
          <p className={styles.subtitle}>Работы участников сообщества</p>
        </header>

        <div className={styles.filters}>
          <button className={`${styles.filterButton} ${styles.active}`}>Все</button>
          <button className={styles.filterButton}>2D</button>
          <button className={styles.filterButton}>3D</button>
          <button className={styles.filterButton}>Motion</button>
          <button className={styles.filterButton}>Визуализация</button>
        </div>

        <div className={styles.worksGrid}>
          {works.map((work) => (
            <div key={work.id} className={styles.workCard}>
              <div className={styles.workImage}>
                <div className={styles.placeholder}>
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <rect x="12" y="16" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="24" cy="28" r="3" fill="currentColor"/>
                    <path d="M12 38 L22 30 L32 38 L42 28 L52 36 L52 48 L12 48 Z" fill="currentColor" opacity="0.3"/>
                  </svg>
                </div>
                <div className={styles.categoryBadge}>{work.category}</div>
              </div>
              <div className={styles.workInfo}>
                <h3 className={styles.workTitle}>{work.title}</h3>
                <p className={styles.workAuthor}>{work.author}</p>
                <div className={styles.workStats}>
                  <span className={styles.stat}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    {work.views}
                  </span>
                  <span className={styles.stat}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20.84 4.61C20.3985 4.16826 19.8783 3.81792 19.3061 3.57866C18.7339 3.3394 18.1206 3.21591 17.5 3.21591C16.8794 3.21591 16.2661 3.3394 15.6939 3.57866C15.1217 3.81792 14.6015 4.16826 14.16 4.61L12 6.77L9.84 4.61C8.94942 3.71942 7.74269 3.21591 6.48 3.21591C5.21731 3.21591 4.01058 3.71942 3.12 4.61C2.22942 5.50058 1.72591 6.70731 1.72591 7.97C1.72591 9.23269 2.22942 10.4394 3.12 11.33L12 20.21L20.88 11.33C21.7706 10.4394 22.2741 9.23269 22.2741 7.97C22.2741 6.70731 21.7706 5.50058 20.88 4.61H20.84Z"/>
                    </svg>
                    {work.likes}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
