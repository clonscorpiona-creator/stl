/*
 * 📜 STL Platform - Icons History API
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// 📥 GET /api/admin/icons/history - получить историю
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

    // 🔍 Load history (last 10 versions)
    const historySettings = await prisma.platformSettings.findMany({
      where: {
        key: {
          startsWith: 'icons.history.',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    const history = historySettings.map((setting) => {
      try {
        return {
          id: setting.key,
          timestamp: setting.createdAt.toISOString(),
          icons: JSON.parse(setting.value),
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ↺ POST /api/admin/icons/history - восстановить версию
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
    const { versionId } = body;

    if (!versionId) {
      return NextResponse.json(
        { error: 'Version ID is required' },
        { status: 400 }
      );
    }

    // 🔍 Find the version to restore
    const versionSettings = await prisma.platformSettings.findUnique({
      where: { key: versionId },
    });

    if (!versionSettings) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // 📜 Save current version to history before restoring
    const currentSettings = await prisma.platformSettings.findUnique({
      where: { key: 'icons.current' },
    });

    if (currentSettings) {
      await prisma.platformSettings.create({
        data: {
          key: `icons.history.${Date.now()}`,
          value: currentSettings.value,
          type: 'json',
          description: 'Icon history snapshot (before restore)',
          category: 'icons',
        },
      });
    }

    // ↺ Restore the version
    await prisma.platformSettings.upsert({
      where: { key: 'icons.current' },
      create: {
        key: 'icons.current',
        value: versionSettings.value,
        type: 'json',
        description: 'Current platform icons',
        category: 'icons',
      },
      update: {
        value: versionSettings.value,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error restoring version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
