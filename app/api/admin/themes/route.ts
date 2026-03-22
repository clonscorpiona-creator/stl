/*
 * 🎨 STL Platform - Themes Management API
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// 📥 GET /api/admin/themes - получить список тем
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

    // 🔍 Load all themes
    const themes = await prisma.theme.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      themes: themes.map(theme => ({
        id: theme.id,
        name: theme.name,
        isActive: theme.isActive,
      }))
    });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 💾 POST /api/admin/themes - создать новую тему
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
    const { name, settings } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid theme name' },
        { status: 400 }
      );
    }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }

    // 💾 Create new theme
    const theme = await prisma.theme.create({
      data: {
        name,
        settings: JSON.stringify(settings),
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      theme: {
        id: theme.id,
        name: theme.name,
        isActive: theme.isActive,
      }
    });
  } catch (error) {
    console.error('Error creating theme:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
