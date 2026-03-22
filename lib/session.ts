/*
 * 🔐 STL Platform - Session Management
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

import { getIronSession, IronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export interface SessionData {
  userId?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'stl_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

/**
 * Get the current session (for Server Components)
 */
export async function getSession(): Promise<IronSession<SessionData>>;
/**
 * Get the current session (for API Routes)
 */
export async function getSession(
  req: NextRequest,
  res: NextResponse
): Promise<IronSession<SessionData>>;
/**
 * Implementation
 */
export async function getSession(
  req?: NextRequest,
  res?: NextResponse
): Promise<IronSession<SessionData>> {
  if (req && res) {
    // API Route usage
    return getIronSession<SessionData>(req, res, sessionOptions);
  } else {
    // Server Component usage
    return getIronSession<SessionData>(await cookies(), sessionOptions);
  }
}

/**
 * Destroy the current session
 */
export async function destroySession(req: NextRequest): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true, message: 'Logged out' });
  const session = await getSession(req, res);
  session.destroy();
  return res;
}

/**
 * Require that SESSION_SECRET is set (for password-based auth)
 */
export function requireSessionPassword(): void {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'change-this-to-a-random-secret-key-in-production') {
    console.warn('⚠️  SESSION_SECRET not set or using default value. Please set a secure secret in production.');
  }
}
