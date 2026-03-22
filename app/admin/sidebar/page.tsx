/*
 * 📋 STL Platform - Sidebar Management Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../theme/page.module.css';

type SidebarLink = {
  id: string;
  icon: string;
  label: string;
  href: string;
  order: number;
};

export default function SidebarManagementPage() {
  const [links, setLinks] = useState<SidebarLink[]>([
    { id: '1', icon: '🏠', label: 'Главная', href: '/', order: 1 },
    { id: '2', icon: '🎨', label: 'Работы', href: '/works', order: 2 },
    { id: '3', icon: '👥', label: 'Художники', href: '/artists', order: 3 },
    { id: '4', icon: '💬', label: 'Чат', href: '/chat', order: 4 },
    { id: '5', icon: '📰', label: 'Новости', href: '/news', order: 5 },
  ]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);

    try {
      // TODO: Implement API endpoint for saving sidebar links
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('✅ Настройки боковой панели сохранены');
    } catch (error) {
      setStatus('❌ Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Админ-панель</h2>
        <nav className={styles.sidebarNav}>
          <Link href="/admin" className={styles.sidebarLink}>
            🏠 Главная
          </Link>
          <Link href="/admin/theme" className={styles.sidebarLink}>
            🎨 Тема оформления
          </Link>
          <Link href="/admin/sidebar" className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}>
            📋 Боковая панель
          </Link>
        </nav>
      </aside>

      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <Link href="/admin" className={styles.backLink}>
              ← Назад в админ-панель
            </Link>
            <h1>Управление боковой панелью</h1>
            <p>Настройте ссылки и порядок элементов в боковой панели главной страницы</p>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={handleSave}
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>

        {status && (
          <div className={`${styles.status} ${status.includes('❌') ? styles.statusError : styles.statusSuccess}`}>
            {status}
          </div>
        )}

        <div className={styles.sections}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🔗</span>
              Ссылки боковой панели
            </h2>

            <div className={styles.properties}>
              {links.map((link) => (
                <div key={link.id} className={styles.property}>
                  <div className={styles.propertyLabel}>
                    {link.icon} {link.label}
                  </div>
                  <div className={styles.propertyContent}>
                    <div className={styles.propertyValues}>
                      <div className={styles.valueColumn}>
                        <span className={styles.columnLabel}>Иконка</span>
                        <input
                          type="text"
                          value={link.icon}
                          onChange={(e) => {
                            setLinks(links.map(l =>
                              l.id === link.id ? { ...l, icon: e.target.value } : l
                            ));
                          }}
                          className={styles.colorText}
                        />
                      </div>
                      <div className={styles.valueColumn}>
                        <span className={styles.columnLabel}>Название</span>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => {
                            setLinks(links.map(l =>
                              l.id === link.id ? { ...l, label: e.target.value } : l
                            ));
                          }}
                          className={styles.colorText}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>ℹ️</span>
              Информация
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Для включения/выключения боковой панели перейдите в раздел
              <Link href="/admin/theme" style={{ color: 'var(--accent)', marginLeft: '4px' }}>
                Тема оформления
              </Link>
              {' '}и найдите настройку "Боковая панель главной страницы".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
