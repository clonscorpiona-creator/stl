/*
 * ⚙️ STL Platform - Settings Management
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

import { prisma } from "@/lib/prisma";

type SettingKey =
  | 'site.font'
  | 'ui.header_opacity'
  | 'ui.card_opacity'
  | 'ui.sidebar_opacity';

export const DEFAULT_SETTINGS: Record<SettingKey, any> = {
  'site.font': {
    value: 'Montserrat',
    type: 'string',
    description: 'Default font family',
    category: 'appearance',
  },
  'ui.header_opacity': {
    value: 0.98,
    type: 'number',
    description: 'Header opacity',
    category: 'ui',
  },
  'ui.card_opacity': {
    value: 1.0,
    type: 'number',
    description: 'Card opacity',
    category: 'ui',
  },
  'ui.sidebar_opacity': {
    value: 0.95,
    type: 'number',
    description: 'Sidebar opacity',
    category: 'ui',
  },
};

/**
 * Get a platform setting value
 */
export function getSetting(key: SettingKey): string | number | null {
  return DEFAULT_SETTINGS[key]?.value ?? null;
}

/**
 * Get all platform settings
 */
export async function getAllSettings(): Promise<Record<string, any>> {
  try {
    const settings = await prisma.platformSettings.findMany();
    const result: Record<string, any> = {};

    for (const key in DEFAULT_SETTINGS) {
      const dbSetting = settings.find(s => s.key === key);
      result[key] = dbSetting?.value ?? DEFAULT_SETTINGS[key].value;
    }

    return result;
  } catch (error) {
    // Return defaults if database query fails
    const result: Record<string, any> = {};
    for (const key in DEFAULT_SETTINGS) {
      result[key] = DEFAULT_SETTINGS[key].value;
    }
    return result;
  }
}

/**
 * Set a platform setting value
 */
export async function setSetting(key: string, value: any): Promise<void> {
  await prisma.platformSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
