/*
 * 🕐 STL Platform - Theme History API
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// 📥 GET /api/admin/theme/history - получить историю изменений темы
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

    // 🔍 Load theme history from database
    const history = await prisma.platformSettings.findMany({
      where: {
        key: {
          startsWith: 'theme.history.',
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10, // 📊 Last 10 versions
    });

    const versions = history.map((record) => {
      try {
        return {
          id: record.key.replace('theme.history.', ''),
          timestamp: record.updatedAt,
          settings: JSON.parse(record.value),
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching theme history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 🔄 POST /api/admin/theme/history/restore - восстановить версию темы
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

    // 🔍 Load version from history
    const historyRecord = await prisma.platformSettings.findUnique({
      where: { key: `theme.history.${versionId}` },
    });

    if (!historyRecord) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    let settings: Record<string, string>;
    try {
      settings = JSON.parse(historyRecord.value);
    } catch {
      return NextResponse.json(
        { error: 'Invalid version data' },
        { status: 400 }
      );
    }

    // 💾 Restore settings
    const savePromises = Object.entries(settings).map(([key, value]) => {
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

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error restoring theme version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
