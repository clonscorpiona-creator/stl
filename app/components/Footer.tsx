/*
 * 🦶 STL Platform - Footer Component
 * 📦 Version: CreoArt
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

export default function Footer() {
  return (
    <footer>
      <div className="app-container">
        <div className="footer-left">
          <div className="footer-info">
            <div className="footer-year">2026 СТЛ - Сообщество творческих людей</div>
            <div className="footer-credits">Разработка и дизайн: CERDEX & Claude (Anthropic)</div>
          </div>
        </div>
        <div className="footer-center">
          <nav className="footer-nav">
            <a href="#about" className="footer-link">О нас</a>
            <a href="#services" className="footer-link">Услуги</a>
            <a href="#portfolio" className="footer-link">Портфолио</a>
            <a href="#contact" className="footer-link">Контакты</a>
            <a href="#privacy" className="footer-link">Конфиденциальность</a>
          </nav>
        </div>
        <div className="footer-right">
          <div className="footer-social">
            <a href="#" className="social-link" aria-label="VK">VK</a>
            <a href="#" className="social-link" aria-label="Telegram">TG</a>
            <a href="#" className="social-link" aria-label="Instagram">IG</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
