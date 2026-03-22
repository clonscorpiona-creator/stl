'use client';

/*
 * 🔄 STL Platform - Layout Switcher Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import { useState, useEffect } from 'react';
import styles from './LayoutSwitcher.module.css';

type LayoutType = 'with-sidebar' | 'full-width' | 'modern-dark' | 'bakery-warm' | 'minimalist-modern' | 'minimalist-olive';

export default function LayoutSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('with-sidebar');

  useEffect(() => {
    const savedLayout = localStorage.getItem('site-layout') as LayoutType;
    if (savedLayout) {
      setCurrentLayout(savedLayout);
      applyLayout(savedLayout);
    }
  }, []);

  const applyLayout = (layout: LayoutType) => {
    document.documentElement.setAttribute('data-layout', layout);
    localStorage.setItem('site-layout', layout);
  };

  const handleLayoutChange = (layout: LayoutType) => {
    setCurrentLayout(layout);
    applyLayout(layout);
    setIsOpen(false);
  };

  const layouts: { id: LayoutType; name: string; icon: string }[] = [
    { id: 'with-sidebar', name: 'С боковой панелью', icon: '📋' },
    { id: 'full-width', name: 'Полная ширина', icon: '📄' },
    { id: 'modern-dark', name: 'Современный тёмный', icon: '🌙' },
    { id: 'bakery-warm', name: 'Тёплый уют', icon: '🍞' },
    { id: 'minimalist-modern', name: 'Минималистичный', icon: '⬜' },
    { id: 'minimalist-olive', name: 'Минималистичный оливковый', icon: '🫒' },
  ];

  return (
    <div className={styles.layoutSwitcher}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Переключить макет"
      >
        <span>{layouts.find(l => l.id === currentLayout)?.icon}</span>
        <span>Макет</span>
      </button>

      {isOpen && (
        <div className={styles.layoutMenu}>
          <div className={styles.layoutMenuHeader}>Выберите макет</div>
          {layouts.map((layout) => (
            <button
              key={layout.id}
              className={`${styles.layoutOption} ${
                currentLayout === layout.id ? styles.active : ''
              }`}
              onClick={() => handleLayoutChange(layout.id)}
            >
              <span className={styles.layoutIcon}>{layout.icon}</span>
              <span className={styles.layoutName}>{layout.name}</span>
              {currentLayout === layout.id && (
                <span className={styles.checkmark}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
