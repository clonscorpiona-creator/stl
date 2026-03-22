/*
 * 🎨 STL Platform - Work Card Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

import Link from "next/link";
import Image from "next/image";
import styles from "./WorkCard.module.css";

type WorkCardProps = {
  work: {
    id: string;
    title: string;
    direction: string;
    user: {
      username: string;
      displayName: string | null;
    };
    media: Array<{
      id: string;
      url: string;
      previewUrl?: string | null;
      type: string;
      width?: number | null;
      height?: number | null;
    }>;
    _count: {
      likes: number;
      comments: number;
    };
  };
  size?: "default" | "large";
};

export default function WorkCard({ work, size = "default" }: WorkCardProps) {
  const firstMedia = work.media[0];
  const imageUrl = firstMedia?.previewUrl || firstMedia?.url || "/placeholder.jpg";
  const authorName = work.user.displayName || work.user.username;

  return (
    <Link href={`/works/${work.id}`} className={`${styles.card} ${styles[size]}`}>
      <div className={styles.imageWrapper}>
        <Image
          src={imageUrl}
          alt={work.title}
          width={400}
          height={300}
          className={styles.image}
        />
        <div className={styles.overlay}>
          <div className={styles.stats}>
            <span className={styles.stat}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 14L2 8.5L3.5 7L8 11L12.5 7L14 8.5L8 14Z" fill="currentColor"/>
                <path d="M8 2C5.5 2 3.5 4 3.5 6.5C3.5 8 4.5 9.5 8 13C11.5 9.5 12.5 8 12.5 6.5C12.5 4 10.5 2 8 2Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              {work._count.likes}
            </span>
            <span className={styles.stat}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 10C14 10.5304 13.7893 11.0391 13.4142 11.4142C13.0391 11.7893 12.5304 12 12 12H4L2 14V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H12C12.5304 2 13.0391 2.21071 13.4142 2.58579C13.7893 2.96086 14 3.46957 14 4V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {work._count.comments}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{work.title}</h3>
        <p className={styles.author}>{authorName}</p>
        <span className={styles.direction}>{work.direction}</span>
      </div>
    </Link>
  );
}
