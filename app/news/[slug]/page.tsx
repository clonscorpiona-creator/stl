/*
 * 📰 STL Platform - News Detail Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-20
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "./page.module.css";

type NewsPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  coverUrl: string | null;
  publishedAt: string;
  author: {
    displayName: string | null;
    username: string;
  };
};

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
  };
};

export default function NewsDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<NewsPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const emojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇",
    "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝",
    "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄",
    "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧",
    "🥵", "🥶", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁",
    "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭",
    "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈",
    "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖",
    "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙",
    "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏",
    "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶",
    "👂", "🦻", "👃", "🧠", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞",
    "💓", "💗", "💖", "💘", "💝", "💟", "🔥", "✨", "⭐", "🌟", "💫", "💥", "💢",
    "💯", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾",
    "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥊", "🥋", "⛳", "🎯", "🎮", "🎲", "🎰"
  ];

  useEffect(() => {
    loadPost();
    loadComments();
    loadCurrentUser();
  }, [slug]);

  async function loadPost() {
    // 📥 Load news post from API
    try {
      const res = await fetch(`/api/news/${slug}`);
      const data = await res.json();
      if (res.ok) {
        setPost(data.post);
      }
    } catch (err) {
      console.error("Failed to load post:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    // 💬 Load comments for news post
    try {
      const res = await fetch(`/api/news/${slug}/comments`);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  }

  async function loadCurrentUser() {
    // 👤 Load current user data
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUserId(data.user.id);
        setUserRole(data.user.role);
      }
    } catch (err) {
      // 🚫 User not logged in
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    // 📤 Submit new comment
    e.preventDefault();

    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/news/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText }),
      });

      const data = await res.json();

      if (res.ok) {
        setComments([...comments, data.comment]);
        setCommentText("");
      } else {
        alert(data.error || "Failed to post comment");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    // 🗑️ Delete comment
    if (!confirm("Удалить этот комментарий?")) return;

    try {
      const res = await fetch(`/api/news/${slug}/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete comment");
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

  if (!post) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p>Новость не найдена</p>
          <Link href="/news">← Вернуться к новостям</Link>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Link href="/news" className={styles.backLink}>
          ← Все новости
        </Link>

        <article className={styles.article}>
          {post.coverUrl && (
            <img src={post.coverUrl} alt={post.title} className={styles.cover} />
          )}

          <header className={styles.header}>
            <h1 className={styles.title}>{post.title}</h1>
            <div className={styles.meta}>
              <span className={styles.author}>
                {post.author.displayName || post.author.username}
              </span>
              <span className={styles.date}>
                {new Date(post.publishedAt).toLocaleDateString("ru", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </header>

          <div className={styles.content}>
            {post.content.split("\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </article>

        <section className={styles.commentsSection}>
          <h2 className={styles.commentsTitle}>
            Комментарии ({comments.length})
          </h2>

          {currentUserId ? (
            <form onSubmit={handleSubmitComment} className={styles.commentForm}>
              <div style={{ position: "relative" }}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Написать комментарий..."
                  className={styles.commentInput}
                  rows={3}
                  maxLength={2000}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowEmoji(!showEmoji)}
                  style={{ position: "absolute", right: 8, top: 8, background: "transparent", border: "none", cursor: "pointer", fontSize: 20, padding: 4 }}
                  title="Эмодзи"
                >
                  😊
                </button>
                {showEmoji && (
                  <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, background: "var(--card-bg)", border: "2px solid var(--accent-dark)", borderRadius: 8, padding: 8, maxWidth: 320, maxHeight: 200, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, zIndex: 10, boxShadow: "var(--shadow-lg)" }}>
                    {emojis.map((emoji, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setCommentText(commentText + emoji);
                          setShowEmoji(false);
                        }}
                        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 20, padding: 4, borderRadius: 4, transition: "background 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className={styles.submitButton}
              >
                {submitting ? "Отправка..." : "Отправить"}
              </button>
            </form>
          ) : (
            <p className={styles.loginPrompt}>
              <Link href="/auth/login">Войдите</Link>, чтобы оставить комментарий
            </p>
          )}

          <div className={styles.commentsList}>
            {comments.length === 0 ? (
              <p className={styles.noComments}>Комментариев пока нет</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <Link
                      href={`/users/${comment.user.username}`}
                      className={styles.commentAuthor}
                    >
                      {comment.user.displayName || comment.user.username}
                    </Link>
                    <span className={styles.commentDate}>
                      {new Date(comment.createdAt).toLocaleDateString("ru")}
                    </span>
                  </div>
                  <p className={styles.commentText}>{comment.text}</p>
                  {(currentUserId === comment.user.id ||
                    userRole === "MODERATOR" ||
                    userRole === "ADMIN") && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className={styles.deleteButton}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
