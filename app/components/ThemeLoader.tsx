/*
 * 🎨 STL Platform - Theme Loader Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect } from "react";

// 🎨 Convert hex color to RGB values
function hexToRgb(hex: string): string | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  // Parse hex to RGB
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `${r}, ${g}, ${b}`;
}

export default function ThemeLoader() {
  useEffect(() => {
    // 🎨 Load and apply custom theme settings
    async function loadTheme() {
      try {
        const res = await fetch('/api/theme/current');
        const data = await res.json();

        if (res.ok && data.settings) {
          const root = document.documentElement;

          // 🔄 Apply each theme setting to CSS variables
          Object.entries(data.settings).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, String(value));

            // 🎨 For color properties, also set RGB version
            const colorProperties = [
              'background',
              'foreground',
              'card-bg',
              'card-light',
              'accent',
              'accent-light',
              'accent-dark',
              'header-bg',
              'footer-bg'
            ];

            if (colorProperties.includes(key)) {
              const rgb = hexToRgb(String(value));
              if (rgb) {
                root.style.setProperty(`--${key}-rgb`, rgb);
              }
            }
          });
        }
      } catch (error) {
        console.error('Failed to load theme settings:', error);
      }
    }

    loadTheme();
  }, []);

  return null;
}
