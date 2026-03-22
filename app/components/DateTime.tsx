/*
 * 🕐 STL Platform - DateTime Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import { useEffect, useState } from "react";
import styles from "./DateTime.module.css";

export default function DateTime() {
  const [dateTime, setDateTime] = useState<Date | null>(null);

  useEffect(() => {
    // ⏰ Update time every second
    setDateTime(new Date());
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!dateTime) return null;

  const formatDate = (date: Date) => {
    // 📅 Format date in Russian locale
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  const formatTime = (date: Date) => {
    // ⏰ Format time in Russian locale
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <div className={styles.dateTime}>
      <span className={styles.date}>{formatDate(dateTime)}</span>
      <span className={styles.time}>{formatTime(dateTime)}</span>
    </div>
  );
}
