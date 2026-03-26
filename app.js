const express = require('express');
const session = require('express-session');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const path = require('path');
const { initTables } = require('./config/database');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/user');
const portfolioRoutes = require('./routes/portfolio');
const adminRoutes = require('./routes/admin');
const layoutMiddleware = require('./middleware/layout');
const settingsMiddleware = require('./middleware/settings');
const { requireAuth } = require('./middleware/auth');

const app = express();

// Настройки EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Cookie parser (required for csurf)
app.use(cookieParser());

// Парсинг форм
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Инициализация БД и сессий
let sessionStore;

async function initializeApp() {
  await initTables();

  // Простая сессия в памяти для разработки
  sessionStore = new session.MemoryStore();

  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    }
  }));

  // CSRF protection - must be after session and body-parser
  const csrfProtection = csurf({ cookie: { httpOnly: true, secure: false } });

  // Исключаем API чата и авторизацию из CSRF
  app.use((req, res, next) => {
    if (req.path.startsWith('/chat/api/') ||
        req.path.startsWith('/auth/login') ||
        req.path.startsWith('/auth/register')) {
      return next();
    }
    csrfProtection(req, res, next);
  });

  // Make CSRF token available in all views (except API endpoints)
  app.use((req, res, next) => {
    if (req.path.startsWith('/chat/api/') ||
        req.path.startsWith('/auth/login') ||
        req.path.startsWith('/auth/register')) {
      // Skip CSRF token for API endpoints and auth
      res.locals.csrfToken = '';
    } else {
      res.locals.csrfToken = req.csrfToken();
    }
    next();
  });

  // Settings middleware (makes settings available in all views)
  app.use(settingsMiddleware);

  // Применение макета ко всем маршрутам
  app.use(layoutMiddleware);

  // Маршруты
  app.use('/auth', authRoutes);
  app.use('/chat', chatRoutes);
  app.use('/user', userRoutes);
  app.use('/portfolio', portfolioRoutes);
  app.use('/admin', adminRoutes);

  // Главная страница
  app.get('/', (req, res) => {
    const isPjax = req.headers['x-pjax'] === 'true';
    res.render('pages/home', {
      title: 'Главная',
      user: req.session.user || null,
      layout: isPjax ? null : (req.session.layout || 'layout-1'),
      pjax: isPjax
    });
  });


  // Профиль (требуется авторизация)
  app.get('/profile', requireAuth, (req, res) => {
    const isPjax = req.headers['x-pjax'] === 'true';
    res.render('pages/profile', {
      title: 'Профиль',
      user: req.session.user,
      layout: isPjax ? null : (req.session.layout || 'layout-1'),
      pjax: isPjax
    });
  });

  // Чат (требуется авторизация) - обрабатывается в chatRoutes
  // app.get('/chat', requireAuth, ...) перемещен в routes/chat.js

  // 404
  app.use((req, res) => {
    res.status(404).render('errors/404', {
      title: 'Страница не найдена',
      user: req.session.user || null
    });
  });

  const PORT = process.env.PORT || 3001;
  console.log(`Server starting on http://localhost:${PORT}`);
  return app;
}

module.exports = { app, initializeApp };
