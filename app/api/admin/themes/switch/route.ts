/*
 * 🔄 STL Platform - Theme Switch API
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// 🔄 POST /api/admin/themes/switch - переключить активную тему
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

    const body = await request.json();
    const { themeId } = body;

    if (!themeId || typeof themeId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid theme ID' },
        { status: 400 }
      );
    }

    // 🔍 Find the theme
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    // 🔄 Deactivate all themes
    await prisma.theme.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // ✅ Activate selected theme
    await prisma.theme.update({
      where: { id: themeId },
      data: { isActive: true },
    });

    // 💾 Apply theme settings to platform settings
    const themeSettings = JSON.parse(theme.settings);

    const savePromises = Object.entries(themeSettings).map(([key, value]) => {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error switching theme:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
