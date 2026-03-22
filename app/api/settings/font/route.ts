/*
 * 🎨 STL Platform - Font Settings API
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 */

import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

export async function GET() {
  try {
    const font = getSetting('site.font');
    return NextResponse.json({ font: font || 'Montserrat' });
  } catch (error) {
    console.error('Error fetching font setting:', error);
    return NextResponse.json({ font: 'Montserrat' });
  }
}
