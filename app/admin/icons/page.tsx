/*
 * 🎨 STL Platform - Icon Management
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface IconData {
  key: string;
  name: string;
  description: string;
  value: string;
  type: 'svg' | 'url';
}

interface IconHistory {
  id: string;
  timestamp: string;
  icons: Record<string, IconData>;
}

const DEFAULT_ICONS: IconData[] = [
  {
    key: 'logo',
    name: 'Логотип',
    description: 'Основной логотип платформы',
    value: 'СТЛ',
    type: 'svg',
  },
  {
    key: 'user-avatar',
    name: 'Аватар пользователя',
    description: 'Иконка по умолчанию для пользователей без аватара',
    value: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"/><circle cx="12" cy="7" r="4"/></svg>',
    type: 'svg',
  },
  {
    key: 'work-icon',
    name: 'Иконка работы',
    description: 'Иконка для работ и портфолио',
    value: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    type: 'svg',
  },
  {
    key: 'news-icon',
    name: 'Иконка новостей',
    description: 'Иконка для новостей и статей',
    value: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8z"/></svg>',
    type: 'svg',
  },
  {
    key: 'chat-icon',
    name: 'Иконка чата',
    description: 'Иконка для сообщений и чата',
    value: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    type: 'svg',
  },
  {
    key: 'music-icon',
    name: 'Иконка музыки',
    description: 'Иконка для музыкального раздела',
    value: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    type: 'svg',
  },
  {
    key: 'settings-icon',
    name: 'Иконка настроек',
    description: 'Иконка для настроек и конфигурации',
    value: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/></svg>',
    type: 'svg',
  },
  {
    key: 'stats-icon',
    name: 'Иконка статистики',
    description: 'Иконка для аналитики и статистики',
    value: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
    type: 'svg',
  },
  // Module icons from platform settings
  {
    key: 'module-artists',
    name: 'Модуль: Каталог специалистов',
    description: 'Иконка модуля каталога специалистов',
    value: '👥',
    type: 'svg',
  },
  {
    key: 'module-works',
    name: 'Модуль: Портфолио',
    description: 'Иконка модуля работ и портфолио',
    value: '🖼️',
    type: 'svg',
  },
  {
    key: 'module-inquiries',
    name: 'Модуль: Заявки',
    description: 'Иконка модуля заявок',
    value: '💼',
    type: 'svg',
  },
  {
    key: 'module-chat',
    name: 'Модуль: Чат',
    description: 'Иконка модуля чата',
    value: '💬',
    type: 'svg',
  },
  {
    key: 'module-news',
    name: 'Модуль: Новости',
    description: 'Иконка модуля новостей',
    value: '📰',
    type: 'svg',
  },
  {
    key: 'module-music',
    name: 'Модуль: Музыка',
    description: 'Иконка модуля музыки',
    value: '🎵',
    type: 'svg',
  },
  {
    key: 'module-palettes',
    name: 'Модуль: Палитры',
    description: 'Иконка модуля палитр',
    value: '🎨',
    type: 'svg',
  },
  {
    key: 'module-notifications',
    name: 'Модуль: Уведомления',
    description: 'Иконка модуля уведомлений',
    value: '🔔',
    type: 'svg',
  },
  {
    key: 'module-search',
    name: 'Модуль: Поиск',
    description: 'Иконка модуля поиска',
    value: '🔍',
    type: 'svg',
  },
];

export default function IconManagementPage() {
  const [icons, setIcons] = useState<IconData[]>(DEFAULT_ICONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [history, setHistory] = useState<IconHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState<string | null>(null);

  useEffect(() => {
    loadIcons();
    loadHistory();
  }, []);

  async function loadIcons() {
    try {
      const res = await fetch('/api/admin/icons');
      const data = await res.json();
      if (res.ok && data.icons) {
        setIcons(data.icons);
      }
    } catch (error) {
      console.error('Failed to load icons:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch('/api/admin/icons/history');
      const data = await res.json();
      if (res.ok && data.history) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  async function saveIcons() {
    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch('/api/admin/icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icons }),
      });

      if (res.ok) {
        setStatus('✅ Иконки сохранены');
        await loadHistory();
      } else {
        setStatus('❌ Ошибка сохранения');
      }
    } catch (error) {
      setStatus('❌ Ошибка сети');
    } finally {
      setSaving(false);
    }
  }

  async function restoreVersion(versionId: string) {
    if (!confirm('Восстановить эту версию иконок?')) return;

    try {
      const res = await fetch('/api/admin/icons/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });

      if (res.ok) {
        setStatus('✅ Версия восстановлена');
        await loadIcons();
        await loadHistory();
        setShowHistory(false);
      } else {
        setStatus('❌ Ошибка восстановления');
      }
    } catch (error) {
      setStatus('❌ Ошибка сети');
    }
  }

  function handleIconChange(key: string, value: string) {
    setIcons(prev => prev.map(icon =>
      icon.key === key ? { ...icon, value } : icon
    ));
  }

  async function handleFileUpload(key: string, file: File) {
    setUploadingIcon(key);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (file.type === 'image/svg+xml') {
          handleIconChange(key, result);
        } else {
          // For other image types, use data URL
          handleIconChange(key, result);
          setIcons(prev => prev.map(icon =>
            icon.key === key ? { ...icon, type: 'url' as const } : icon
          ));
        }
        setUploadingIcon(null);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingIcon(null);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/admin" className={styles.backLink}>
            ← Назад в админ-панель
          </Link>
          <h1>Управление иконками</h1>
          <p>Настройка иконок оформления сайта</p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={() => setShowHistory(true)}
            className={styles.historyButton}
          >
            📜 История
          </button>
          <button
            onClick={saveIcons}
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? 'Сохранение...' : '💾 Сохранить'}
          </button>
        </div>
      </div>

      {status && (
        <div className={`${styles.status} ${status.includes('❌') ? styles.statusError : styles.statusSuccess}`}>
          {status}
        </div>
      )}

      <div className={styles.iconGrid}>
        {icons.map((icon) => (
          <div key={icon.key} className={styles.iconCard}>
            <div className={styles.iconPreview}>
              {icon.type === 'svg' ? (
                <div
                  className={styles.iconSvg}
                  dangerouslySetInnerHTML={{ __html: icon.value }}
                />
              ) : (
                <img src={icon.value} alt={icon.name} className={styles.iconImage} />
              )}
            </div>
            <div className={styles.iconInfo}>
              <h3>{icon.name}</h3>
              <p>{icon.description}</p>
              <div className={styles.iconActions}>
                <label className={styles.uploadButton}>
                  {uploadingIcon === icon.key ? 'Загрузка...' : '📁 Загрузить'}
                  <input
                    type="file"
                    accept="image/svg+xml,image/png,image/jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(icon.key, file);
                    }}
                    disabled={uploadingIcon === icon.key}
                  />
                </label>
                <button
                  onClick={() => {
                    const defaultIcon = DEFAULT_ICONS.find(i => i.key === icon.key);
                    if (defaultIcon) {
                      handleIconChange(icon.key, defaultIcon.value);
                    }
                  }}
                  className={styles.resetButton}
                >
                  ↺ Сброс
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className={styles.modal} onClick={() => setShowHistory(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>История изменений</h2>
              <button onClick={() => setShowHistory(false)} className={styles.closeButton}>
                ✕
              </button>
            </div>
            <div className={styles.historyList}>
              {history.length === 0 ? (
                <p className={styles.emptyHistory}>История пуста</p>
              ) : (
                history.map((version) => (
                  <div key={version.id} className={styles.historyItem}>
                    <div className={styles.historyInfo}>
                      <div className={styles.historyDate}>
                        {new Date(version.timestamp).toLocaleString('ru-RU')}
                      </div>
                      <div className={styles.historyChanges}>
                        {Object.keys(version.icons).length} иконок
                      </div>
                    </div>
                    <button
                      onClick={() => restoreVersion(version.id)}
                      className={styles.restoreButton}
                    >
                      Восстановить
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
