/*
 * 🗄️ STL Platform - Prisma Client
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
