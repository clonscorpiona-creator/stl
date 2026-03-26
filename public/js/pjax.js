/**
 * PJAX - динамическая загрузка контента
 * Загружает только основной контент без header/footer
 */
(function() {
  // История переходов
  let currentUrl = window.location.pathname;

  // Инициализация
  document.addEventListener('DOMContentLoaded', function() {
    // Перехват кликов по ссылкам
    document.body.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');

      // Игнорируем внешние ссылки, якоря, специальные ссылки
      if (!href ||
          href.startsWith('#') ||
          href.startsWith('http') ||
          href.startsWith('//') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          link.hasAttribute('download') ||
          link.hasAttribute('data-no-pjax')) {
        return;
      }

      // Только внутренние ссылки
      if (href.startsWith('/') || href.startsWith(window.location.origin)) {
        e.preventDefault();
        loadPage(href, link);
      }
    });

    // Обработка кнопки "назад/вперёд"
    window.addEventListener('popstate', function(e) {
      if (e.state && e.state.url) {
        loadPage(e.state.url, null, false);
      }
    });
  });

  // Загрузка страницы
  function loadPage(url, link, pushState = true) {
    if (url === currentUrl) return;

    // Показываем индикатор загрузки
    showLoading();

    // Добавляем активный класс ссылке
    if (link) link.classList.add('pjax-loading');

    // Запрос к серверу
    fetch(url, {
      headers: {
        'X-PJAX': 'true',
        'Accept': 'text/html'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(html => {
      // Парсим HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Извлекаем заголовок
      const title = doc.querySelector('title');
      if (title) {
        document.title = title.textContent;
      }

      // Извлекаем основной контент
      const mainContent = doc.querySelector('.main-content') || doc.querySelector('main');
      if (mainContent) {
        const currentMain = document.querySelector('.main-content') || document.querySelector('main');
        if (currentMain) {
          // Плавное обновление контента
          currentMain.style.opacity = '0';
          setTimeout(() => {
            currentMain.innerHTML = mainContent.innerHTML;
            currentMain.style.transition = 'opacity 0.3s';
            currentMain.style.opacity = '1';
          }, 150);
        }
      }

      // Обновляем активные ссылки в навигации
      updateActiveLinks(url);

      // Обновляем URL
      if (pushState) {
        history.pushState({ url: url }, '', url);
      }
      currentUrl = url;

      // Скрываем индикатор
      hideLoading();
      if (link) link.classList.remove('pjax-loading');

      // Скролл вверх
      window.scrollTo(0, 0);

      // Выполняем скрипты из загруженного контента
      executeScripts(doc);

      // Событие для других модулей
      document.dispatchEvent(new CustomEvent('pjax:loaded', { detail: { url } }));
    })
    .catch(error => {
      console.error('PJAX error:', error);
      // Фолбэк на обычную навигацию
      window.location.href = url;
    });
  }

  // Обновление активных ссылок
  function updateActiveLinks(url) {
    document.querySelectorAll('.main-nav a, .sidebar-link, .side-nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === url || (href !== '/' && url.startsWith(href))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Индикатор загрузки
  function showLoading() {
    let indicator = document.getElementById('pjax-loading');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'pjax-loading';
      indicator.innerHTML = '<div class="pjax-spinner"></div>';
      document.body.appendChild(indicator);
    }
    indicator.classList.add('visible');
  }

  function hideLoading() {
    const indicator = document.getElementById('pjax-loading');
    if (indicator) {
      indicator.classList.remove('visible');
    }
  }

  // Выполнение скриптов
  function executeScripts(doc) {
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src) {
        // Внешний скрипт
        const newScript = document.createElement('script');
        newScript.src = script.src;
        document.body.appendChild(newScript);
      } else if (script.type === 'application/json') {
        // JSON скрипт (данные) - пропускаем
      } else {
        // Встроенный скрипт
        const newScript = document.createElement('script');
        if (script.type) newScript.type = script.type;
        newScript.textContent = script.textContent;
        document.body.appendChild(newScript);
      }
    });
  }

  // Экспорт функции для программного вызова
  window.loadPage = loadPage;
})();
