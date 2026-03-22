/*
 * 🔧 STL Platform - Module Configuration
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

export const MODULES = {
  works: {
    name: 'Работы',
    enabled: true,
    icon: '🎨',
    description: 'Галерея работ пользователей'
  },
  chat: {
    name: 'Чат',
    enabled: true,
    icon: '💬',
    description: 'Каналы и сообщения'
  },
  news: {
    name: 'Новости',
    enabled: true,
    icon: '📰',
    description: 'Новости платформы'
  },
} as const;

export type ModuleName = keyof typeof MODULES;
export type ModuleKey = ModuleName; // Alias for compatibility
