/*
 * 🎨 STL Platform - Minimalist Olive Layout
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import Link from "next/link";
import styles from "./page-minimalist-olive.module.css";
import LayoutGuide from "./LayoutGuide";
import SectionLabels from "./SectionLabels";
import StlLogo from "./StlLogo";
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

export default async function MinimalistOliveLayout() {
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
              Чистота формы. Глубина содержания
            </h1>
            <p className={styles.heroText}>
              Присоединяйтесь к сообществу художников, где минимализм встречается с выразительностью
            </p>
          </div>
          <div className={styles.heroRight}></div>
        </div>
        <div className={styles.topToolbar}>
          <HeroButtons styles={styles} />
        </div>
      </section>
      <div className={styles.layoutWrapper}>
        <Header />
        <div className={styles.contentWrapper}>
          <main className={styles.main}>

        {/* Products Grid Section */}
        <section className={styles.productsSection}>
          <div className={styles.productsContainer}>
            <h2 className={styles.sectionTitle}>Специализации</h2>
            <div className={styles.productsGrid}>
              <Link href="/artists?direction=GRAPHIC_DESIGN" className={styles.productCard}>
                <div className={styles.productImage}>
                  🎨
                </div>
                <div className={styles.productContent}>
                  <h3 className={styles.productTitle}>Графический дизайн</h3>
                  <p className={styles.productText}>
                    Иллюстрация и визуальная коммуникация
                  </p>
                </div>
              </Link>

              <Link href="/artists?direction=MOTION" className={styles.productCard}>
                <div className={styles.productImage}>
                  🎬
                </div>
                <div className={styles.productContent}>
                  <h3 className={styles.productTitle}>Моушн-дизайн</h3>
                  <p className={styles.productText}>
                    Анимация и динамическая графика
                  </p>
                </div>
              </Link>

              <Link href="/artists?direction=MODELING_3D" className={styles.productCard}>
                <div className={styles.productImage}>
                  🧊
                </div>
                <div className={styles.productContent}>
                  <h3 className={styles.productTitle}>3D-моделинг</h3>
                  <p className={styles.productText}>
                    Объемное моделирование и скульптинг
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section className={styles.featuredSection}>
          <div className={styles.featuredContainer}>
            <div className={styles.featuredGrid}>
              <div className={styles.featuredCard}>
                <h2 className={styles.featuredCardTitle}>О сообществе СТЛ</h2>
                <p className={styles.featuredCardText}>
                  Мы создали пространство для творческих профессионалов, где минималистичный подход к дизайну
                  сочетается с максимальной функциональностью и вдохновением.
                </p>
                <Link href="/artists" className={styles.featuredButton}>
                  Все художники
                </Link>
              </div>
              <div className={styles.featuredImage}>
                🖼️
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles.statsSection}>
          <div className={styles.statsContainer}>
            <h2 className={styles.statsTitle}>СТЛ в цифрах</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stats.totalArtists}+</div>
                <p className={styles.statLabel}>Художников</p>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stats.totalWorks}+</div>
                <p className={styles.statLabel}>Работ</p>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stats.totalSpecializations}</div>
                <p className={styles.statLabel}>Специализаций</p>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stats.totalMembers}+</div>
                <p className={styles.statLabel}>Участников</p>
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
