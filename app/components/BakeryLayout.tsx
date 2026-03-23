/*
 * 🍞 STL Platform - Bakery-inspired Warm Layout
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import Link from "next/link";
import styles from "./page-bakery.module.css";
import LayoutGuide from "./LayoutGuide";
import SectionLabels from "./SectionLabels";
import StlLogo from "./StlLogo";
import ClockCalendar from "./ClockCalendar";
import HeroButtons from "./HeroButtons";
import Header from "./Header";
import Footer from "./Footer";

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

export default async function BakeryLayout() {
  const stats = await getStats();

  return (
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
            <span className={styles.heroLabel}>Творческое сообщество</span>
            <h1 className={styles.heroTitle}>
              Тепло творчества в каждом проекте
            </h1>
            <p className={styles.heroText}>
              Присоединяйтесь к уютному сообществу художников, где каждая работа создается с душой и вдохновением
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

        {/* Why Choose Section */}
        <section className={styles.whySection}>
          <div className={styles.whyContainer}>
            <h2 className={styles.whyTitle}>Почему выбирают СТЛ</h2>
            <div className={styles.whyGrid}>
              <Link href="/artists?direction=GRAPHIC_DESIGN" className={styles.whyCard}>
                <div className={styles.whyCardImage} style={{background: 'linear-gradient(135deg, #D4A574 0%, #8B6F47 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '64px'}}>
                  🎨
                </div>
                <div className={styles.whyCardContent}>
                  <h3 className={styles.whyCardTitle}>Графический дизайн</h3>
                  <p className={styles.whyCardText}>
                    Талантливые иллюстраторы и дизайнеры создают уникальные визуальные решения
                  </p>
                  <span className={styles.whyCardButton}>Смотреть работы</span>
                </div>
              </Link>

              <Link href="/artists?direction=MOTION" className={styles.whyCard}>
                <div className={styles.whyCardImage} style={{background: 'linear-gradient(135deg, #8B6F47 0%, #5C3D2E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '64px'}}>
                  🎬
                </div>
                <div className={styles.whyCardContent}>
                  <h3 className={styles.whyCardTitle}>Моушн-дизайн</h3>
                  <p className={styles.whyCardText}>
                    Оживляем идеи через анимацию и создаем захватывающие визуальные истории
                  </p>
                  <span className={styles.whyCardButton}>Смотреть работы</span>
                </div>
              </Link>

              <Link href="/artists?direction=MODELING_3D" className={styles.whyCard}>
                <div className={styles.whyCardImage} style={{background: 'linear-gradient(135deg, #6B4423 0%, #8B5A3C 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '64px'}}>
                  🧊
                </div>
                <div className={styles.whyCardContent}>
                  <h3 className={styles.whyCardTitle}>3D-моделинг</h3>
                  <p className={styles.whyCardText}>
                    Создаем объемные миры и персонажей с вниманием к каждой детали
                  </p>
                  <span className={styles.whyCardButton}>Смотреть работы</span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Visit Section */}
        <section className={styles.visitSection}>
          <div className={styles.visitContainer}>
            <div className={styles.visitHeader}>
              <h2 className={styles.visitTitle}>Присоединяйтесь к сообществу</h2>
              <p className={styles.visitText}>
                СТЛ — это место, где творческие профессионалы находят вдохновение, делятся опытом и растут вместе.
                Мы создали теплую атмосферу для развития и сотрудничества.
              </p>
              <Link href="/artists" className={styles.visitButton}>
                Все художники
              </Link>
            </div>

            <div className={styles.visitGrid}>
              <div className={styles.visitCard}>
                <div className={styles.visitCardImage} style={{background: 'linear-gradient(135deg, #D4A574 0%, #8B6F47 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '48px'}}>
                  👥
                </div>
                <div className={styles.visitCardContent}>
                  <h3 className={styles.visitCardTitle}>{stats.totalArtists}+ художников</h3>
                </div>
              </div>

              <div className={styles.visitCard}>
                <div className={styles.visitCardImage} style={{background: 'linear-gradient(135deg, #8B6F47 0%, #6B4423 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '48px'}}>
                  🎨
                </div>
                <div className={styles.visitCardContent}>
                  <h3 className={styles.visitCardTitle}>{stats.totalWorks}+ работ</h3>
                </div>
              </div>

              <div className={styles.visitCard}>
                <div className={styles.visitCardImage} style={{background: 'linear-gradient(135deg, #6B4423 0%, #5C3D2E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '48px'}}>
                  ✨
                </div>
                <div className={styles.visitCardContent}>
                  <h3 className={styles.visitCardTitle}>{stats.totalSpecializations} специализаций</h3>
                </div>
              </div>
            </div>
          </div>
        </section>
          </main>
        </div>
        <Footer />
      </div>
    </div>
  );
}
