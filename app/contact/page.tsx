/*
 * 📧 STL Platform - Contact Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import Link from "next/link";
import styles from "./page.module.css";

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>
            ← Главная
          </Link>
          <h1 className={styles.title}>Контакты</h1>
          <p className={styles.subtitle}>Свяжитесь с нами любым удобным способом</p>
        </header>

        <div className={styles.content}>
          <div className={styles.contactInfo}>
            <div className={styles.infoCard}>
              <div className={styles.iconWrapper}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="8" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M4 10L16 18L28 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Email</h3>
              <a href="mailto:info@stl-community.ru">info@stl-community.ru</a>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.iconWrapper}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M16 9V16L21 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Время работы</h3>
              <p>Пн-Пт: 10:00 - 19:00</p>
              <p>Сб-Вс: Выходной</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.iconWrapper}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 4C13.5 4 11 6 11 9C11 13 16 18 16 18C16 18 21 13 21 9C21 6 18.5 4 16 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="16" cy="9" r="2" fill="currentColor"/>
                </svg>
              </div>
              <h3>Адрес</h3>
              <p>Россия, Москва</p>
              <p>Онлайн-платформа</p>
            </div>
          </div>

          <form className={styles.contactForm}>
            <h2>Напишите нам</h2>
            <div className={styles.formGroup}>
              <label htmlFor="name">Имя</label>
              <input type="text" id="name" name="name" required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="subject">Тема</label>
              <input type="text" id="subject" name="subject" required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="message">Сообщение</label>
              <textarea id="message" name="message" rows={6} required></textarea>
            </div>
            <button type="submit" className={styles.submitButton}>
              Отправить сообщение
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
