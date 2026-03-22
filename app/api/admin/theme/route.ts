/*
 * 🎨 STL Platform - Theme Customization API
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
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

  // Admin panel text colors
  'admin-heading-color': '#FFFFFF',
  'admin-description-color': '#E8E8F0',
  'admin-label-color': '#E8E8F0',
  'admin-sidebar-title-color': '#FFFFFF',
  'admin-sidebar-link-color': '#E8E8F0',

  // Main page sidebar
  'main-sidebar-bg': '#2D2D3A',
  'main-sidebar-text-color': '#E8E8F0',
  'main-sidebar-title-color': '#FFFFFF',
  'main-sidebar-link-color': '#E8E8F0',
  'main-sidebar-opacity': '0.95',
  'main-sidebar-width': '280px',
  'main-sidebar-enabled': '1',

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

// 📥 GET /api/admin/theme - получить настройки темы
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 🔍 Load theme settings from database (exclude history)
    const themeSettings = await prisma.platformSettings.findMany({
      where: {
        key: {
          startsWith: 'theme.',
        },
        NOT: {
          key: {
            startsWith: 'theme.history.',
          },
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 💾 POST /api/admin/theme - сохранить настройки темы
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 📊 Log request size for debugging
    const contentLength = request.headers.get('content-length');
    console.log('POST /api/admin/theme - Content-Length:', contentLength);

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }

    // 📊 Log settings size for debugging
    const settingsCount = Object.keys(settings).length;
    const settingsSize = JSON.stringify(settings).length;
    console.log(`Received ${settingsCount} settings, total size: ${(settingsSize/1024).toFixed(2)} KB`);

    // 🔒 Filter out history entries from settings to prevent exponential growth
    const filteredSettings: Record<string, string> = {};
    Object.entries(settings).forEach(([key, value]) => {
      if (!key.startsWith('history.')) {
        filteredSettings[key] = String(value);
      }
    });

    console.log(`After filtering: ${Object.keys(filteredSettings).length} settings`);

    // 💾 Save each setting to database
    const savePromises = Object.entries(filteredSettings).map(([key, value]) => {
      return prisma.platformSettings.upsert({
        where: { key: `theme.${key}` },
        create: {
          key: `theme.${key}`,
          value: String(value),
          type: 'string',
          description: `Theme setting: ${key}`,
          category: 'theme',
        },
        update: {
          value: String(value),
        },
      });
    });

    await Promise.all(savePromises);

    // 🗂️ Manage history: keep only last 3 entries
    // Get all existing history entries
    const historyEntries = await prisma.platformSettings.findMany({
      where: {
        key: { startsWith: 'theme.history.' }
      },
      orderBy: {
        key: 'asc' // Keys contain timestamps, so this sorts by time
      }
    });

    // If we have 3 or more entries, delete the oldest ones to keep only 2
    if (historyEntries.length >= 3) {
      const entriesToDelete = historyEntries.slice(0, historyEntries.length - 2);
      const deletePromises = entriesToDelete.map(entry =>
        prisma.platformSettings.delete({
          where: { key: entry.key }
        })
      );
      await Promise.all(deletePromises);
      console.log(`Deleted ${entriesToDelete.length} old history entries`);
    }

    // 💾 Save current state to history (will be the 3rd entry at most)
    const timestamp = Date.now();
    await prisma.platformSettings.create({
      data: {
        key: `theme.history.${timestamp}`,
        value: JSON.stringify(filteredSettings),
        type: 'json',
        description: 'Theme history snapshot',
        category: 'theme',
      }
    });

    console.log(`History saved. Total entries: ${Math.min(historyEntries.length + 1, 3)}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving theme settings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
