/*
 * ⚙️ STL Platform - Admin Settings Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { MODULES, ModuleKey } from '@/lib/modules';

interface Setting {
  key: string;
  value: any;
  type: 'string' | 'boolean' | 'number' | 'json';
  description?: string;
  category: 'general' | 'modules' | 'features' | 'limits';
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    // 📥 Load settings from API
    try {
      const res = await fetch('/api/admin/settings');
      if (res.status === 401 || res.status === 403) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setSettings(data.settings || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateSetting(key: string, value: any) {
    // 💾 Update setting value
    setSaving(key);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      if (!res.ok) {
        throw new Error('Failed to update setting');
      }

      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value } : s))
      );
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Ошибка при сохранении настройки');
    } finally {
      setSaving(null);
    }
  }

  const categorizedSettings = {
    general: settings.filter((s) =>
      s.category === 'general' &&
      !s.key.includes('opacity') &&
      s.key !== 'ui.header_opacity' &&
      s.key !== 'ui.card_opacity' &&
      s.key !== 'ui.sidebar_opacity'
    ),
    modules: settings.filter((s) => s.category === 'modules'),
    features: settings.filter((s) => s.category === 'features'),
    limits: settings.filter((s) => s.category === 'limits'),
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Настройки платформы</h1>
          <p>Управление модулями, функциями и параметрами</p>
        </div>

        <div className={styles.sections}>
          {/* Modules Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </span>
              Модули платформы
            </h2>
            <p className={styles.sectionDesc}>
              Включайте или отключайте модули. Отключенные модули не будут отображаться в навигации.
            </p>
            <div className={styles.settingsList}>
              {categorizedSettings.modules.map((setting) => {
                const moduleKey = setting.key.replace('module.', '').replace('.enabled', '') as ModuleKey;
                const module = MODULES[moduleKey];

                return (
                  <div key={setting.key} className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <div className={styles.settingHeader}>
                        <span className={styles.moduleIcon}>{module?.icon}</span>
                        <span className={styles.settingLabel}>{module?.name || setting.description}</span>
                      </div>
                      {module?.description && (
                        <div className={styles.settingDescription}>{module.description}</div>
                      )}
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={setting.value}
                        onChange={(e) => updateSetting(setting.key, e.target.checked)}
                        disabled={saving === setting.key}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                );
              })}
            </div>
          </section>

          {/* General Settings */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
                </svg>
              </span>
              Общие настройки
            </h2>
            <div className={styles.settingsList}>
              {categorizedSettings.general.map((setting) => (
                <div key={setting.key} className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingLabel}>{setting.description}</div>
                  </div>
                  {setting.key === 'site.font' ? (
                    <select
                      value={setting.value}
                      onChange={(e) => updateSetting(setting.key, e.target.value)}
                      disabled={saving === setting.key}
                      className={styles.select}
                    >
                      <option value="Montserrat">Montserrat</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                      <option value="Poppins">Poppins</option>
                      <option value="Inter">Inter</option>
                      <option value="Raleway">Raleway</option>
                      <option value="Nunito">Nunito</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={setting.value}
                      onChange={(e) => updateSetting(setting.key, e.target.value)}
                      disabled={saving === setting.key}
                      className={styles.input}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </span>
              Функции
            </h2>
            <div className={styles.settingsList}>
              {categorizedSettings.features.map((setting) => (
                <div key={setting.key} className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingLabel}>{setting.description}</div>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={setting.value}
                      onChange={(e) => updateSetting(setting.key, e.target.checked)}
                      disabled={saving === setting.key}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Limits */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="4" y1="9" x2="20" y2="9"/>
                  <line x1="4" y1="15" x2="20" y2="15"/>
                  <line x1="10" y1="3" x2="8" y2="21"/>
                  <line x1="16" y1="3" x2="14" y2="21"/>
                </svg>
              </span>
              Лимиты
            </h2>
            <div className={styles.settingsList}>
              {categorizedSettings.limits.map((setting) => (
                <div key={setting.key} className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <div className={styles.settingLabel}>{setting.description}</div>
                  </div>
                  <input
                    type="number"
                    value={setting.value}
                    onChange={(e) => updateSetting(setting.key, parseInt(e.target.value))}
                    disabled={saving === setting.key}
                    className={styles.inputNumber}
                    min="0"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
