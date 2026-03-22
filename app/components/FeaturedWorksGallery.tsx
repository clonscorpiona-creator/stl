/*
 * 🎨 STL Platform - Featured Works Gallery Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

import WorkCard from "./WorkCard";
import styles from "./FeaturedWorksGallery.module.css";

type Work = {
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

type FeaturedWorksGalleryProps = {
  works: Work[];
  layout?: "grid" | "masonry";
};

export default function FeaturedWorksGallery({
  works,
  layout = "grid",
}: FeaturedWorksGalleryProps) {
  if (!works || works.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No featured works available</p>
      </div>
    );
  }

  return (
    <div className={`${styles.gallery} ${styles[layout]}`}>
      {works.map((work) => (
        <WorkCard key={work.id} work={work} />
      ))}
    </div>
  );
}
