/*
 * 🎯 STL Platform - Hero Buttons Component
 * Показывает кнопки входа/регистрации или приветствие для авторизованных пользователей
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type User = {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
};

type HeroButtonsProps = {
  styles: any;
};

export default function HeroButtons({ styles }: HeroButtonsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.heroButtons}>
        <div style={{ opacity: 0.5 }}>Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.heroButtons}>
        <Link href="/artists" className={styles.heroButton}>
          Познакомиться
        </Link>
        <Link href="/auth/register" className={styles.heroButtonSecondary}>
          Войти
        </Link>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Администратор';
      case 'MODERATOR':
        return 'Модератор';
      case 'ARTIST':
        return 'Художник';
      default:
        return 'Участник';
    }
  };

  const isAdminOrModerator = user.role === 'ADMIN' || user.role === 'MODERATOR';

  return (
    <div className={styles.heroButtons}>
      <div className={styles.userGreeting}>
        <div className={styles.greetingText}>
          Привет, <strong>{user.displayName || user.username}</strong>!
        </div>
        <div className={styles.userRole}>
          {getRoleLabel(user.role)}
        </div>
      </div>
      <Link href="/profile" className={styles.heroButton}>
        Мой профиль
      </Link>
      <Link href="/chat" className={styles.heroButtonSecondary}>
        Чат
      </Link>
      {isAdminOrModerator && (
        <Link href="/admin" className={styles.heroButtonSecondary}>
          Админ-панель
        </Link>
      )}
      <Link href="/artists" className={styles.heroButtonSecondary}>
        Художники
      </Link>
    </div>
  );
}
