/*
 * 🏗️ STL Platform - Section Labels Component
 * Метки для визуализации секций на странице
 */

'use client';

import { useState } from 'react';
import styles from './SectionLabels.module.css';

export default function SectionLabels() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <>
      <div className={styles.labelOverlay}>
        <button
          className={styles.hideButton}
          onClick={() => setIsVisible(false)}
          title="Скрыть метки секций"
        >
          Скрыть метки
        </button>
      </div>

      {/* Hero Section Label */}
      <div className={`${styles.sectionLabel} ${styles.heroLabel}`}>
        <span className={styles.labelText}>Hero Section</span>
        <span className={styles.labelFile}>page.module.css → .hero</span>
      </div>

      {/* Grid Section Label */}
      <div className={`${styles.sectionLabel} ${styles.gridLabel}`}>
        <span className={styles.labelText}>Grid Section</span>
        <span className={styles.labelFile}>page.module.css → .gridSection</span>
      </div>

      {/* About Section Label */}
      <div className={`${styles.sectionLabel} ${styles.aboutLabel}`}>
        <span className={styles.labelText}>About Section</span>
        <span className={styles.labelFile}>page.module.css → .aboutSection</span>
      </div>

      {/* Info Section Label */}
      <div className={`${styles.sectionLabel} ${styles.infoLabel}`}>
        <span className={styles.labelText}>Info Section</span>
        <span className={styles.labelFile}>page.module.css → .infoSection</span>
      </div>
    </>
  );
}
