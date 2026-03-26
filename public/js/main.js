// Основная логика приложения
document.addEventListener('DOMContentLoaded', function() {
  // Активные ссылки навигации
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.main-nav a, .sidebar-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
      link.classList.add('active');
    }
  });

  // Автоскрытие алертов
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 500);
    }, 5000);
  });
});
