import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // 🔒 Simple password protection
    if (password !== 'init-stl-db-2026') {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // 🔍 Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable not found'
      }, { status: 500 });
    }

    // 🚀 Run prisma db push with environment variables
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss', {
      env: { ...process.env }
    });

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      output: stdout,
      errors: stderr
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      output: error.stdout,
      errors: error.stderr
    }, { status: 500 });
  }
}
