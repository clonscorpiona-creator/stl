/*
 * 🏠 STL Platform - Home Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import Link from "next/link";
import styles from "./page.module.css";
import ThemeSwitcher from "./components/ThemeSwitcher";
import SpecializationCard from "./components/SpecializationCard";

export default function Home() {
  return (
    <div className={styles.page}>
      <ThemeSwitcher />
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.title}>
            <span className={styles.logo}>СТЛ</span> — Сообщество творческих людей
          </h1>
          <p className={styles.slogan}>
            Место, где творчество встречается с профессионализмом
          </p>
        </section>

        <section className={styles.specializations}>
          <div className={styles.specGrid}>
            <SpecializationCard
              direction="GRAPHIC_DESIGN"
              title="Графические дизайнеры"
              description="Иллюстрация и 2D-графика"
              icon={
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M8 12C8 10.3431 9.34315 9 11 9H29C30.6569 9 32 10.3431 32 12V28C32 29.6569 30.6569 31 29 31H11C9.34315 31 8 29.6569 8 28V12Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M14 17L18 20L14 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 23H26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
            />
            <SpecializationCard
              direction="MOTION"
              title="Моушн-дизайнеры"
              description="Анимация и motion-графика"
              icon={
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="11" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M20 11V20L26 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <SpecializationCard
              direction="MODELING_3D"
              title="3D-моделлеры"
              description="Моделинг и скульптинг"
              icon={
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 9L29 14V26L20 31L11 26V14L20 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 9V20M20 20L11 26M20 20L29 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <SpecializationCard
              direction="VISUALIZATION_3D"
              title="Визуализаторы"
              description="Archviz и product render"
              icon={
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="9" y="11" width="22" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M13 24L17 19L20 22L27 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="25" cy="16" r="1.5" fill="currentColor"/>
                </svg>
              }
            />
            <SpecializationCard
              direction="PRINTING_3D"
              title="3D-печать"
              description="Подготовка и печать моделей"
              icon={
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M12 10H28V18H12V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 18V26H25V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 18H30V24H10V18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="27" cy="21" r="1" fill="currentColor"/>
                </svg>
              }
            />
            <SpecializationCard
              direction="WEB_DESIGN"
              title="WEB-дизайнеры"
              description="Дизайн сайтов и интерфейсов"
              icon={
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="8" y="10" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 23H32" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="20" cy="28" r="1" fill="currentColor"/>
                  <path d="M13 15H19M13 18H21M13 21H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
            />
          </div>
        </section>

        <section className={styles.widgets}>
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '8px'}}>
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
                  <path d="M18 14h-8"/>
                  <path d="M15 18h-5"/>
                  <path d="M10 6h8v4h-8z"/>
                </svg>
                Последние новости
              </h3>
              <Link href="/news" className={styles.widgetLink}>Все новости →</Link>
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.newsItem}>
                <span className={styles.newsDate}>Сегодня</span>
                <p>Добро пожаловать в сообщество СТЛ!</p>
              </div>
              <div className={styles.newsItem}>
                <span className={styles.newsDate}>Вчера</span>
                <p>Запущена новая версия платформы</p>
              </div>
            </div>
          </div>

          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '8px'}}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Активные обсуждения
              </h3>
              <Link href="/chat" className={styles.widgetLink}>Перейти в чат →</Link>
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.discussionItem}>
                <span className={styles.channelBadge}>2D</span>
                <p>Обсуждение техник рисования</p>
              </div>
              <div className={styles.discussionItem}>
                <span className={styles.channelBadge}>3D</span>
                <p>Советы по оптимизации моделей</p>
              </div>
              <div className={styles.discussionItem}>
                <span className={styles.channelBadge}>Motion</span>
                <p>Новые тренды в анимации</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.navigation}>
          <Link href="/artists" className={styles.navCard}>
            <div className={styles.navIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="16" r="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 36 C12 28 16 24 24 24 C32 24 36 28 36 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="34" cy="14" r="4" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <h3>Специалисты</h3>
            <p>Найти специалиста для проекта</p>
          </Link>

          <Link href="/works" className={styles.navCard}>
            <div className={styles.navIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="14" y="14" width="8" height="8" fill="currentColor" opacity="0.6"/>
                <rect x="26" y="14" width="8" height="8" fill="currentColor" opacity="0.6"/>
                <rect x="14" y="26" width="8" height="8" fill="currentColor" opacity="0.6"/>
                <rect x="26" y="26" width="8" height="8" fill="currentColor" opacity="0.6"/>
              </svg>
            </div>
            <h3>Портфолио</h3>
            <p>Работы участников сообщества</p>
          </Link>

          <Link href="/palettes" className={styles.navCard}>
            <div className={styles.navIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="24" cy="14" r="3" fill="currentColor"/>
                <circle cx="32" cy="18" r="3" fill="currentColor" opacity="0.8"/>
                <circle cx="35" cy="26" r="3" fill="currentColor" opacity="0.6"/>
                <circle cx="32" cy="34" r="3" fill="currentColor" opacity="0.4"/>
                <circle cx="24" cy="38" r="3" fill="currentColor" opacity="0.5"/>
                <circle cx="16" cy="34" r="3" fill="currentColor" opacity="0.7"/>
                <circle cx="13" cy="26" r="3" fill="currentColor" opacity="0.9"/>
                <circle cx="16" cy="18" r="3" fill="currentColor" opacity="0.75"/>
              </svg>
            </div>
            <h3>Палитры</h3>
            <p>Генератор цветовых палитр</p>
          </Link>

          <Link href="/news" className={styles.navCard}>
            <div className={styles.navIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="10" y="8" width="28" height="32" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="16" y1="16" x2="32" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="16" y1="22" x2="28" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="16" y1="27" x2="32" y2="27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="16" y1="32" x2="26" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Новости</h3>
            <p>События и обновления</p>
          </Link>

          <Link href="/music" className={styles.navCard}>
            <div className={styles.navIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="24" cy="24" r="4" fill="currentColor"/>
                <path d="M24 6 L24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M38 18 L24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M38 30 L24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Музыка</h3>
            <p>Музыкальный плеер</p>
          </Link>

          <Link href="/rules" className={styles.navCard}>
            <div className={styles.navIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 8 L38 16 L38 28 L24 40 L10 28 L10 16 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M24 18 L24 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="24" cy="31" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <h3>Правила</h3>
            <p>Правила сообщества</p>
          </Link>

          <Link href="/contact" className={styles.navCard}>
            <div className={styles.navIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="14" width="32" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 14 L24 26 L40 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Контакты</h3>
            <p>Связаться с нами</p>
          </Link>
        </section>
      </main>
    </div>
  );
}
