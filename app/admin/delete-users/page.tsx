"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteUsersPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("⚠️ ВЫ УВЕРЕНЫ? Это удалит ВСЕХ пользователей из базы данных! Это действие необратимо!")) {
      return;
    }

    if (!confirm("⚠️ ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ! Все пользователи будут удалены навсегда. Продолжить?")) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/delete-all-users", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete users");
      }

      setResult(`✅ Успешно удалено ${data.count} пользователей`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ color: "#dc2626", marginBottom: "20px" }}>
        ⚠️ Удаление всех пользователей
      </h1>

      <div style={{
        background: "#fef2f2",
        border: "2px solid #dc2626",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px"
      }}>
        <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>
          ВНИМАНИЕ: Это действие необратимо!
        </p>
        <p style={{ margin: "0" }}>
          Будут удалены все пользователи и связанные с ними данные из базы данных.
        </p>
      </div>

      <button
        onClick={handleDelete}
        disabled={loading}
        style={{
          background: "#dc2626",
          color: "white",
          padding: "12px 24px",
          border: "none",
          borderRadius: "6px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Удаление..." : "🗑️ Удалить всех пользователей"}
      </button>

      {result && (
        <div style={{
          marginTop: "20px",
          padding: "15px",
          background: "#f0fdf4",
          border: "1px solid #22c55e",
          borderRadius: "6px",
          color: "#166534"
        }}>
          {result}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: "20px",
          padding: "15px",
          background: "#fef2f2",
          border: "1px solid #dc2626",
          borderRadius: "6px",
          color: "#991b1b"
        }}>
          ❌ Ошибка: {error}
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <button
          onClick={() => router.push("/admin")}
          style={{
            background: "#6b7280",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ← Назад в админ панель
        </button>
      </div>
    </div>
  );
}
