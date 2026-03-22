/*
 * 🔧 STL Platform - Module Configuration
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

export const MODULES = {
  works: { name: 'Работы', enabled: true },
  chat: { name: 'Чат', enabled: true },
  news: { name: 'Новости', enabled: true },
} as const;

export type ModuleName = keyof typeof MODULES;
