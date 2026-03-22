/*
 * 🎨 STL Platform - Current Theme API
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🎨 Default theme values
const DEFAULT_THEME_VALUES: Record<string, string> = {
  'background': '#F5E6D3',
  'foreground': '#1E1E2E',
  'card-bg': '#2D2D3A',
  'card-light': '#3A3A4A',
  'accent': '#C9A882',
  'accent-light': '#E0C4A0',
  'accent-dark': '#8B7355',
  'text-primary': '#FFFFFF',
  'text-secondary': '#E8E8F0',
  'text-muted': '#B0B0C0',
  'text-link': '#C9A882',
  'text-heading': '#FFFFFF',
  'text-error': '#FF6B6B',
  'text-success': '#51CF66',
  'text-warning': '#FFD43B',
  'card-text-color': '#FFFFFF',
  'header-text-color': '#FFFFFF',
  'sidebar-text-color': '#E8E8F0',
  'footer-text-color': '#E8E8F0',
  'border': 'rgba(255, 255, 255, 0.2)',
  'header-bg': '#2D2D3A',
  'header-opacity': '0.98',
  'header-height': '72px',
  'header-border-radius': '16px',
  'header-padding': '24px',
  'footer-bg': '#2D2D3A',
  'footer-opacity': '1',
  'footer-border-radius': '24px',
  'footer-padding': '24px',
  'card-opacity': '1',
  'sidebar-opacity': '0.95',
  'border-radius-sm': '8px',
  'border-radius-md': '12px',
  'border-radius-lg': '16px',
  'card-border-radius': '16px',
  'button-height': '44px',
  'input-height': '48px',
  'card-padding': '24px',
  'card-width': '100%',
  'card-max-width': '400px',
  'card-min-height': '200px',
  'background-pattern': 'none',
  'background-pattern-opacity': '0.1',
  'background-pattern-size': '20',
};

// 📥 GET /api/theme/current - получить текущие настройки темы (публичный доступ)
export async function GET() {
  try {
    // 🔍 Load theme settings from database
    const themeSettings = await prisma.platformSettings.findMany({
      where: {
        key: {
          startsWith: 'theme.',
        },
      },
    });

    // 🎯 Build settings object with defaults
    const settings: Record<string, string> = { ...DEFAULT_THEME_VALUES };

    themeSettings.forEach((setting) => {
      const key = setting.key.replace('theme.', '');
      settings[key] = setting.value;
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    // 🔄 Return defaults on error
    return NextResponse.json({ settings: DEFAULT_THEME_VALUES });
  }
}
