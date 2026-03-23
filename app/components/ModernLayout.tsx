/*
 * 🏠 STL Platform - Modern Dark Blue Layout
 * 📦 Version: 3.0.0
 * 📅 Created: 2026-03-22
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import Link from "next/link";
import styles from "./page-modern.module.css";
import StlLogo from "./StlLogo";
import ClockCalendar from "./ClockCalendar";
import HeroButtons from "./HeroButtons";
import Header from "./Header";
import Footer from "./Footer";
import { PaletteIcon, VideoIcon, CubeIcon, PeopleIcon, HeartIcon } from "./Icons";

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

export default async function ModernLayout() {
  const stats = await getStats();

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.heroLeft}>
            <StlLogo />
          </div>
          <div className={styles.heroCenter}>
            <span className={styles.heroLabel}>Творческое сообщество</span>
            <h1 className={styles.heroTitle}>
              Вдохновлены творчеством. Заряжены идеями
            </h1>
            <p className={styles.heroText}>
              Платформа для художников, дизайнеров и 3D-специалистов, где рождаются шедевры
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

        {/* Why Choose Us Section */}
        <section className={styles.whySection}>
          <div className={styles.whyContainer}>
            <h2 className={styles.whyTitle}>Почему выбирают нас?</h2>
            <div className={styles.whyGrid}>
              <div className={styles.whyCard}>
                <div className={styles.whyIcon}><PaletteIcon color="#1565c0" size={56} /></div>
                <h3 className={styles.whyCardTitle}>Высокое качество работ</h3>
                <p className={styles.whyCardText}>
                  Наше сообщество объединяет профессионалов, создающих работы мирового уровня
                </p>
              </div>

              <div className={styles.whyCard}>
                <div className={styles.whyIcon}><PeopleIcon color="#1565c0" size={56} /></div>
                <h3 className={styles.whyCardTitle}>Профессиональные художники</h3>
                <p className={styles.whyCardText}>
                  Опытные специалисты с портфолио, которые оставляют след в сердцах зрителей
                </p>
              </div>

              <div className={styles.whyCard}>
                <div className={styles.whyIcon}><HeartIcon color="#1565c0" size={56} /></div>
                <h3 className={styles.whyCardTitle}>Дружелюбная атмосфера</h3>
                <p className={styles.whyCardText}>
                  Создаём незабываемый опыт взаимодействия, который остаётся в памяти надолго
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className={styles.missionSection}>
          <div className={styles.missionContainer}>
            <div className={styles.missionHeader}>
              <h2 className={styles.missionTitle}>Наши направления</h2>
              <div className={styles.missionTabs}>
                <span className={styles.missionTab}>Популярные</span>
                <span className={styles.missionTab}>Новинки</span>
                <span className={styles.missionTab}>Специальные</span>
              </div>
            </div>

            <div className={styles.missionGrid}>
              <div className={styles.missionCard}>
                <div className={styles.missionCardImage} style={{background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <PaletteIcon color="#fff" size={80} />
                </div>
                <div className={styles.missionCardContent}>
                  <h3 className={styles.missionCardTitle}>Графический дизайн</h3>
                  <p className={styles.missionCardSubtitle}>Креативность и стиль</p>
                  <div className={styles.missionCardFooter}>
                    <span className={styles.missionCardPrice}>{stats.totalArtists}+</span>
                    <Link href="/artists?direction=GRAPHIC_DESIGN" className={styles.missionCardButton}>
                      Смотреть
                    </Link>
                  </div>
                </div>
              </div>

              <div className={styles.missionCard}>
                <div className={styles.missionCardImage} style={{background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <VideoIcon color="#fff" size={80} />
                </div>
                <div className={styles.missionCardContent}>
                  <h3 className={styles.missionCardTitle}>Моушн-дизайн</h3>
                  <p className={styles.missionCardSubtitle}>Анимация и движение</p>
                  <div className={styles.missionCardFooter}>
                    <span className={styles.missionCardPrice}>{Math.floor(stats.totalArtists * 0.4)}+</span>
                    <Link href="/artists?direction=MOTION" className={styles.missionCardButton}>
                      Смотреть
                    </Link>
                  </div>
                </div>
              </div>

              <div className={styles.missionCard}>
                <div className={styles.missionCardImage} style={{background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <CubeIcon color="#fff" size={80} />
                </div>
                <div className={styles.missionCardContent}>
                  <h3 className={styles.missionCardTitle}>3D-моделинг</h3>
                  <p className={styles.missionCardSubtitle}>Объём и реализм</p>
                  <div className={styles.missionCardFooter}>
                    <span className={styles.missionCardPrice}>{Math.floor(stats.totalArtists * 0.3)}+</span>
                    <Link href="/artists?direction=MODELING_3D" className={styles.missionCardButton}>
                      Смотреть
                    </Link>
                  </div>
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
