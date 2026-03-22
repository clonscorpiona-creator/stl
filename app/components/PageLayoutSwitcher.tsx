'use client';

/*
 * 🔄 STL Platform - Page Layout Switcher
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import { useState, useEffect } from 'react';

type LayoutType = 'with-sidebar' | 'full-width' | 'modern-dark' | 'bakery-warm' | 'minimalist-modern' | 'minimalist-olive';

interface PageLayoutSwitcherProps {
  defaultContent: React.ReactNode;
  modernContent: React.ReactNode;
  bakeryContent: React.ReactNode;
  minimalistContent: React.ReactNode;
  minimalistOliveContent: React.ReactNode;
}

export default function PageLayoutSwitcher({ defaultContent, modernContent, bakeryContent, minimalistContent, minimalistOliveContent }: PageLayoutSwitcherProps) {
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('with-sidebar');

  useEffect(() => {
    const savedLayout = localStorage.getItem('site-layout') as LayoutType;
    if (savedLayout) {
      setCurrentLayout(savedLayout);
    }

    const checkLayout = () => {
      const layout = document.documentElement.getAttribute('data-layout') as LayoutType;
      if (layout) {
        setCurrentLayout(layout);
      }
    };

    checkLayout();

    const observer = new MutationObserver(checkLayout);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-layout']
    });

    return () => observer.disconnect();
  }, []);

  if (currentLayout === 'modern-dark') {
    return <>{modernContent}</>;
  }

  if (currentLayout === 'bakery-warm') {
    return <>{bakeryContent}</>;
  }

  if (currentLayout === 'minimalist-modern') {
    return <>{minimalistContent}</>;
  }

  if (currentLayout === 'minimalist-olive') {
    return <>{minimalistOliveContent}</>;
  }

  return <>{defaultContent}</>;
}
