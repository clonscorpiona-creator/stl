/*
 * 📜 STL Platform - Rules Page
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import Link from "next/link";
import styles from "./page.module.css";
import ThemeSwitcher from "../components/ThemeSwitcher";

export default function RulesPage() {
  const rules = [
    {
      id: 1,
      title: "Уважение к участникам",
      description: "Относитесь к другим участникам сообщества с уважением. Запрещены оскорбления, травля и любые формы дискриминации."
    },
    {
      id: 2,
      title: "Качество контента",
      description: "Публикуйте только свои работы или работы с разрешения автора. Указывайте источники и авторство при необходимости."
    },
    {
      id: 3,
      title: "Конструктивная критика",
      description: "Критика должна быть конструктивной и направленной на улучшение работы. Избегайте необоснованных негативных комментариев."
    },
    {
      id: 4,
      title: "Запрещенный контент",
      description: "Запрещено размещение контента для взрослых, насилия, пропаганды, спама и рекламы без согласования с администрацией."
    },
    {
      id: 5,
      title: "Авторские права",
      description: "Уважайте авторские права. Не используйте чужие работы без разрешения. Плагиат строго запрещен."
    },
    {
      id: 6,
      title: "Помощь новичкам",
      description: "Помогайте новым участникам сообщества. Делитесь знаниями и опытом, создавайте дружелюбную атмосферу."
    },
    {
      id: 7,
      title: "Соблюдение тематики",
      description: "Публикуйте контент, соответствующий тематике платформы: графика, дизайн, 3D-моделирование, визуализация."
    },
    {
      id: 8,
      title: "Ответственность",
      description: "Вы несете ответственность за свои публикации и комментарии. Администрация оставляет за собой право модерировать контент."
    }
  ];

  return (
    <div className={styles.page}>
      <ThemeSwitcher />
      <main className={styles.main}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>
            ← Главная
          </Link>
          <h1 className={styles.title}>Правила сообщества</h1>
          <p className={styles.subtitle}>Основные принципы и нормы поведения</p>
        </header>

        <div className={styles.intro}>
          <p>
            Добро пожаловать в сообщество творческих людей! Эти правила созданы для того, 
            чтобы сделать наше сообщество комфортным и продуктивным для всех участников.
          </p>
        </div>

        <div className={styles.rulesGrid}>
          {rules.map((rule) => (
            <div key={rule.id} className={styles.ruleCard}>
              <div className={styles.ruleNumber}>{rule.id}</div>
              <h3 className={styles.ruleTitle}>{rule.title}</h3>
              <p className={styles.ruleDescription}>{rule.description}</p>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <p>
            Нарушение правил может привести к предупреждению, временной блокировке или 
            удалению из сообщества в зависимости от серьезности нарушения.
          </p>
          <p>
            Если у вас есть вопросы по правилам или вы хотите сообщить о нарушении, 
            свяжитесь с администрацией через <Link href="/contact">страницу контактов</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
