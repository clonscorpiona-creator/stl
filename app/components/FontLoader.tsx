/*
 * 🔤 STL Platform - Font Loader Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect } from "react";

const AVAILABLE_FONTS = [
  "Montserrat",
  "Roboto",
  "Open Sans",
  "Lato",
  "Poppins",
  "Inter",
  "Raleway",
  "Nunito",
];

export default function FontLoader({ font }: { font: string }) {
  useEffect(() => {
    if (!font || !AVAILABLE_FONTS.includes(font)) {
      return;
    }

    // 📥 Load Google Font dynamically
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(
      / /g,
      "+"
    )}:wght@300;400;500;600;700;800&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // 🎨 Apply font to CSS variable
    document.documentElement.style.setProperty(
      "--font-primary",
      `'${font}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
    );

    return () => {
      document.head.removeChild(link);
    };
  }, [font]);

  return null;
}
