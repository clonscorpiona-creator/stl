/*
 * 🎯 STL Platform - Header Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import AppearanceDropdown from "./AppearanceDropdown";

export default function Header() {
  return (
    <header>
      <div className="app-container">
        <AppearanceDropdown />
      </div>
    </header>
  );
}
