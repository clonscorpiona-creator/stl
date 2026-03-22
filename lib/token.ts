/*
 * 🔐 STL Platform - Token Utilities
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

import crypto from 'crypto';

/**
 * Generate a random token
 */
export function generateToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash a string using SHA256
 */
export function sha256Hex(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Timing-safe comparison of two hex strings
 */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  const bufferA = Buffer.from(a, 'hex');
  const bufferB = Buffer.from(b, 'hex');

  if (bufferA.length !== bufferB.length) return false;

  return crypto.timingSafeEqual(bufferA, bufferB);
}
