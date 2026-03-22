"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import ThemeSwitcher from "../../../../components/ThemeSwitcher";

type NewsPost = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  content: string;
  status: string;
};

export default function EditNewsPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<NewsPost | null>(null);
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    coverUrl: "",
    content: "",
    status: "DRAFT",
  });

  useEffect(() => {
    loadPost();
  }, []);

  async function loadPost() {
    try {
      const res = await fetch(`/api/news/${params.slug}`);
      const data = await res.json();

      if (res.ok) {
        setPost(data.post);
        setFormData({
          slug: data.post.slug,
          title: data.post.title,
          coverUrl: data.post.coverUrl || "",
          content: data.post.content,
          status: data.post.status,
        });
      } else {
        setError(data.error || "Failed to load post");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updateData: any = {
        title: formData.title,
        coverUrl: formData.coverUrl || null,
        content: formData.content,
        status: formData.status,
      };

      // Если slug изменился, передаем новый slug
      if (formData.slug !== params.slug) {
        updateData.newSlug = formData.slug;
      }

      const res = await fetch(`/api/news/${params.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/news/admin");
      } else {
        setError(data.error || "Failed to update post");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <ThemeSwitcher />
        <main className={styles.main}>
          <p>Загрузка...</p>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.page}>
        <ThemeSwitcher />
        <main className={styles.main}>
          <p>Новость не найдена</p>
          <Link href="/news/admin">← Назад</Link>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ThemeSwitcher />
      <main className={styles.main}>
        <header className={styles.header}>
          <Link href="/news/admin" className={styles.backLink}>
            ← Назад
          </Link>
          <h1 className={styles.title}>Редактировать новость</h1>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="slug">Slug (URL)</label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="news-title-2026"
              required
              pattern="[a-z0-9-]+"
              title="Только строчные буквы, цифры и дефисы"
            />
            <small>Только строчные буквы, цифры и дефисы</small>
          </div>

          <div className={styles.field}>
            <label htmlFor="title">Заголовок</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Заголовок новости"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="coverUrl">URL обложки (опционально)</label>
            <input
              type="url"
              id="coverUrl"
              name="coverUrl"
              value={formData.coverUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="content">Содержание</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Текст новости (поддерживается Markdown)"
              rows={15}
              required
            />
            <small>Поддерживается Markdown форматирование</small>
          </div>

          <div className={styles.field}>
            <label htmlFor="status">Статус</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="DRAFT">Черновик</option>
              <option value="PUBLISHED">Опубликовано</option>
            </select>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.cancelButton}
              disabled={saving}
            >
              Отмена
            </button>
            <button type="submit" className={styles.submitButton} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
