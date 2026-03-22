/*
 * 📊 STL Platform - Stat Card Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

import styles from "./StatCard.module.css";

type StatCardProps = {
  value: number;
  label: string;
  icon?: React.ReactNode;
};

export default function StatCard({ value, label, icon }: StatCardProps) {
  return (
    <div className={styles.card}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.value}>{value.toLocaleString()}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
