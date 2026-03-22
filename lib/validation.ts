/*
 * ✅ STL Platform - Validation Utilities
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email обязателен' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Неверный формат email' };
  }

  return { valid: true };
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) {
    return { valid: false, error: 'Username обязателен' };
  }

  if (username.length < 3) {
    return { valid: false, error: 'Username должен содержать минимум 3 символа' };
  }

  if (username.length > 20) {
    return { valid: false, error: 'Username не должен превышать 20 символов' };
  }

  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, error: 'Username может содержать только буквы, цифры, дефис и подчеркивание' };
  }

  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Пароль обязателен' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Пароль должен содержать минимум 8 символов' };
  }

  return { valid: true };
}
