import { prisma } from "@/lib/prisma";
import { generateToken, sha256Hex, safeEqualHex } from "./token";

/**
 * Generate a password reset token for a user
 * Token expires in 1 hour
 */
export async function generatePasswordResetToken(userId: string) {
  const token = generateToken(32);
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return token;
}

/**
 * Validate a password reset token
 * Returns userId if valid, null otherwise
 */
export async function validatePasswordResetToken(token: string): Promise<string | null> {
  const tokenHash = sha256Hex(token);

  const storedToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!storedToken) {
    return null;
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({
      where: { id: storedToken.id },
    });
    return null;
  }

  // Timing-safe comparison
  if (!safeEqualHex(tokenHash, storedToken.tokenHash)) {
    return null;
  }

  return storedToken.userId;
}

/**
 * Delete a password reset token after use
 */
export async function deletePasswordResetToken(token: string) {
  const tokenHash = sha256Hex(token);

  await prisma.passwordResetToken.deleteMany({
    where: { tokenHash },
  });
}

/**
 * Delete all password reset tokens for a user
 */
export async function deleteAllPasswordResetTokens(userId: string) {
  await prisma.passwordResetToken.deleteMany({
    where: { userId },
  });
}
