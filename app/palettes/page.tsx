/*
 * 🎨 STL Platform - Color Palette Generator
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-20
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Palette = {
  id: string;
  name: string;
  colors: string;
  isPublic: boolean;
  createdAt: string;
};

export default function PalettesPage() {
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState<string[]>(["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#33FFF3"]);
  const [paletteName, setPaletteName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
    loadPalettes();
  }, []);

  async function checkAuth() {
    // 👤 Check if user is logged in
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setIsLoggedIn(!!data.user);
    } catch (err) {
      setIsLoggedIn(false);
    }
  }

  async function loadPalettes() {
    // 📥 Load user's saved palettes
    try {
      const res = await fetch("/api/palettes");
      const data = await res.json();
      if (res.ok) {
        setPalettes(data.palettes);
      }
    } catch (err) {
      console.error("Failed to load palettes:", err);
    } finally {
      setLoading(false);
    }
  }

  function generateRandomColor(): string {
    // 🎲 Generate random hex color
    return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
  }

  function generateComplementary(baseColor: string): string[] {
    // 🔄 Generate complementary color (opposite on color wheel)
    const hex = baseColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const compR = (255 - r).toString(16).padStart(2, "0");
    const compG = (255 - g).toString(16).padStart(2, "0");
    const compB = (255 - b).toString(16).padStart(2, "0");

    return [baseColor, `#${compR}${compG}${compB}`];
  }

  function generateAnalogous(baseColor: string): string[] {
    const hex = baseColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const result = [baseColor];

    // 🎨 Shift hue by ±30 degrees
    for (let shift of [-30, 30]) {
      const newR = Math.min(255, Math.max(0, r + shift));
      const newG = Math.min(255, Math.max(0, g + shift / 2));
      const newB = Math.min(255, Math.max(0, b - shift / 2));

      result.push(
        "#" +
          newR.toString(16).padStart(2, "0") +
          newG.toString(16).padStart(2, "0") +
          newB.toString(16).padStart(2, "0")
      );
    }

    return result;
  }

  function generateMonochromatic(baseColor: string): string[] {
    // 🎨 Generate monochromatic shades (same hue, different brightness)
    const hex = baseColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const result = [];
    for (let i = 0; i < 5; i++) {
      const factor = 0.3 + (i * 0.175);
      const newR = Math.min(255, Math.floor(r * factor)).toString(16).padStart(2, "0");
      const newG = Math.min(255, Math.floor(g * factor)).toString(16).padStart(2, "0");
      const newB = Math.min(255, Math.floor(b * factor)).toString(16).padStart(2, "0");
      result.push(`#${newR}${newG}${newB}`);
    }

    return result;
  }

  function generateTriadic(baseColor: string): string[] {
    // 🔺 Generate triadic colors (120° apart on color wheel)
    const hex = baseColor.replace("#", "");
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);

    return [
      baseColor,
      `#${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${r.toString(16).padStart(2, "0")}`,
      `#${b.toString(16).padStart(2, "0")}${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}`,
    ];
  }

  function updateColor(index: number, value: string) {
    // ✏️ Update color at specific index
    const newColors = [...colors];
    newColors[index] = value;
    setColors(newColors);
  }

  function addColor() {
    // ➕ Add new random color to palette
    if (colors.length < 10) {
      setColors([...colors, generateRandomColor()]);
    }
  }

  function removeColor(index: number) {
    // ➖ Remove color from palette
    if (colors.length > 1) {
      setColors(colors.filter((_, i) => i !== index));
    }
  }

  async function savePalette() {
    if (!paletteName.trim()) {
      alert("Введите название палитры");
      return;
    }

    // 💾 Save palette to database
    setSaving(true);
    try {
      const res = await fetch("/api/palettes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: paletteName,
          colors,
          isPublic,
        }),
      });

      if (res.ok) {
        setPaletteName("");
        setIsPublic(false);
        loadPalettes();
        alert("Палитра сохранена!");
      } else {
        const data = await res.json();
        alert(data.error || "Ошибка сохранения");
      }
    } catch (err) {
      alert("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  async function deletePalette(id: string) {
    if (!confirm("Удалить эту палитру?")) return;

    // 🗑️ Delete palette from database
    try {
      const res = await fetch(`/api/palettes/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        loadPalettes();
      }
    } catch (err) {
      alert("Ошибка удаления");
    }
  }

  function loadPaletteColors(paletteColors: string) {
    // 📥 Load saved palette colors
    try {
      const parsed = JSON.parse(paletteColors);
      setColors(parsed);
    } catch (err) {
      console.error("Failed to parse colors:", err);
    }
  }

  function copyToClipboard(text: string) {
    // 📋 Copy color code to clipboard
    navigator.clipboard.writeText(text);
    alert("Скопировано!");
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>
            ← Главная
          </Link>
          <h1 className={styles.title}>Генератор палитр</h1>
          <p className={styles.subtitle}>Создавайте и сохраняйте цветовые палитры</p>
        </header>

        <div className={styles.generator}>
          <div className={styles.colorGrid}>
            {colors.map((color, index) => (
              <div key={index} className={styles.colorItem}>
                <div
                  className={styles.colorPreview}
                  style={{ backgroundColor: color }}
                  onClick={() => copyToClipboard(color)}
                  title="Нажмите, чтобы скопировать"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => updateColor(index, e.target.value)}
                  className={styles.colorInput}
                  maxLength={7}
                />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => updateColor(index, e.target.value)}
                  className={styles.colorPicker}
                />
                {colors.length > 1 && (
                  <button
                    onClick={() => removeColor(index)}
                    className={styles.removeButton}
                    title="Удалить цвет"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {colors.length < 10 && (
            <button onClick={addColor} className={styles.addButton}>
              + Добавить цвет
            </button>
          )}

          <div className={styles.actions}>
            <button onClick={() => setColors(colors.map(() => generateRandomColor()))} className={styles.actionButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
                <path d="M12 8V12L15 15"/>
              </svg>
              Случайные цвета
            </button>
            <button onClick={() => setColors(generateComplementary(colors[0]))} className={styles.actionButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 3V12L19 19"/>
              </svg>
              Комплементарные
            </button>
            <button onClick={() => setColors(generateAnalogous(colors[0]))} className={styles.actionButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                <circle cx="12" cy="12" r="9"/>
                <path d="M8 12H16M12 8V16"/>
              </svg>
              Аналогичные
            </button>
            <button onClick={() => setColors(generateMonochromatic(colors[0]))} className={styles.actionButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                <path d="M12 2C6.5 2 2 6.5 2 12C2 13.8 2.5 15.5 3.4 16.9C4 17.8 5.2 18 6.2 17.5C7.3 17 8.5 17.9 8.5 19.1V19.5C8.5 20.9 9.6 22 11 22C16.5 22 21 17.5 21 12C21 6.5 16.5 2 12 2Z"/>
                <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="11" r="1.5" fill="currentColor"/>
                <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
                <circle cx="14" cy="18" r="1.5" fill="currentColor"/>
                <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
                <circle cx="7" cy="15" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="11" r="1.5" fill="currentColor"/>
              </svg>
              Монохромные
            </button>
            <button onClick={() => setColors(generateTriadic(colors[0]))} className={styles.actionButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                <path d="M12 2l10 18H2z"/>
              </svg>
              Триадные
            </button>
          </div>

          {isLoggedIn && (
            <div className={styles.saveSection}>
              <input
                type="text"
                placeholder="Название палитры"
                value={paletteName}
                onChange={(e) => setPaletteName(e.target.value)}
                className={styles.nameInput}
              />
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                Публичная палитра
              </label>
              <button onClick={savePalette} disabled={saving} className={styles.saveButton}>
                {saving ? "Сохранение..." : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <path d="M17 21v-8H7v8"/>
                      <path d="M7 3v5h8"/>
                    </svg>
                    Сохранить палитру
                  </>
                )}
              </button>
            </div>
          )}

          {!isLoggedIn && (
            <p className={styles.loginPrompt}>
              <Link href="/auth/login">Войдите</Link>, чтобы сохранять палитры
            </p>
          )}
        </div>

        {isLoggedIn && (
          <section className={styles.savedSection}>
            <h2 className={styles.sectionTitle}>Мои палитры</h2>
            {loading && <p>Загрузка...</p>}
            {!loading && palettes.length === 0 && (
              <p className={styles.empty}>У вас пока нет сохранённых палитр</p>
            )}
            {!loading && palettes.length > 0 && (
              <div className={styles.paletteList}>
                {palettes.map((palette) => {
                  const paletteColors = JSON.parse(palette.colors);
                  return (
                    <div key={palette.id} className={styles.paletteCard}>
                      <div className={styles.paletteColors}>
                        {paletteColors.map((color: string, i: number) => (
                          <div
                            key={i}
                            className={styles.paletteColor}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className={styles.paletteInfo}>
                        <strong>{palette.name}</strong>
                        {palette.isPublic && <span className={styles.publicBadge}>Публичная</span>}
                      </div>
                      <div className={styles.paletteActions}>
                        <button
                          onClick={() => loadPaletteColors(palette.colors)}
                          className={styles.loadButton}
                        >
                          Загрузить
                        </button>
                        <button
                          onClick={() => deletePalette(palette.id)}
                          className={styles.deleteButton}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
