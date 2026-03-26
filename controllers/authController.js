const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

module.exports = {
  async login(req, res) {
    const { email, password } = req.body;
    const error = 'Неверный email или пароль';

    if (!email || !password) {
      return res.render('pages/login', { title: 'Вход', error });
    }

    try {
      const users = await query('SELECT * FROM users WHERE email = ?', [email]);

      if (!users || users.length === 0) {
        return res.render('pages/login', { title: 'Вход', error });
      }

      const user = users[0];
      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        return res.render('pages/login', { title: 'Вход', error });
      }

      // Создание сессии
      req.session.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        layout: user.layout_preference || 'layout-1'
      };

      // Сохраняем выбранный макет из профиля
      if (user.layout_preference) {
        req.session.layout = user.layout_preference;
      }

      // Сохраняем сессию перед редиректом
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        }
        res.redirect('/profile');
      });
    } catch (err) {
      console.error('Login error:', err);
      res.render('pages/login', { title: 'Вход', error: 'Ошибка сервера' });
    }
  },

  async register(req, res) {
    const { email, password, username } = req.body;

    // Валидация
    if (!email || !password || !username) {
      return res.render('pages/register', {
        title: 'Регистрация',
        error: 'Все поля обязательны',
        success: null
      });
    }

    if (password.length < 6) {
      return res.render('pages/register', {
        title: 'Регистрация',
        error: 'Пароль должен быть не менее 6 символов',
        success: null
      });
    }

    try {
      // Проверка существующего пользователя
      const existing = await query(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [email, username]
      );

      if (existing.length > 0) {
        return res.render('pages/register', {
          title: 'Регистрация',
          error: 'Email или имя пользователя уже заняты',
          success: null
        });
      }

      // Определение роли (первый пользователь - ADMIN)
      const allUsers = await query('SELECT COUNT(*) as count FROM users');
      const role = allUsers[0].count === 0 ? 'ADMIN' : 'USER';

      // Хеширование пароля
      const hashed = await bcrypt.hash(password, 10);

      // Создание пользователя
      await query(
        'INSERT INTO users (email, password, username, role) VALUES (?, ?, ?, ?)',
        [email, hashed, username, role]
      );

      res.render('pages/register', {
        title: 'Регистрация',
        error: null,
        success: 'Аккаунт создан! Теперь вы можете войти.'
      });
    } catch (err) {
      console.error('Register error:', err);
      res.render('pages/register', {
        title: 'Регистрация',
        error: 'Ошибка сервера',
        success: null
      });
    }
  },

  logout(req, res) {
    req.session.destroy((err) => {
      if (err) console.error('Logout error:', err);
      res.redirect('/');
    });
  }
};
