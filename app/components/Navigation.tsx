/*
 * 🧭 STL Platform - Dynamic Navigation Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-21
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import Link from 'next/link';
import { getEnabledModules } from '@/lib/moduleMiddleware';
import { MODULES } from '@/lib/modules';
import styles from './Navigation.module.css';

export default function Navigation() {
  const enabledModules = getEnabledModules();

  // 🔗 Define navigation items
  const navItems = [
    { href: '/works', label: 'Работы', module: 'works' as const },
    { href: '/chat', label: 'Чат', module: 'chat' as const },
    { href: '/news', label: 'Новости', module: 'news' as const },
  ];

  // 🔍 Filter by enabled modules
  const visibleItems = navItems.filter((item) =>
    enabledModules.includes(item.module)
  );

  return (
    <nav className={styles.nav}>
      {visibleItems.map((item) => (
        <Link key={item.href} className={styles.navLink} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
