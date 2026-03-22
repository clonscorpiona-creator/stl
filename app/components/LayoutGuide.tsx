/*
 * 🏗️ STL Platform - Layout Guide Component
 * Визуальный гид по структуре макета
 */

'use client';

import { useState } from 'react';
import styles from './LayoutGuide.module.css';

export default function LayoutGuide() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        className={styles.toggleButton}
        onClick={() => setIsVisible(true)}
        title="Показать структуру макета"
      >
        📐 Показать структуру
      </button>
    );
  }

  return (
    <div className={styles.guideOverlay}>
      <div className={styles.guidePanel}>
        <div className={styles.guideHeader}>
          <h3>🏗️ Структура макета</h3>
          <button
            className={styles.closeButton}
            onClick={() => setIsVisible(false)}
          >
            ✕
          </button>
        </div>

        <div className={styles.guideContent}>
          <h4>Основные блоки:</h4>
          <ul className={styles.blockList}>
            <li>
              <span className={styles.blockName}>Header</span>
              <span className={styles.blockDesc}>Шапка сайта (логотип, навигация)</span>
            </li>
            <li>
              <span className={styles.blockName}>MainSidebar</span>
              <span className={styles.blockDesc}>Боковая панель (меню)</span>
            </li>
            <li>
              <span className={styles.blockName}>Hero Section</span>
              <span className={styles.blockDesc}>Главный баннер с заголовком</span>
            </li>
            <li>
              <span className={styles.blockName}>Grid Section</span>
              <span className={styles.blockDesc}>Сетка специализаций</span>
            </li>
            <li>
              <span className={styles.blockName}>About Section</span>
              <span className={styles.blockDesc}>О сообществе</span>
            </li>
            <li>
              <span className={styles.blockName}>Info Section</span>
              <span className={styles.blockDesc}>Контакты и статистика</span>
            </li>
            <li>
              <span className={styles.blockName}>Footer</span>
              <span className={styles.blockDesc}>Подвал сайта</span>
            </li>
          </ul>

          <h4>Файлы стилей:</h4>
          <ul className={styles.fileList}>
            <li><code>page.module.css</code> - Стандартный макет</li>
            <li><code>page-modern.module.css</code> - Современный тёмный</li>
            <li><code>page-bakery.module.css</code> - Тёплый уют</li>
            <li><code>page-minimalist.module.css</code> - Минималистичный</li>
          </ul>

          <h4>Компоненты:</h4>
          <ul className={styles.fileList}>
            <li><code>Header.tsx</code> - Шапка</li>
            <li><code>MainSidebar.tsx</code> - Боковая панель</li>
            <li><code>Footer.tsx</code> - Подвал</li>
            <li><code>Layout.tsx</code> - Основной контейнер</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
