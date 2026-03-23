/*
 * 🚫 STL Platform - Blocked Users Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-20
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type BlockedUser = {
  blockedId: string;
  createdAt: string;
  blocked: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

export default function BlockedUsersPage() {
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBlocks();
  }, []);

  async function loadBlocks() {
    try {
      const res = await fetch("/api/users/blocks");
      const data = await res.json();

      if (res.ok) {
        setBlocks(data.blocks);
      } else {
        setError(data.error || "Failed to load blocked users");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function unblockUser(username: string) {
    if (!confirm(`Разблокировать ${username}?`)) return;

    try {
      const res = await fetch(`/api/users/${username}/block`, {
        method: "DELETE"
      });

      if (res.ok) {
        // ✅ Remove from local state
        setBlocks(blocks.filter(b => b.blocked.username !== username));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to unblock user");
      }
    } catch (err) {
      alert("Network error");
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p>Загрузка...</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <Link href="/profile" className={styles.backLink}>
            ← Профиль
          </Link>
          <h1 className={styles.title}>Заблокированные пользователи</h1>
          <p className={styles.subtitle}>
            Заблокированные пользователи не могут отправлять вам заявки
          </p>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        {blocks.length === 0 ? (
          <p className={styles.empty}>Нет заблокированных пользователей</p>
        ) : (
          <div className={styles.blockList}>
            {blocks.map((block) => (
              <div key={block.blockedId} className={styles.blockCard}>
                <div className={styles.userInfo}>
                  {block.blocked.avatarUrl ? (
                    <img
                      src={block.blocked.avatarUrl}
                      alt={block.blocked.username}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {(block.blocked.displayName || block.blocked.username)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className={styles.userDetails}>
                    <Link
                      href={`/users/${block.blocked.username}`}
                      className={styles.username}
                    >
                      {block.blocked.displayName || block.blocked.username}
                    </Link>
                    <span className={styles.blockedDate}>
                      Заблокирован {new Date(block.createdAt).toLocaleDateString("ru")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => unblockUser(block.blocked.username)}
                  className={styles.unblockButton}
                >
                  Разблокировать
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
