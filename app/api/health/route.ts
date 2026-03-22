import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 🔍 Check if DATABASE_URL is set
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const dbUrlPreview = process.env.DATABASE_URL
      ? process.env.DATABASE_URL.substring(0, 30) + '...'
      : 'not set';

    if (!hasDatabaseUrl) {
      return NextResponse.json({
        status: 'error',
        database: 'not configured',
        initialized: false,
        error: 'DATABASE_URL environment variable is not set',
        hint: 'Add DATABASE_URL in Render dashboard Settings → Environment',
        databaseUrl: dbUrlPreview
      }, { status: 500 });
    }

    // 🔌 Test raw connection first
    await prisma.$connect();

    // 📊 Try to count users to check if DB is initialized
    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      initialized: true,
      userCount,
      databaseUrl: dbUrlPreview,
      prismaVersion: '6.10.0'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      database: 'connection failed',
      initialized: false,
      error: error.message,
      errorCode: error.code,
      errorName: error.name,
      hint: error.code === 'P2021'
        ? 'Database tables not created. Use /diagnostic.html to initialize'
        : 'Check DATABASE_URL is correct and database is accessible',
      databaseUrl: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.substring(0, 30) + '...'
        : 'not set'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
