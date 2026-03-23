"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type NewsPost = {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  author: {
    displayName: string | null;
    username: string;
  };
};

export default function NewsAdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const res = await fetch("/api/news?status=all");
      const data = await res.json();

      if (res.ok) {
        setPosts(data.posts);
      } else {
        setError(data.error || "Failed to load posts");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(slug: string) {
    if (!confirm("Удалить эту новость?")) return;

    try {
      const res = await fetch(`/api/news/${slug}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPosts(posts.filter((p) => p.slug !== slug));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
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
          <Link href="/news" className={styles.backLink}>
            ← Новости
          </Link>
          <h1 className={styles.title}>Управление новостями</h1>
          <Link href="/news/admin/new" className={styles.createButton}>
            + Создать новость
          </Link>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.postsList}>
          {posts.length === 0 ? (
            <p className={styles.empty}>Новостей пока нет</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className={styles.postCard}>
                <div className={styles.postInfo}>
                  <h3 className={styles.postTitle}>{post.title}</h3>
                  <div className={styles.postMeta}>
                    <span className={`${styles.status} ${styles[post.status.toLowerCase()]}`}>
                      {post.status}
                    </span>
                    <span className={styles.author}>
                      {post.author.displayName || post.author.username}
                    </span>
                    <span className={styles.date}>
                      {new Date(post.createdAt).toLocaleDateString("ru")}
                    </span>
                  </div>
                </div>
                <div className={styles.postActions}>
                  <Link
                    href={`/news/admin/edit/${post.slug}`}
                    className={styles.editButton}
                  >
                    Редактировать
                  </Link>
                  <button
                    onClick={() => deletePost(post.slug)}
                    className={styles.deleteButton}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
