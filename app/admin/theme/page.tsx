/*
 * 🎨 STL Platform - Theme Customization Admin Panel
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

type ThemeProperty = {
  key: string;
  label: string;
  type: 'color' | 'number' | 'radius' | 'opacity' | 'select';
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
};

type ThemeSection = {
  name: string;
  icon: string;
  properties: ThemeProperty[];
};

const THEME_SECTIONS: ThemeSection[] = [
  {
    name: 'Оформление шапки сайта',
    icon: '🎯',
    properties: [
      { key: 'header-bg', label: 'Фон шапки', type: 'color' },
      { key: 'header-text-color', label: 'Цвет текста в шапке', type: 'color' },
      { key: 'header-opacity', label: 'Прозрачность шапки', type: 'opacity', min: 0, max: 1, step: 0.01 },
      { key: 'header-height', label: 'Высота шапки', type: 'number', unit: 'px', min: 40, max: 120, step: 4 },
      { key: 'header-border-radius', label: 'Радиус закругления', type: 'radius', unit: 'px', min: 0, max: 50, step: 1 },
      { key: 'header-padding', label: 'Внутренние отступы', type: 'number', unit: 'px', min: 8, max: 48, step: 2 },
    ],
  },
  {
    name: 'Оформление футера',
    icon: '🦶',
    properties: [
      { key: 'footer-bg', label: 'Фон футера', type: 'color' },
      { key: 'footer-text-color', label: 'Цвет текста в футере', type: 'color' },
      { key: 'footer-opacity', label: 'Прозрачность футера', type: 'opacity', min: 0, max: 1, step: 0.01 },
      { key: 'footer-border-radius', label: 'Радиус закругления', type: 'radius', unit: 'px', min: 0, max: 50, step: 1 },
      { key: 'footer-padding', label: 'Внутренние отступы', type: 'number', unit: 'px', min: 8, max: 48, step: 2 },
    ],
  },
  {
    name: 'Цвета фона',
    icon: '🎨',
    properties: [
      { key: 'background', label: 'Основной фон', type: 'color' },
      { key: 'foreground', label: 'Передний план', type: 'color' },
      { key: 'card-bg', label: 'Фон карточек', type: 'color' },
      { key: 'card-light', label: 'Светлый фон карточек', type: 'color' },
    ],
  },
  {
    name: 'Акцентные цвета',
    icon: '✨',
    properties: [
      { key: 'accent', label: 'Основной акцент', type: 'color' },
      { key: 'accent-light', label: 'Светлый акцент', type: 'color' },
      { key: 'accent-dark', label: 'Темный акцент', type: 'color' },
    ],
  },
  {
    name: 'Цвета текста',
    icon: '📝',
    properties: [
      { key: 'text-primary', label: 'Основной текст', type: 'color' },
      { key: 'text-secondary', label: 'Вторичный текст', type: 'color' },
      { key: 'text-muted', label: 'Приглушенный текст', type: 'color' },
      { key: 'text-link', label: 'Цвет ссылок', type: 'color' },
      { key: 'text-heading', label: 'Цвет заголовков', type: 'color' },
      { key: 'text-error', label: 'Текст ошибок', type: 'color' },
      { key: 'text-success', label: 'Текст успеха', type: 'color' },
      { key: 'text-warning', label: 'Текст предупреждений', type: 'color' },
      { key: 'card-text-color', label: 'Текст на карточках', type: 'color' },
      { key: 'sidebar-text-color', label: 'Текст в боковой панели', type: 'color' },
    ],
  },
  {
    name: 'Границы и тени',
    icon: '🔲',
    properties: [
      { key: 'border', label: 'Цвет границ', type: 'color' },
    ],
  },
  {
    name: 'Прозрачность',
    icon: '👁️',
    properties: [
      { key: 'card-opacity', label: 'Прозрачность карточек', type: 'opacity', min: 0, max: 1, step: 0.01 },
      { key: 'sidebar-opacity', label: 'Прозрачность боковых панелей', type: 'opacity', min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    name: 'Радиусы закругления',
    icon: '⭕',
    properties: [
      { key: 'border-radius-sm', label: 'Малый радиус', type: 'radius', unit: 'px', min: 0, max: 50, step: 1 },
      { key: 'border-radius-md', label: 'Средний радиус', type: 'radius', unit: 'px', min: 0, max: 50, step: 1 },
      { key: 'border-radius-lg', label: 'Большой радиус', type: 'radius', unit: 'px', min: 0, max: 50, step: 1 },
      { key: 'card-border-radius', label: 'Радиус карточек', type: 'radius', unit: 'px', min: 0, max: 50, step: 1 },
    ],
  },
  {
    name: 'Размеры элементов',
    icon: '📏',
    properties: [
      { key: 'button-height', label: 'Высота кнопок', type: 'number', unit: 'px', min: 28, max: 64, step: 2 },
      { key: 'input-height', label: 'Высота полей ввода', type: 'number', unit: 'px', min: 32, max: 72, step: 2 },
      { key: 'card-padding', label: 'Отступы карточек', type: 'number', unit: 'px', min: 8, max: 48, step: 2 },
    ],
  },
  {
    name: 'Размеры карточек',
    icon: '📐',
    properties: [
      { key: 'card-max-width', label: 'Максимальная ширина', type: 'number', unit: 'px', min: 200, max: 800, step: 10 },
      { key: 'card-min-height', label: 'Минимальная высота', type: 'number', unit: 'px', min: 100, max: 600, step: 10 },
    ],
  },
  {
    name: 'Паттерн фона',
    icon: '🔳',
    properties: [
      {
        key: 'background-pattern',
        label: 'Тип паттерна',
        type: 'select',
        options: [
          { value: 'none', label: 'Без паттерна' },
          { value: 'dots', label: 'Точки' },
          { value: 'grid', label: 'Сетка' },
          { value: 'lines', label: 'Линии' },
          { value: 'diagonal', label: 'Диагональ' },
          { value: 'crosses', label: 'Крестики' },
        ]
      },
      { key: 'background-pattern-opacity', label: 'Прозрачность паттерна', type: 'opacity', min: 0, max: 1, step: 0.01 },
      { key: 'background-pattern-size', label: 'Размер паттерна', type: 'number', unit: 'px', min: 10, max: 100, step: 5 },
    ],
  },
  {
    name: 'Цвета админ-панели',
    icon: '⚙️',
    properties: [
      { key: 'admin-heading-color', label: 'Цвет заголовков', type: 'color' },
      { key: 'admin-description-color', label: 'Цвет описаний', type: 'color' },
      { key: 'admin-label-color', label: 'Цвет меток', type: 'color' },
      { key: 'admin-sidebar-title-color', label: 'Цвет заголовка боковой панели', type: 'color' },
      { key: 'admin-sidebar-link-color', label: 'Цвет ссылок боковой панели', type: 'color' },
    ],
  },
  {
    name: 'Боковая панель главной страницы',
    icon: '📋',
    properties: [
      { key: 'main-sidebar-bg', label: 'Фон боковой панели', type: 'color' },
      { key: 'main-sidebar-title-color', label: 'Цвет заголовка', type: 'color' },
      { key: 'main-sidebar-link-color', label: 'Цвет ссылок', type: 'color' },
      { key: 'main-sidebar-opacity', label: 'Прозрачность', type: 'opacity', min: 0, max: 1, step: 0.01 },
      { key: 'main-sidebar-width', label: 'Ширина', type: 'number', unit: 'px', min: 200, max: 400, step: 10 },
      {
        key: 'main-sidebar-enabled',
        label: 'Включить боковую панель',
        type: 'select',
        options: [
          { value: '1', label: 'Включено' },
          { value: '0', label: 'Выключено' },
        ]
      },
    ],
  },
];

export default function ThemeCustomizationPage() {
  const [currentValues, setCurrentValues] = useState<Record<string, string>>({});
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [icons, setIcons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; timestamp: Date; settings: Record<string, string> }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [themes, setThemes] = useState<Array<{ id: string; name: string; isActive: boolean }>>([]);
  const [currentThemeId, setCurrentThemeId] = useState<string>('default');
  const [showNewThemeModal, setShowNewThemeModal] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [showCssEditor, setShowCssEditor] = useState(false);
  const [cssCode, setCssCode] = useState('');

  useEffect(() => {
    loadThemes();
    loadThemeSettings();
    loadIcons();
  }, []);

  useEffect(() => {
    generateCssCode();
  }, [newValues]);

  async function loadThemes() {
    try {
      const res = await fetch('/api/admin/themes');
      const data = await res.json();
      if (res.ok) {
        setThemes(data.themes || []);
        const active = data.themes?.find((t: any) => t.isActive);
        if (active) setCurrentThemeId(active.id);
      }
    } catch (error) {
      console.error('Failed to load themes:', error);
    }
  }

  async function loadIcons() {
    try {
      const res = await fetch('/api/admin/icons');
      const data = await res.json();
      if (res.ok) {
        setIcons(data.icons || {});
      }
    } catch (error) {
      console.error('Failed to load icons:', error);
    }
  }

  function generateCssCode() {
    const css = `:root {
${Object.entries(newValues).map(([key, value]) => `  --${key}: ${value};`).join('\n')}
}`;
    setCssCode(css);
  }

  async function saveAsNewTheme() {
    if (!newThemeName.trim()) {
      setStatus('❌ Введите название темы');
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch('/api/admin/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newThemeName,
          settings: newValues
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowNewThemeModal(false);
        setNewThemeName('');
        await loadThemes();
        setStatus('✅ Новая тема создана');
      } else {
        setStatus(`❌ ${data.error || 'Ошибка создания темы'}`);
      }
    } catch (error) {
      setStatus('❌ Ошибка сети');
    } finally {
      setSaving(false);
    }
  }

  async function switchTheme(themeId: string) {
    try {
      const res = await fetch('/api/admin/themes/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId }),
      });

      if (res.ok) {
        setCurrentThemeId(themeId);
        await loadThemeSettings();
        setStatus('✅ Тема переключена');
      }
    } catch (error) {
      setStatus('❌ Ошибка переключения темы');
    }
  }

  async function loadThemeSettings() {
    try {
      const res = await fetch('/api/admin/theme');
      const data = await res.json();

      if (res.ok) {
        setCurrentValues(data.settings);
        setNewValues(data.settings);
      } else {
        setStatus('Ошибка загрузки настроек');
      }
    } catch (error) {
      setStatus('Ошибка сети');
    } finally {
      setLoading(false);
    }
  }

  async function saveThemeSettings() {
    setSaving(true);
    setStatus(null);

    try {
      // 🔒 Validate payload size before sending
      const payloadSize = JSON.stringify({ settings: newValues }).length;
      console.log(`Saving ${Object.keys(newValues).length} settings, payload size: ${(payloadSize/1024).toFixed(2)} KB`);

      if (payloadSize > 1000000) { // 1MB
        setStatus('❌ Ошибка: данные слишком большие. Обновите страницу (Ctrl+Shift+R)');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newValues }),
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentValues(newValues);
        setStatus('✅ Настройки успешно сохранены');

        // 🔄 Apply changes to current page
        applyThemeToPage(newValues);
      } else {
        console.error('Save error:', data);
        setStatus(`❌ ${data.error || 'Ошибка сохранения'}${data.details ? ': ' + data.details : ''}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      setStatus('❌ Ошибка сети: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }

  function applyThemeToPage(values: Record<string, string>) {
    const root = document.documentElement;
    Object.entries(values).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }

  function resetToDefault() {
    if (confirm('Сбросить все изменения к текущим сохраненным значениям?')) {
      setNewValues({ ...currentValues });
      setStatus(null);
    }
  }

  function handleValueChange(key: string, value: string) {
    setNewValues(prev => ({ ...prev, [key]: value }));
    setStatus(null);
  }

  async function handleIconUpload(iconKey: string, file: File) {
    setUploadingIcon(iconKey);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('iconKey', iconKey);

      const res = await fetch('/api/admin/icons/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setIcons(prev => ({ ...prev, [iconKey]: data.path }));
        setStatus('✅ Иконка успешно загружена');
      } else {
        setStatus(`❌ ${data.error || 'Ошибка загрузки'}`);
      }
    } catch (error) {
      setStatus('❌ Ошибка сети');
    } finally {
      setUploadingIcon(null);
    }
  }

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/admin/theme/history');
      const data = await res.json();
      if (res.ok) {
        setHistory(data.versions || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function restoreVersion(versionId: string) {
    if (!confirm('Восстановить эту версию настроек темы?')) {
      return;
    }

    setStatus(null);
    try {
      const res = await fetch('/api/admin/theme/history/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentValues(data.settings);
        setNewValues(data.settings);
        applyThemeToPage(data.settings);
        setShowHistory(false);
        setStatus('✅ Версия успешно восстановлена');
      } else {
        setStatus(`❌ ${data.error || 'Ошибка восстановления'}`);
      }
    } catch (error) {
      setStatus('❌ Ошибка сети');
    }
  }

  const hasChanges = JSON.stringify(currentValues) !== JSON.stringify(newValues);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* 📋 Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>Разделы</h3>
        <nav className={styles.sidebarNav}>
          <Link
            href="/admin"
            className={styles.sidebarLink}
          >
            <span>🏠</span>
            <span>Главная</span>
          </Link>
          <Link
            href="/admin/sidebar"
            className={styles.sidebarLink}
          >
            <span>📋</span>
            <span>Боковая панель</span>
          </Link>
          <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }}></div>
          {THEME_SECTIONS.map((section) => (
            <a
              key={section.name}
              href={`#${section.name}`}
              className={`${styles.sidebarLink} ${activeSection === section.name ? styles.sidebarLinkActive : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveSection(section.name);
                document.getElementById(section.name)?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>{section.icon}</span>
              <span>{section.name}</span>
            </a>
          ))}
          <a
            href="#icons"
            className={`${styles.sidebarLink} ${activeSection === 'icons' ? styles.sidebarLinkActive : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('icons');
              document.getElementById('icons')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span>🖼️</span>
            <span>Управление иконками</span>
          </a>
        </nav>
      </aside>

      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <Link href="/admin" className={styles.backLink}>
              ← Назад в админ-панель
            </Link>
            <h1>Настройка темы оформления</h1>
            <p>Точная настройка всех элементов интерфейса</p>
            {themes.length > 0 && (
              <div className={styles.currentTheme}>
                <span className={styles.currentThemeLabel}>Редактируемая тема:</span>
                <span className={styles.currentThemeName}>
                  {themes.find(t => t.id === currentThemeId)?.name || 'Неизвестная тема'}
                </span>
              </div>
            )}
          </div>
          <div className={styles.headerActions}>
            <select
              value={currentThemeId}
              onChange={(e) => switchTheme(e.target.value)}
              className={styles.themeSelect}
            >
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name} {theme.isActive ? '(активная)' : ''}
                </option>
              ))}
            </select>
            {hasChanges && (
              <button onClick={resetToDefault} className={styles.resetButton}>
                Сбросить
              </button>
            )}
            <button
              onClick={() => setShowCssEditor(!showCssEditor)}
              className={styles.historyButton}
            >
              {showCssEditor ? '📝 Скрыть CSS' : '📝 Показать CSS'}
            </button>
            <button
              onClick={() => {
                setShowHistory(true);
                loadHistory();
              }}
              className={styles.historyButton}
            >
              📜 История
            </button>
            <button
              onClick={saveThemeSettings}
              disabled={!hasChanges || saving}
              className={styles.saveButton}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              onClick={() => setShowNewThemeModal(true)}
              className={styles.saveButton}
            >
              ➕ Новая тема
            </button>
          </div>
        </div>

        {status && (
          <div className={`${styles.status} ${status.includes('❌') ? styles.statusError : styles.statusSuccess}`}>
            {status}
          </div>
        )}

        {/* 📝 CSS Editor Panel */}
        {showCssEditor && (
          <div className={styles.cssEditorPanel}>
            <div className={styles.cssEditorHeader}>
              <h3>CSS код темы</h3>
              <p>Редактируйте CSS напрямую или используйте визуальные настройки</p>
            </div>
            <textarea
              value={cssCode}
              onChange={(e) => setCssCode(e.target.value)}
              className={styles.cssTextarea}
              spellCheck={false}
            />
          </div>
        )}

        <div className={styles.sections}>
          {THEME_SECTIONS.map((section) => (
            <div key={section.name} id={section.name} className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>{section.icon}</span>
                {section.name}
              </h2>

              <div className={styles.properties}>
                {section.properties.map((prop) => (
                  <div key={prop.key} className={styles.property}>
                    <div className={styles.propertyLabel}>{prop.label}</div>

                    <div className={styles.propertyContent}>
                      <div className={styles.propertyValues}>
                        {/* 📊 Current Value Column */}
                        <div className={styles.valueColumn}>
                          <div className={styles.columnLabel}>Текущее</div>
                          <div className={styles.valueDisplay}>
                            {prop.type === 'color' && (
                              <div className={styles.colorPreview}>
                                <div
                                  className={styles.colorSwatch}
                                  style={{ backgroundColor: currentValues[prop.key] || '#000' }}
                                />
                                <span className={styles.colorValue}>
                                  {currentValues[prop.key] || 'не задано'}
                                </span>
                              </div>
                            )}
                            {(prop.type === 'number' || prop.type === 'radius' || prop.type === 'opacity') && (
                              <span className={styles.numericValue}>
                                {currentValues[prop.key] || '0'}
                                {prop.unit && ` ${prop.unit}`}
                              </span>
                            )}
                            {prop.type === 'select' && (
                              <span className={styles.numericValue}>
                                {prop.options?.find(opt => opt.value === currentValues[prop.key])?.label || currentValues[prop.key] || 'не задано'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ✏️ New Value Column */}
                        <div className={styles.valueColumn}>
                          <div className={styles.columnLabel}>Новое</div>
                        <div className={styles.valueInput}>
                          {prop.type === 'color' && (
                            <div className={styles.colorInput}>
                              <input
                                type="color"
                                value={newValues[prop.key] || '#000000'}
                                onChange={(e) => handleValueChange(prop.key, e.target.value)}
                                className={styles.colorPicker}
                              />
                              <input
                                type="text"
                                value={newValues[prop.key] || ''}
                                onChange={(e) => handleValueChange(prop.key, e.target.value)}
                                placeholder="#000000"
                                className={styles.colorText}
                              />
                            </div>
                          )}
                          {(prop.type === 'number' || prop.type === 'radius') && (
                            <div className={styles.numericInput}>
                              <input
                                type="range"
                                min={prop.min}
                                max={prop.max}
                                step={prop.step}
                                value={parseFloat(newValues[prop.key]) || prop.min || 0}
                                onChange={(e) => handleValueChange(prop.key, `${e.target.value}${prop.unit || ''}`)}
                                className={styles.slider}
                              />
                              <input
                                type="number"
                                min={prop.min}
                                max={prop.max}
                                step={prop.step}
                                value={parseFloat(newValues[prop.key]) || 0}
                                onChange={(e) => handleValueChange(prop.key, `${e.target.value}${prop.unit || ''}`)}
                                className={styles.numberInput}
                              />
                              {prop.unit && <span className={styles.unit}>{prop.unit}</span>}
                            </div>
                          )}
                          {prop.type === 'opacity' && (
                            <div className={styles.numericInput}>
                              <input
                                type="range"
                                min={prop.min}
                                max={prop.max}
                                step={prop.step}
                                value={parseFloat(newValues[prop.key]) || 1}
                                onChange={(e) => handleValueChange(prop.key, e.target.value)}
                                className={styles.slider}
                              />
                              <input
                                type="number"
                                min={prop.min}
                                max={prop.max}
                                step={prop.step}
                                value={parseFloat(newValues[prop.key]) || 1}
                                onChange={(e) => handleValueChange(prop.key, e.target.value)}
                                className={styles.numberInput}
                              />
                            </div>
                          )}
                          {prop.type === 'select' && prop.options && (
                            <select
                              value={newValues[prop.key] || prop.options[0]?.value}
                              onChange={(e) => handleValueChange(prop.key, e.target.value)}
                              className={styles.selectInput}
                            >
                              {prop.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 👁️ Preview Column */}
                    <div className={styles.propertyPreview}>
                      {(prop.key === 'background' || prop.key === 'foreground') && (
                        <div className={styles.previewBox} style={{ backgroundColor: newValues[prop.key] || currentValues[prop.key] }}>
                          <span style={{ color: newValues['text-primary'] || currentValues['text-primary'] }}>Фон</span>
                        </div>
                      )}
                      {(prop.key === 'card-bg' || prop.key === 'card-light') && (
                        <div className={styles.previewCard} style={{ backgroundColor: newValues[prop.key] || currentValues[prop.key] }}>
                          <span style={{ color: newValues['card-text-color'] || currentValues['card-text-color'] }}>Карточка</span>
                        </div>
                      )}
                      {(prop.key === 'accent' || prop.key === 'accent-light' || prop.key === 'accent-dark') && (
                        <button className={styles.previewButton} style={{ backgroundColor: newValues[prop.key] || currentValues[prop.key] }}>
                          Кнопка
                        </button>
                      )}
                      {(prop.key === 'text-primary' || prop.key === 'text-secondary' || prop.key === 'text-muted' || prop.key === 'text-heading') && (
                        <div className={styles.previewText} style={{ color: newValues[prop.key] || currentValues[prop.key] }}>
                          Текст
                        </div>
                      )}
                      {prop.key === 'text-link' && (
                        <a className={styles.previewLink} style={{ color: newValues[prop.key] || currentValues[prop.key] }}>
                          Ссылка
                        </a>
                      )}
                      {(prop.key === 'text-error' || prop.key === 'text-success' || prop.key === 'text-warning') && (
                        <div className={styles.previewText} style={{
                          color: newValues[prop.key] || currentValues[prop.key],
                          fontWeight: 600
                        }}>
                          {prop.key === 'text-error' && '❌ Ошибка'}
                          {prop.key === 'text-success' && '✅ Успех'}
                          {prop.key === 'text-warning' && '⚠️ Внимание'}
                        </div>
                      )}
                      {(prop.key === 'card-text-color' || prop.key === 'header-text-color' || prop.key === 'sidebar-text-color') && (
                        <div className={styles.previewCard} style={{
                          backgroundColor: newValues['card-bg'] || currentValues['card-bg'],
                          color: newValues[prop.key] || currentValues[prop.key]
                        }}>
                          Текст
                        </div>
                      )}
                      {prop.key === 'border' && (
                        <div className={styles.previewBorder} style={{ borderColor: newValues[prop.key] || currentValues[prop.key] }}>
                          Граница
                        </div>
                      )}
                      {prop.key.includes('border-radius') && (
                        <div className={styles.previewRadius} style={{
                          borderRadius: newValues[prop.key] || currentValues[prop.key],
                          backgroundColor: newValues['accent'] || currentValues['accent']
                        }}>
                          {parseFloat(newValues[prop.key] || currentValues[prop.key] || '0')}px
                        </div>
                      )}
                      {prop.key.includes('opacity') && (
                        <div className={styles.previewOpacity} style={{
                          backgroundColor: newValues['card-bg'] || currentValues['card-bg'],
                          opacity: newValues[prop.key] || currentValues[prop.key]
                        }}>
                          {Math.round((parseFloat(newValues[prop.key] || currentValues[prop.key] || '1') * 100))}%
                        </div>
                      )}
                      {(prop.key.includes('height') || prop.key.includes('width') || prop.key.includes('spacing')) && (
                        <div className={styles.previewDimension} style={{
                          width: prop.key.includes('width') ? (newValues[prop.key] || currentValues[prop.key]) : '80px',
                          height: prop.key.includes('height') ? (newValues[prop.key] || currentValues[prop.key]) : '40px',
                          backgroundColor: newValues['accent'] || currentValues['accent']
                        }}>
                          {parseFloat(newValues[prop.key] || currentValues[prop.key] || '0')}{prop.unit}
                        </div>
                      )}
                      {prop.key.includes('pattern') && prop.key !== 'background-pattern-size' && (
                        <div className={styles.previewPattern} style={{
                          backgroundColor: newValues['background'] || currentValues['background']
                        }}>
                          Паттерн
                        </div>
                      )}
                    </div>
                  </div>

                    {currentValues[prop.key] !== newValues[prop.key] && (
                      <div className={styles.changeIndicator}>
                        Изменено
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 🖼️ Icons Management Section */}
        <div id="icons" className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🖼️</span>
            Управление иконками
          </h2>
          <div className={styles.iconsGrid}>
            {icons && Object.entries(icons).map(([key, path]) => (
              <div key={key} className={styles.iconItem}>
                <div className={styles.iconPreview}>
                  {path && (
                    <img src={path} alt={key} className={styles.iconImage} />
                  )}
                </div>
                <div className={styles.iconInfo}>
                  <div className={styles.iconLabel}>{key}</div>
                  <div className={styles.iconPath}>{path || 'не задано'}</div>
                </div>
                <label className={styles.iconUploadButton}>
                  {uploadingIcon === key ? 'Загрузка...' : 'Заменить'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleIconUpload(key, file);
                    }}
                    disabled={uploadingIcon === key}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ➕ New Theme Modal */}
      {showNewThemeModal && (
        <div className={styles.modal} onClick={() => setShowNewThemeModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Создать новую тему</h2>
              <button onClick={() => setShowNewThemeModal(false)} className={styles.modalClose}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.newThemeForm}>
                <label className={styles.formLabel}>Название темы</label>
                <input
                  type="text"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  placeholder="Например: Темная тема"
                  className={styles.formInput}
                  autoFocus
                />
                <p className={styles.formHint}>
                  Текущие настройки будут сохранены как новая тема
                </p>
                <div className={styles.formActions}>
                  <button
                    onClick={() => setShowNewThemeModal(false)}
                    className={styles.cancelButton}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={saveAsNewTheme}
                    disabled={!newThemeName.trim() || saving}
                    className={styles.saveButton}
                  >
                    {saving ? 'Создание...' : 'Создать тему'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📜 History Modal */}
      {showHistory && (
        <div className={styles.modal} onClick={() => setShowHistory(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>История изменений темы</h2>
              <button onClick={() => setShowHistory(false)} className={styles.modalClose}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              {loadingHistory ? (
                <p>Загрузка...</p>
              ) : history.length === 0 ? (
                <p className={styles.emptyHistory}>История изменений пуста</p>
              ) : (
                <div className={styles.historyList}>
                  {history.map((version) => (
                    <div key={version.id} className={styles.historyItem}>
                      <div className={styles.historyInfo}>
                        <div className={styles.historyDate}>
                          {new Date(version.timestamp).toLocaleString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className={styles.historyDetails}>
                          {Object.keys(version.settings).length} параметров
                        </div>
                      </div>
                      <button
                        onClick={() => restoreVersion(version.id)}
                        className={styles.restoreButton}
                      >
                        Восстановить
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
