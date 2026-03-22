/*
 * 🎨 STL Platform - Opacity Loader Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect } from "react";

export default function OpacityLoader({
  headerOpacity,
  cardOpacity,
  sidebarOpacity,
}: {
  headerOpacity: number;
  cardOpacity: number;
  sidebarOpacity: number;
}) {
  useEffect(() => {
    // 🎨 Apply opacity values to CSS variables
    const root = document.documentElement;
    root.style.setProperty("--header-opacity", String(headerOpacity));
    root.style.setProperty("--card-opacity", String(cardOpacity));
    root.style.setProperty("--sidebar-opacity", String(sidebarOpacity));
  }, [headerOpacity, cardOpacity, sidebarOpacity]);

  return null;
}
