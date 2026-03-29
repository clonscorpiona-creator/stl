/*
 * 🎨 STL Platform - Appearance Dropdown Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-30
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useState, useEffect } from "react";
import { themes, defaultTheme, type Theme } from "../themes";
import styles from "./AppearanceDropdown.module.css";

interface IconSet {
  slug: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const iconSets: IconSet[] = [
  {
    slug: "default",
    name: "Cyberpunk",
    description: "Яркие неоновые иконки",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    ),
  },
  {
    slug: "business",
    name: "Business",
    description: "Строгие деловые иконки",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/>
        <path d="M7 15l3-3 2 2 4-4v6H7z"/>
      </svg>
    ),
  },
  {
    slug: "minimal",
    name: "Minimal",
    description: "Простые минималистичные",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
  },
];

export default function AppearanceDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIconSet, setCurrentIconSet] = useState<string>("default");
  const [currentTheme, setCurrentTheme] = useState<string>(defaultTheme);

  useEffect(() => {
    // Load saved icon set from localStorage
    const savedIconSet = localStorage.getItem("iconSet");
    if (savedIconSet) {
      setCurrentIconSet(savedIconSet);
    }

    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleIconSetChange = (slug: string) => {
    setCurrentIconSet(slug);
    localStorage.setItem("iconSet", slug);

    // Call Django API to update session
    fetch(`/icon-set/${slug}/`, {
      method: "GET",
      credentials: "same-origin",
    })
      .then(() => {
        window.location.reload();
      })
      .catch((error) => {
        console.error("[Icon Set Switch] Error:", error);
      });

    setIsOpen(false);
  };

  const handleThemeChange = (themeName: string) => {
    const theme = themes[themeName];
    if (!theme) return;

    setCurrentTheme(themeName);
    localStorage.setItem("theme", themeName);

    // Apply theme visually
    applyTheme(theme);

    // Send to Django API to save in session
    fetch("/api/theme/switch/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({ theme: themeName }),
    })
      .catch((error) => {
        console.error("[Theme Switch] Error:", error);
      });

    setIsOpen(false);
  };

  function applyTheme(theme: Theme) {
    const root = document.documentElement;

    root.style.setProperty("--background", theme.colors.background);
    root.style.setProperty("--foreground", theme.colors.foreground);
    root.style.setProperty("--text-primary", theme.colors.textPrimary);
    root.style.setProperty("--text-secondary", theme.colors.textSecondary);
    root.style.setProperty("--accent", theme.colors.accent);
    root.style.setProperty("--accent-light", theme.colors.accentLight);
    root.style.setProperty("--accent-dark", theme.colors.accentDark);
    root.style.setProperty("--border", theme.colors.border);
    document.body.style.background = theme.colors.gradient;
  }

  function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;

    let cookieValue = null;
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
    return cookieValue;
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest(`.${styles.appearanceDropdown}`)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={styles.appearanceDropdown}>
      <button
        className={styles.appearanceTrigger}
        onClick={toggleMenu}
        aria-label="Внешний вид"
        aria-expanded={isOpen}
      >
        <svg
          className={styles.appearanceTriggerIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
        <span>Внешний вид</span>
      </button>

      {isOpen && (
        <div className={`${styles.appearanceMenu} ${styles.open}`}>
          <div className={styles.appearanceMenuHeader}>
            <h4 className={styles.appearanceMenuTitle}>Настройки внешнего вида</h4>
            <button
              className={styles.appearanceMenuClose}
              onClick={toggleMenu}
              aria-label="Закрыть"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className={styles.appearanceMenuContent}>
            {/* Icon Sets Section */}
            <div className={styles.appearanceSection}>
              <h5 className={styles.appearanceSectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
                Наборы иконок
              </h5>
              {iconSets.map((iconSet) => (
                <button
                  key={iconSet.slug}
                  className={`${styles.appearanceOption} ${
                    currentIconSet === iconSet.slug ? styles.active : ""
                  }`}
                  onClick={() => handleIconSetChange(iconSet.slug)}
                >
                  <div className={styles.appearanceOptionIcon}>
                    {iconSet.icon}
                  </div>
                  <div className={styles.appearanceOptionContent}>
                    <p className={styles.appearanceOptionName}>{iconSet.name}</p>
                    <p className={styles.appearanceOptionDesc}>{iconSet.description}</p>
                  </div>
                  {currentIconSet === iconSet.slug && (
                    <svg
                      className={styles.appearanceOptionCheck}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M20 6L9 17L4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Color Themes Section */}
            <div className={styles.appearanceSection}>
              <h5 className={styles.appearanceSectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a10 10 0 0110 10"/>
                  <path d="M12 22a10 10 0 0010-10"/>
                </svg>
                Цветовые темы
              </h5>
              {Object.values(themes).map((theme) => (
                <button
                  key={theme.name}
                  className={`${styles.appearanceOption} ${
                    currentTheme === theme.name ? styles.active : ""
                  }`}
                  onClick={() => handleThemeChange(theme.name)}
                >
                  <div className={styles.themeSwatch}>
                    <div
                      className={styles.themeSwatchColor}
                      style={{ background: theme.colors.background }}
                    />
                    <div
                      className={styles.themeSwatchColor}
                      style={{ background: theme.colors.accent }}
                    />
                  </div>
                  <div className={styles.appearanceOptionContent}>
                    <p className={styles.appearanceOptionName}>{theme.displayName}</p>
                    <p className={styles.appearanceOptionDesc}>
                      {theme.name === "olive-sage" && "Природные зелёные оттенки"}
                      {theme.name === "coffee" && "Тёплые кофейные оттенки"}
                      {theme.name === "monochrome" && "Классический ч/б стиль"}
                    </p>
                  </div>
                  {currentTheme === theme.name && (
                    <svg
                      className={styles.appearanceOptionCheck}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M20 6L9 17L4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.appearanceFooter}>
            <a href="/admin/theme/" className={styles.appearanceFooterLink}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
              Полные настройки
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
