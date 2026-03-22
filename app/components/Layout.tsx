/*
 * 🏗️ STL Platform - Layout Component
 * 📦 Version: 3.0.0
 * 📅 Created: 2026-03-22
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

'use client';

import { useState, useEffect } from 'react';
import Header from "./Header";
import Footer from "./Footer";
import LayoutSwitcher from "./LayoutSwitcher";
import MainSidebar from "./MainSidebar";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isFullPageLayout, setIsFullPageLayout] = useState(false);

  useEffect(() => {
    const checkLayout = () => {
      const layout = document.documentElement.getAttribute('data-layout');
      setIsFullPageLayout(layout === 'modern-dark' || layout === 'bakery-warm' || layout === 'minimalist-modern' || layout === 'minimalist-olive');
    };

    checkLayout();

    const observer = new MutationObserver(checkLayout);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-layout']
    });

    return () => observer.disconnect();
  }, []);

  if (isFullPageLayout) {
    return (
      <div className={styles.layout}>
        <main className={styles.mainFull}>
          {children}
        </main>
        <LayoutSwitcher />
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {children}
      <LayoutSwitcher />
    </div>
  );
}
