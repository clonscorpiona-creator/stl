/*
 * 🏠 STL Platform - Home Page
 * 📦 Version: 3.0.0
 * 📅 Created: 2026-03-22
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import Link from "next/link";
import styles from "./page.module.css";
import PageLayoutSwitcher from "./components/PageLayoutSwitcher";
import ModernLayout from "./components/ModernLayout";
import BakeryLayout from "./components/BakeryLayout";
import MinimalistLayout from "./components/MinimalistLayout";
import MinimalistOliveLayout from "./components/MinimalistOliveLayout";
import LayoutGuide from "./components/LayoutGuide";
import SectionLabels from "./components/SectionLabels";
import StlLogo from "./components/StlLogo";
import ClockCalendar from "./components/ClockCalendar";
import HeroButtons from "./components/HeroButtons";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { PaletteIcon, VideoIcon, CubeIcon, SparkleIcon, MaskIcon, StarIcon } from "./components/Icons";

// Force dynamic rendering to avoid timeout during build
export const dynamic = 'force-dynamic';

// Enable ISR with 5-minute revalidation
export const revalidate = 300;

async function getStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/stats`, {
      next: { revalidate: 300 }
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      totalMembers: 0,
      totalArtists: 0,
      totalWorks: 0,
      totalSpecializations: 6
    };
  }
}

export default async function Home() {
  const stats = await getStats();

  const defaultLayout = (
    <div className={styles.page}>
      <LayoutGuide />
      <SectionLabels />
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.heroLeft}>
            <StlLogo />
          </div>
          <div className={styles.heroCenter}>
            <span className={styles.heroLabel}>Сообщество</span>
            <h1 className={styles.heroTitle}>
              Творчество встречается с профессионализмом
            </h1>
            <p className={styles.heroText}>
              Объединяем талантливых художников, дизайнеров и 3D-специалистов в одном пространстве для роста и вдохновения
            </p>
          </div>
          <div className={styles.heroRight}>
            <ClockCalendar />
          </div>
        </div>
        <div className={styles.topToolbar}>
          <HeroButtons styles={styles} />
        </div>
      </section>
      <div className={styles.layoutWrapper}>
        <Header />
        <div className={styles.contentWrapper}>
          <main className={styles.main}>

        {/* Grid Section - Specializations */}
        <section className={styles.gridSection}>
          <div className={styles.gridContainer}>
            <Link href="/artists?direction=GRAPHIC_DESIGN" className={styles.gridCard}>
              <div className={styles.gridCardImage} style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <PaletteIcon color="#fff" size={64} />
              </div>
              <div className={styles.gridCardOverlay}>
                <h3 className={styles.gridCardTitle}>Графический дизайн</h3>
                <p className={styles.gridCardSubtitle}>Иллюстрация и 2D-графика</p>
              </div>
            </Link>

            <Link href="/artists?direction=MOTION" className={styles.gridCard}>
              <div className={styles.gridCardImage} style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <VideoIcon color="#fff" size={64} />
              </div>
              <div className={styles.gridCardOverlay}>
                <h3 className={styles.gridCardTitle}>Моушн-дизайн</h3>
                <p className={styles.gridCardSubtitle}>Анимация и motion-графика</p>
              </div>
            </Link>

            <Link href="/artists?direction=MODELING_3D" className={styles.gridCard}>
              <div className={styles.gridCardImage} style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <CubeIcon color="#fff" size={64} />
              </div>
              <div className={styles.gridCardOverlay}>
                <h3 className={styles.gridCardTitle}>3D-моделинг</h3>
                <p className={styles.gridCardSubtitle}>Моделинг и скульптинг</p>
              </div>
            </Link>

            <Link href="/artists" className={styles.gridCard}>
              <div className={styles.gridCardImage} style={{background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <SparkleIcon color="#fff" size={80} />
              </div>
              <div className={styles.gridCardOverlay}>
                <h3 className={styles.gridCardTitle}>Все специализации</h3>
                <p className={styles.gridCardSubtitle}>Визуализация, 3D-печать, WEB-дизайн и другие</p>
              </div>
            </Link>
          </div>
        </section>

        {/* About Section */}
        <section className={styles.aboutSection}>
          <div className={styles.aboutContainer}>
            <div className={styles.aboutImageWrapper}>
              <div className={styles.aboutImage} style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <MaskIcon color="#fff" size={140} />
              </div>
            </div>
            <div className={styles.aboutContent}>
              <h2 className={styles.aboutTitle}>О сообществе СТЛ</h2>
              <p className={styles.aboutText}>
                Мы создали пространство, где творческие профессионалы могут делиться своими работами, находить вдохновение и развиваться вместе. Наше сообщество объединяет художников различных направлений — от графического дизайна до 3D-моделирования.
              </p>
              <div className={styles.aboutStats}>
                <StarIcon color="#5C3D2E" size={28} />
                <StarIcon color="#5C3D2E" size={28} />
                <StarIcon color="#5C3D2E" size={28} />
                <StarIcon color="#5C3D2E" size={28} />
                <StarIcon color="#5C3D2E" size={28} />
              </div>
              <p className={styles.aboutFooter}>
                "{stats.totalArtists}+ художников доверяют СТЛ"
              </p>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className={styles.infoSection}>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h3 className={styles.infoCardTitle}>Контакты</h3>
              <ul className={styles.infoCardList}>
                <li>Email: info@stl.com</li>
                <li>Telegram: @stl_community</li>
                <li>Discord: STL Server</li>
              </ul>
            </div>

            <div className={styles.infoCard}>
              <h3 className={styles.infoCardTitle}>Статистика</h3>
              <ul className={styles.infoCardList}>
                <li>{stats.totalArtists} художников</li>
                <li>{stats.totalWorks} работ</li>
                <li>{stats.totalSpecializations} специализаций</li>
                <li>{stats.totalMembers} участников</li>
              </ul>
            </div>

            <div className={styles.infoCard}>
              <h3 className={styles.infoCardTitle}>Социальные сети</h3>
              <ul className={styles.infoCardList}>
                <li>Instagram</li>
                <li>Behance</li>
                <li>ArtStation</li>
                <li>Dribbble</li>
              </ul>
            </div>
          </div>
        </section>
          </main>
        </div>
        <Footer />
      </div>
    </div>
  );

  return (
    <PageLayoutSwitcher
      defaultContent={defaultLayout}
      modernContent={<ModernLayout />}
      bakeryContent={<BakeryLayout />}
      minimalistContent={<MinimalistLayout />}
      minimalistOliveContent={<MinimalistOliveLayout />}
    />
  );
}
