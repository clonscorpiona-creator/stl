/*
 * ➕ STL Platform - New Work Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const directions = [
  "ILLUSTRATION_2D",
  "GRAPHIC_DESIGN",
  "MOTION",
  "MODELING_3D",
  "VISUALIZATION_3D",
  "PRINTING_3D",
  "WEB_DESIGN",
] as const;

export default function NewWorkPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [direction, setDirection] = useState<(typeof directions)[number]>("ILLUSTRATION_2D");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO" | "AUDIO">("IMAGE");
  const [status, setStatus] = useState<string | null>(null);

  const canSubmit = useMemo(() => title.trim() && description.trim(), [title, description]);

  async function create() {
    setStatus(null);
    const res = await fetch("/api/works", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, description, direction }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setStatus(data?.error ?? "Ошибка");
      return;
    }

    const workId = data.work.id as string;

    if (mediaUrl.trim()) {
      await fetch(`/api/works/${workId}/media`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: mediaUrl.trim(), type: mediaType }),
      });
    }

    router.push(`/works/${workId}/edit`);
  }

  return (
    <main style={{ display: "grid", gap: 12, maxWidth: 720 }}>
      <h1>Новая работа</h1>

      <label>
        Название
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ display: "block", width: "100%" }} />
      </label>

      <label>
        Описание
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          style={{ display: "block", width: "100%" }}
        />
      </label>

      <label>
        Направление
        <select value={direction} onChange={(e) => setDirection(e.target.value as any)}>
          {directions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <fieldset style={{ padding: 12, borderRadius: 12 }}>
        <legend>Медиа (MVP: URL ссылкой)</legend>
        <label>
          Тип
          <select value={mediaType} onChange={(e) => setMediaType(e.target.value as any)}>
            <option value="IMAGE">IMAGE</option>
            <option value="VIDEO">VIDEO</option>
            <option value="AUDIO">AUDIO</option>
          </select>
        </label>
        <label style={{ display: "block", marginTop: 8 }}>
          URL
          <input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://..."
            style={{ display: "block", width: "100%" }}
          />
        </label>
      </fieldset>

      <button onClick={create} disabled={!canSubmit}>
        Создать
      </button>

      {status && <p>{status}</p>}
    </main>
  );
}
