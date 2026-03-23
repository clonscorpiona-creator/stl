/*
 * 👤 STL Platform - User Menu Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./UserMenu.module.css";

type User = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
};

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    // 👤 Load current user data
    try {
      const res = await fetch("/api/auth/me");
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
    return <div className={styles.loading}>...</div>;
  }

  if (!user) {
    return (
      <div className={styles.authButtons}>
        <Link href="/auth/register" className={styles.registerButton}>
          Войти
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.userMenuWrapper}>
      {user.role === 'ADMIN' && (
        <Link href="/admin" className={styles.adminLink} title="Панель администратора">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="2"/>
            <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"/>
          </svg>
        </Link>
      )}
      <Link href="/profile" className={styles.userMenu}>
        <div className={styles.avatar}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} />
          ) : (
            <span>{(user.displayName || user.username).charAt(0).toUpperCase()}</span>
          )}
        </div>
        <span className={styles.username}>{user.displayName || user.username}</span>
      </Link>
    </div>
  );
}
