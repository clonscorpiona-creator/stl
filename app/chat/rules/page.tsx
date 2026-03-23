/*
 * 📋 STL Platform - Chat Rules Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-20
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function ChatRulesPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Link href="/chat" className={styles.backLink}>
          ← Вернуться в чат
        </Link>

        <h1 className={styles.title}>Правила чата</h1>
        <p className={styles.subtitle}>
          Пожалуйста, ознакомьтесь с правилами перед использованием чата
        </p>

        <div className={styles.rulesContainer}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Общие правила</h2>
            <ul className={styles.rulesList}>
              <li>Будьте вежливы и уважительны к другим участникам</li>
              <li>Запрещены оскорбления, угрозы и любые формы дискриминации</li>
              <li>Не публикуйте личную информацию других пользователей</li>
              <li>Запрещен спам и флуд</li>
              <li>Не используйте чат для рекламы без разрешения администрации</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Тематические каналы</h2>
            <ul className={styles.rulesList}>
              <li>Общайтесь в соответствующих тематических каналах</li>
              <li>В канале "Общий" можно обсуждать любые темы, связанные с творчеством</li>
              <li>Специализированные каналы (2D, 3D, Motion, Web) предназначены для профессиональных обсуждений</li>
              <li>Не засоряйте каналы офтопиком</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Запрещенный контент</h2>
            <ul className={styles.rulesList}>
              <li>Порнография и контент 18+</li>
              <li>Пропаганда насилия, экстремизма, наркотиков</li>
              <li>Пиратский контент и ссылки на нелегальные ресурсы</li>
              <li>Вредоносные ссылки и файлы</li>
              <li>Политические и религиозные споры</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Использование стикеров</h2>
            <ul className={styles.rulesList}>
              <li>Стикеры должны использоваться уместно</li>
              <li>Не злоупотребляйте стикерами (не более 3 подряд)</li>
              <li>Запрещены оскорбительные или неприличные стикеры</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Модерация</h2>
            <ul className={styles.rulesList}>
              <li>Модераторы и администраторы имеют право удалять сообщения, нарушающие правила</li>
              <li>За нарушение правил может быть выдан бан (временный или постоянный)</li>
              <li>Бан может быть выдан для конкретного канала или для всего чата</li>
              <li>При повторных нарушениях срок бана увеличивается</li>
              <li>Решения модераторов можно обжаловать, написав администрации</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Конструктивное общение</h2>
            <ul className={styles.rulesList}>
              <li>Давайте конструктивную критику работам других участников</li>
              <li>Делитесь опытом и знаниями</li>
              <li>Помогайте новичкам</li>
              <li>Задавайте вопросы и участвуйте в обсуждениях</li>
              <li>Создавайте дружелюбную атмосферу</li>
            </ul>
          </section>

          <section className={styles.warningSection}>
            <h2 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px'}}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Ответственность
            </h2>
            <p className={styles.warningText}>
              Администрация платформы оставляет за собой право изменять правила без предварительного уведомления.
              Незнание правил не освобождает от ответственности за их нарушение.
            </p>
            <p className={styles.warningText}>
              Грубые нарушения правил могут привести к постоянной блокировке аккаунта на платформе.
            </p>
          </section>

          <div className={styles.contactSection}>
            <h3>Есть вопросы?</h3>
            <p>
              Если у вас есть вопросы по правилам или вы хотите сообщить о нарушении,
              свяжитесь с администрацией через <Link href="/contact">форму обратной связи</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
