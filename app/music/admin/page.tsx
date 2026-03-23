/*
 * 🎵 STL Platform - Music Admin Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-20
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Song = {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  coverUrl: string | null;
  fileUrl: string;
  duration: number | null;
  fileSize: bigint | null;
  createdAt: string;
  uploadedBy: {
    username: string;
    displayName: string | null;
  };
};

export default function MusicAdminPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSongs();
  }, []);

  async function loadSongs() {
    const res = await fetch("/api/music");
    const data = await res.json();
    if (res.ok) {
      setSongs(data.songs);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setError(null);
    setLoading(true);

    const res = await fetch("/api/music", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        artist: artist || null,
        album: album || null,
        coverUrl: coverUrl || null,
        fileUrl,
        duration: duration ? parseInt(duration) : null,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("Песня добавлена!");
      setTitle("");
      setArtist("");
      setAlbum("");
      setCoverUrl("");
      setFileUrl("");
      setDuration("");
      loadSongs();
    } else {
      setError(data.error || "Ошибка добавления");
    }

    setLoading(false);
  }

  async function deleteSong(songId: string) {
    if (!confirm("Удалить эту песню?")) return;

    const res = await fetch(`/api/music/${songId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      loadSongs();
      setStatus("Песня удалена");
    } else {
      const data = await res.json();
      setError(data.error || "Ошибка удаления");
    }
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Link href="/music" className={styles.backLink}>
          ← Назад к плееру
        </Link>

        <h1 className={styles.title}>Управление музыкой</h1>
        <p className={styles.subtitle}>Панель администратора</p>

        {status && <div className={styles.statusMessage}>{status}</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Добавить песню</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Название *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название песни"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Исполнитель</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Имя исполнителя"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Альбом</label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="Название альбома"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>URL обложки</label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className={styles.input}
              />
              <small>Ссылка на изображение обложки</small>
            </div>

            <div className={styles.formGroup}>
              <label>URL файла MP3 *</label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://example.com/song.mp3"
                required
                className={styles.input}
              />
              <small>Прямая ссылка на MP3 файл</small>
            </div>

            <div className={styles.formGroup}>
              <label>Длительность (секунды)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="180"
                className={styles.input}
              />
              <small>Длительность трека в секундах</small>
            </div>

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? "Добавление..." : "Добавить песню"}
            </button>
          </form>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Загруженные песни ({songs.length})</h2>
          <div className={styles.songList}>
            {songs.length === 0 ? (
              <p className={styles.emptyMessage}>Пока нет загруженных песен</p>
            ) : (
              songs.map((song) => (
                <div key={song.id} className={styles.songCard}>
                  <div className={styles.songCover}>
                    {song.coverUrl ? (
                      <img src={song.coverUrl} alt={song.title} />
                    ) : (
                      <div className={styles.songCoverPlaceholder}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M9 18V5l12-2v13"/>
                          <circle cx="6" cy="18" r="3"/>
                          <circle cx="18" cy="16" r="3"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={styles.songInfo}>
                    <h3 className={styles.songTitle}>{song.title}</h3>
                    <p className={styles.songArtist}>
                      {song.artist || "Неизвестный исполнитель"}
                      {song.album && ` • ${song.album}`}
                    </p>
                    <div className={styles.songMeta}>
                      Длительность: {formatDuration(song.duration)} • Загрузил:{" "}
                      {song.uploadedBy.displayName || song.uploadedBy.username}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSong(song.id)}
                    className={styles.deleteButton}
                  >
                    Удалить
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
