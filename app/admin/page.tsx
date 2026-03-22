/*
 * 🔧 STL Platform - Admin Dashboard
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import styles from './page.module.css';

export default async function AdminDashboard() {
  // 🔐 Check authentication and admin role
  const session = await getSession();

  if (!session?.userId) {
    redirect('/auth/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, displayName: true, username: true },
  });

  if (user?.role !== 'ADMIN') {
    redirect('/');
  }

  // 📊 Load platform statistics
  const stats = await Promise.all([
    prisma.user.count(),
    prisma.work.count({ where: { status: 'PUBLISHED' } }),
    prisma.work.count({ where: { status: 'MODERATION' } }),
    prisma.inquiry.count(),
    prisma.newsPost.count({ where: { status: 'PUBLISHED' } }),
  ]);

  const [totalUsers, publishedWorks, pendingWorks, totalInquiries, publishedNews] = stats;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Панель администратора</h1>
          <p>Добро пожаловать, {user.displayName || user.username}</p>
        </div>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{totalUsers}</div>
              <div className={styles.statLabel}>Пользователей</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 21L9 12L15 12L15 21"/>
                <circle cx="9" cy="9" r="2" fill="currentColor"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{publishedWorks}</div>
              <div className={styles.statLabel}>Опубликованных работ</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 7V12L15 15"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{pendingWorks}</div>
              <div className={styles.statLabel}>На модерации</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/>
                <path d="M14 2V8H20"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{totalInquiries}</div>
              <div className={styles.statLabel}>Заявок</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
                <path d="M18 14h-8"/>
                <path d="M15 18h-5"/>
                <path d="M10 6h8v4h-8z"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{publishedNews}</div>
              <div className={styles.statLabel}>Новостей</div>
            </div>
          </div>
        </div>

        <div className={styles.sections}>
          <Link href="/admin/settings" className={styles.sectionCard}>
            <div className={styles.sectionIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
              </svg>
            </div>
            <h3>Настройки платформы</h3>
            <p>Управление модулями, функциями и лимитами</p>
          </Link>

          <Link href="/admin/theme" className={styles.sectionCard}>
            <div className={styles.sectionIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C6.5 2 2 6.5 2 12C2 13.8 2.5 15.5 3.4 16.9C4 17.8 5.2 18 6.2 17.5C7.3 17 8.5 17.9 8.5 19.1V19.5C8.5 20.9 9.6 22 11 22C16.5 22 21 17.5 21 12C21 6.5 16.5 2 12 2Z"/>
                <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <h3>Настройка темы</h3>
            <p>Точная настройка цветов, размеров и элементов</p>
          </Link>

          <Link href="/admin/icons" className={styles.sectionCard}>
            <div className={styles.sectionIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <h3>Управление иконками</h3>
            <p>Настройка иконок оформления сайта</p>
          </Link>

          <Link href="/moderation/works" className={styles.sectionCard}>
            <div className={styles.sectionIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
            <h3>Модерация работ</h3>
            <p>Проверка и одобрение работ пользователей</p>
          </Link>

          <Link href="/news/admin" className={styles.sectionCard}>
            <div className={styles.sectionIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
                <path d="M18 14h-8"/>
                <path d="M15 18h-5"/>
                <path d="M10 6h8v4h-8z"/>
              </svg>
            </div>
            <h3>Управление новостями</h3>
            <p>Создание и редактирование новостей</p>
          </Link>

          <Link href="/chat/admin" className={styles.sectionCard}>
            <div className={styles.sectionIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3>Управление чатом</h3>
            <p>Модерация каналов и сообщений</p>
          </Link>

          <Link href="/music/admin" className={styles.sectionCard}>
            <div className={styles.sectionIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <h3>Управление музыкой</h3>
            <p>Загрузка и управление треками</p>
          </Link>

          <Link href="/stats" className={styles.sectionCard}>
            <div className={styles.sectionIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 3v18h18"/>
                <path d="M18 17V9"/>
                <path d="M13 17V5"/>
                <path d="M8 17v-3"/>
              </svg>
            </div>
            <h3>Статистика</h3>
            <p>Аналитика и отчеты платформы</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
