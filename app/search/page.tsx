/*
 * 🔍 STL Platform - Search Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-20
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

type Work = {
  id: string;
  title: string;
  description: string;
  direction: string;
  publishedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  media: Array<{
    id: string;
    url: string;
    type: string;
  }>;
  _count: {
    likes: number;
    comments: number;
  };
};

const DIRECTIONS = [
  { value: "ILLUSTRATION_2D", label: "2D иллюстрация" },
  { value: "GRAPHIC_DESIGN", label: "Графический дизайн" },
  { value: "MOTION", label: "Моушн-дизайн" },
  { value: "MODELING_3D", label: "3D моделирование" },
  { value: "VISUALIZATION_3D", label: "3D визуализация" },
  { value: "PRINTING_3D", label: "3D печать" },
  { value: "WEB_DESIGN", label: "Веб-дизайн" },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [direction, setDirection] = useState(searchParams.get("direction") || "");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const d = searchParams.get("direction") || "";
    setQuery(q);
    setDirection(d);
    setOffset(0);
    performSearch(q, d, 0);
  }, [searchParams]);

  async function performSearch(q: string, d: string, off: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (d) params.set("direction", d);
      params.set("limit", "20");
      params.set("offset", off.toString());

      const res = await fetch(`/api/works/search?${params}`);
      const data = await res.json();

      if (res.ok) {
        if (off === 0) {
          setWorks(data.works);
        } else {
          setWorks((prev) => [...prev, ...data.works]);
        }
        setTotal(data.total);
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (direction) params.set("direction", direction);
    window.history.pushState({}, "", `/search?${params}`);
    setOffset(0);
    performSearch(query, direction, 0);
  }

  function loadMore() {
    const newOffset = offset + 20;
    setOffset(newOffset);
    performSearch(query, direction, newOffset);
  }

  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          ← Главная
        </Link>
        <h1 className={styles.title}>Поиск работ</h1>
      </header>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          placeholder="Поиск по названию или описанию..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          className={styles.directionSelect}
        >
          <option value="">Все направления</option>
          {DIRECTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <button type="submit" className={styles.searchButton} disabled={loading}>
          {loading ? "Поиск..." : "Найти"}
        </button>
      </form>

      {total > 0 && (
        <p className={styles.results}>
          Найдено работ: {total}
        </p>
      )}

      {!loading && works.length === 0 && (
        <p className={styles.empty}>
          {query || direction ? "Ничего не найдено" : "Введите запрос для поиска"}
        </p>
      )}

      {works.length > 0 && (
        <div className={styles.grid}>
          {works.map((work) => (
            <article key={work.id} className={styles.card}>
              {work.media[0] && (
                <div className={styles.mediaContainer}>
                  {work.media[0].type === "IMAGE" ? (
                    <img
                      src={work.media[0].url}
                      alt={work.title}
                      className={styles.media}
                    />
                  ) : (
                    <video
                      src={work.media[0].url}
                      className={styles.media}
                      muted
                      loop
                      playsInline
                    />
                  )}
                </div>
              )}
              <div className={styles.cardContent}>
                <Link href={`/works/${work.id}`} className={styles.workTitle}>
                  {work.title}
                </Link>
                <p className={styles.description}>{work.description}</p>
                <div className={styles.meta}>
                  <Link
                    href={`/users/${work.user.username}`}
                    className={styles.author}
                  >
                    {work.user.displayName || work.user.username}
                  </Link>
                  <span className={styles.stats}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '2px'}}>
                      <path d="M20.84 4.61C20.3985 4.16826 19.8783 3.81792 19.3061 3.57866C18.7339 3.3394 18.1206 3.21591 17.5 3.21591C16.8794 3.21591 16.2661 3.3394 15.6939 3.57866C15.1217 3.81792 14.6015 4.16826 14.16 4.61L12 6.77L9.84 4.61C8.94942 3.71942 7.74269 3.21591 6.48 3.21591C5.21731 3.21591 4.01058 3.71942 3.12 4.61C2.22942 5.50058 1.72591 6.70731 1.72591 7.97C1.72591 9.23269 2.22942 10.4394 3.12 11.33L12 20.21L20.88 11.33C21.7706 10.4394 22.2741 9.23269 22.2741 7.97C22.2741 6.70731 21.7706 5.50058 20.88 4.61H20.84Z"/>
                    </svg>
                    {work._count.likes} ·
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px', marginRight: '2px'}}>
                      <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"/>
                    </svg>
                    {work._count.comments}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <button onClick={loadMore} className={styles.loadMore}>
          Загрузить ещё
        </button>
      )}

      {loading && offset > 0 && (
        <p className={styles.loading}>Загрузка...</p>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Suspense fallback={<p>Загрузка...</p>}>
          <SearchContent />
        </Suspense>
      </main>
    </div>
  );
}
