/*
 * 🖼️ STL Platform - Icon Upload API
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// 📤 POST /api/admin/icons/upload - загрузить иконку
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const iconKey = formData.get('iconKey') as string;

    if (!file || !iconKey) {
      return NextResponse.json(
        { error: 'File and iconKey are required' },
        { status: 400 }
      );
    }

    // 🔍 Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPG, SVG, WebP' },
        { status: 400 }
      );
    }

    // 📏 Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 2MB' },
        { status: 400 }
      );
    }

    // 💾 Save file to public/icons directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name);
    const filename = `${iconKey}-${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'icons');
    const filepath = path.join(uploadDir, filename);

    // 📁 Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true });

    // 💾 Write file
    await writeFile(filepath, buffer);

    const publicPath = `/icons/${filename}`;

    // 💾 Save icon path to database
    await prisma.platformSettings.upsert({
      where: { key: `icon.${iconKey}` },
      create: {
        key: `icon.${iconKey}`,
        value: publicPath,
        type: 'string',
        description: `Icon: ${iconKey}`,
        category: 'icons',
      },
      update: {
        value: publicPath,
      },
    });

    return NextResponse.json({ success: true, path: publicPath });
  } catch (error) {
    console.error('Error uploading icon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
