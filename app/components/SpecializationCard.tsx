/*
 * 🎯 STL Platform - Specialization Card Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

import Link from "next/link";
import styles from "./SpecializationCard.module.css";

type SpecializationCardProps = {
  direction: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

export default function SpecializationCard({
  direction,
  title,
  description,
  icon,
}: SpecializationCardProps) {
  return (
    <Link href={`/artists?direction=${direction}`} className={styles.card}>
      <div className={styles.hexagon}>
        <div className={styles.icon}>{icon}</div>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </Link>
  );
}
