/*
 * 🎨 STL Platform - Theme Switcher Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState } from "react";
import { themes, defaultTheme, type Theme } from "../themes";
import styles from "./ThemeSwitcher.module.css";

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<string>(defaultTheme);
  const [userDefaultTheme, setUserDefaultTheme] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 💾 Загрузить пользовательскую тему по умолчанию
    const savedDefault = localStorage.getItem("defaultTheme");
    if (savedDefault && themes[savedDefault]) {
      setUserDefaultTheme(savedDefault);
    }

    // 🎯 Загрузить текущую тему из localStorage
    const saved = localStorage.getItem("theme");
    if (saved && themes[saved]) {
      setCurrentTheme(saved);
      applyTheme(themes[saved]);
    } else if (savedDefault && themes[savedDefault]) {
      // 👤 Использовать пользовательскую тему по умолчанию
      setCurrentTheme(savedDefault);
      applyTheme(themes[savedDefault]);
    } else {
      // 🖥️ Использовать системную тему по умолчанию
      setCurrentTheme(defaultTheme);
      applyTheme(themes[defaultTheme]);
    }
  }, []);

  function applyTheme(theme: Theme) {
    const root = document.documentElement;

    // 🎨 Применить все переменные темы к корневому элементу
    root.style.setProperty("--background", theme.colors.background);
    root.style.setProperty("--foreground", theme.colors.foreground);
    root.style.setProperty("--text-primary", theme.colors.textPrimary);
    root.style.setProperty("--text-secondary", theme.colors.textSecondary);
    root.style.setProperty("--accent", theme.colors.accent);
    root.style.setProperty("--accent-light", theme.colors.accentLight);
    root.style.setProperty("--accent-dark", theme.colors.accentDark);
    root.style.setProperty("--border", theme.colors.border);

    // 🌈 Применить градиент к body
    document.body.style.background = theme.colors.gradient;
  }

  function switchTheme(themeName: string) {
    const theme = themes[themeName];
    if (theme) {
      setCurrentTheme(themeName);
      applyTheme(theme);
      localStorage.setItem("theme", themeName);
      setIsOpen(false);
    }
  }

  function setAsDefault(themeName: string, event: React.MouseEvent) {
    event.stopPropagation();
    localStorage.setItem("defaultTheme", themeName);
    setUserDefaultTheme(themeName);
  }

  return (
    <div className={styles.themeSwitcher}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Переключить тему"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2C6.5 2 2 6.5 2 12C2 13.8 2.5 15.5 3.4 16.9C4 17.8 5.2 18 6.2 17.5C7.3 17 8.5 17.9 8.5 19.1V19.5C8.5 20.9 9.6 22 11 22C16.5 22 21 17.5 21 12C21 6.5 16.5 2 12 2Z"/>
          <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
        </svg>
        Тема
      </button>

      {isOpen && (
        <div className={styles.themeMenu}>
          <div className={styles.themeMenuHeader}>Выберите тему</div>
          {Object.values(themes).map((theme) => (
            <button
              key={theme.name}
              className={`${styles.themeOption} ${
                currentTheme === theme.name ? styles.active : ""
              }`}
              onClick={() => switchTheme(theme.name)}
            >
              <span
                className={styles.colorPreview}
                style={{ backgroundColor: theme.colors.accent }}
              />
              <span className={styles.themeName}>{theme.displayName}</span>
              {currentTheme === theme.name && (
                <svg className={styles.checkmark} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 6L9 17L4 12"/>
                </svg>
              )}
              <button
                className={`${styles.defaultButton} ${
                  userDefaultTheme === theme.name ? styles.isDefault : ""
                }`}
                onClick={(e) => setAsDefault(theme.name, e)}
                title={
                  userDefaultTheme === theme.name
                    ? "Тема по умолчанию"
                    : "Установить по умолчанию"
                }
              >
                {userDefaultTheme === theme.name ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                )}
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
