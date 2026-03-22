/*
 * 👥 STL Platform - Artists Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Direction = "ILLUSTRATION_2D" | "GRAPHIC_DESIGN" | "MOTION" | "MODELING_3D" | "VISUALIZATION_3D" | "PRINTING_3D" | "WEB_DESIGN";

type Artist = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  howToWork: string | null;
  directions: { direction: Direction }[];
  works: {
    id: string;
    title: string;
    direction: string;
    media: { url: string; previewUrl: string | null; type: string }[];
  }[];
  _count: { works: number };
};

const directionLabels: Record<Direction, string> = {
  ILLUSTRATION_2D: "2D-иллюстрация",
  GRAPHIC_DESIGN: "Графический дизайн",
  MOTION: "Моушн-дизайн",
  MODELING_3D: "3D-моделирование",
  VISUALIZATION_3D: "Визуализация",
  PRINTING_3D: "3D-печать",
  WEB_DESIGN: "WEB-дизайн",
};

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDirection, setSelectedDirection] = useState<Direction | "">("");

  useEffect(() => {
    // 📥 Load artists with optional direction filter
    const params = new URLSearchParams();
    if (selectedDirection) {
      params.set("direction", selectedDirection);
    }

    fetch(`/api/artists?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setArtists(data.artists || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedDirection]);

  return (
    <main style={{ maxWidth: 1400, margin: "0 auto", padding: 20 }}>
      <header style={{ marginBottom: 30 }}>
        <Link href="/" style={{ color: "var(--accent-dark)", textDecoration: "none" }}>
          ← Главная
        </Link>
        <h1 style={{ marginTop: 10, marginBottom: 10, color: "var(--foreground)" }}>Каталог художников</h1>
        <p style={{ color: "var(--text-secondary)" }}>Найдите специалиста для вашего проекта</p>
      </header>

      <div style={{ marginBottom: 30 }}>
        <label style={{ display: "block", marginBottom: 10, fontWeight: 500, color: "var(--foreground)" }}>
          Фильтр по направлению:
        </label>
        <select
          value={selectedDirection}
          onChange={(e) => setSelectedDirection(e.target.value as Direction | "")}
          style={{
            padding: "10px 15px",
            borderRadius: 8,
            border: "2px solid var(--accent-dark)",
            fontSize: 15,
            minWidth: 250,
            background: "var(--card-bg)",
            color: "var(--text-primary)",
          }}
        >
          <option value="">Все направления</option>
          {Object.entries(directionLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p style={{ color: "var(--text-secondary)" }}>Загрузка...</p>}

      {!loading && artists.length === 0 && (
        <p style={{ color: "var(--text-secondary)" }}>Художники не найдены</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 20,
        }}
      >
        {artists.map((artist) => (
          <article
            key={artist.id}
            style={{
              border: "2px solid var(--accent-dark)",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--card-bg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {artist.avatarUrl && (
                <img
                  src={artist.avatarUrl}
                  alt=""
                  style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 18, color: "var(--text-primary)" }}>
                  <Link href={`/users/${artist.username}`} style={{ color: "inherit" }}>
                    {artist.displayName || artist.username}
                  </Link>
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>
                  @{artist.username}
                </p>
              </div>
            </div>

            {artist.bio && (
              <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>{artist.bio}</p>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {artist.directions.map((d) => (
                <span
                  key={d.direction}
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    background: "var(--accent-light)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                    fontWeight: 600,
                  }}
                >
                  {directionLabels[d.direction]}
                </span>
              ))}
            </div>

            {artist.works.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {artist.works.slice(0, 3).map((work) => (
                  <Link
                    key={work.id}
                    href={`/works/${work.id}`}
                    style={{
                      aspectRatio: "1",
                      background: "var(--card-light)",
                      borderRadius: 8,
                      overflow: "hidden",
                      display: "block",
                    }}
                  >
                    {work.media[0] && (
                      <img
                        src={work.media[0].previewUrl || work.media[0].url}
                        alt={work.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </Link>
                ))}
              </div>
            )}

            <div style={{ marginTop: "auto", paddingTop: 8 }}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
                {artist._count.works} {artist._count.works === 1 ? "работа" : "работ"}
              </p>
              <Link
                href={`/inquiries/new?recipient=${artist.id}`}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "10px 16px",
                  background: "var(--accent)",
                  color: "var(--text-primary)",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Написать по проекту
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
