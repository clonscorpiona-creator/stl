/*
 * ⚙️ STL Platform - Settings Management
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

type SettingKey =
  | 'site.font'
  | 'ui.header_opacity'
  | 'ui.card_opacity'
  | 'ui.sidebar_opacity';

const DEFAULT_SETTINGS: Record<SettingKey, string | number> = {
  'site.font': 'Montserrat',
  'ui.header_opacity': 0.98,
  'ui.card_opacity': 1.0,
  'ui.sidebar_opacity': 0.95,
};

/**
 * Get a platform setting value
 */
export function getSetting(key: SettingKey): string | number | null {
  return DEFAULT_SETTINGS[key] ?? null;
}
