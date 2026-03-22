/*
 * 🎨 STL Platform - Icons API
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// 📥 GET /api/admin/icons - получить иконки
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

    // 🔍 Load icons
    const iconsSettings = await prisma.platformSettings.findUnique({
      where: { key: 'icons.current' },
    });

    if (iconsSettings) {
      try {
        const icons = JSON.parse(iconsSettings.value);
        return NextResponse.json({ icons });
      } catch {
        return NextResponse.json({ icons: null });
      }
    }

    return NextResponse.json({ icons: null });
  } catch (error) {
    console.error('Error fetching icons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 💾 POST /api/admin/icons - сохранить иконки
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
    const { icons } = body;

    if (!icons) {
      return NextResponse.json(
        { error: 'Icons are required' },
        { status: 400 }
      );
    }

    // 📜 Save current version to history before updating
    const currentSettings = await prisma.platformSettings.findUnique({
      where: { key: 'icons.current' },
    });

    if (currentSettings) {
      await prisma.platformSettings.create({
        data: {
          key: `icons.history.${Date.now()}`,
          value: currentSettings.value,
          type: 'json',
          description: 'Icon history snapshot',
          category: 'icons',
        },
      });
    }

    // 💾 Save new icons
    await prisma.platformSettings.upsert({
      where: { key: 'icons.current' },
      create: {
        key: 'icons.current',
        value: JSON.stringify(icons),
        type: 'json',
        description: 'Current platform icons',
        category: 'icons',
      },
      update: {
        value: JSON.stringify(icons),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving icons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
