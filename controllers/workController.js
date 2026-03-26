const { query } = require('../config/database');
const path = require('path');
const fs = require('fs');

module.exports = {
  // Список всех работ (портфолио)
  async index(req, res) {
    const { direction, sort } = req.query;
    const isPjax = req.headers['x-pjax'] === 'true';

    let sql = `
      SELECT w.*, u.username as author_name, u.avatar as author_avatar,
             (SELECT COUNT(*) FROM work_likes WHERE work_id = w.id) as likes_count
      FROM works w
      JOIN users u ON w.user_id = u.id
      WHERE w.status = 'published'
    `;

    const params = [];

    if (direction) {
      sql += ' AND w.direction = ?';
      params.push(direction);
    }

    if (sort === 'likes') {
      sql += ' ORDER BY likes_count DESC, w.created_at DESC';
    } else {
      sql += ' ORDER BY w.created_at DESC';
    }

    const works = await query(sql, params);

    if (isPjax) {
      return res.render('content/portfolio-content', {
        works: works || [],
        currentDirection: direction
      });
    }

    res.render('pages/portfolio', {
      title: 'Портфолио',
      works: works || [],
      currentDirection: direction,
      layout: req.session.layout || 'layout-1',
      pjax: false
    });
  },

  // Страница создания работы
  showCreate(req, res) {
    res.render('pages/work-create', {
      title: 'Новая работа',
      user: req.session.user,
      directions: ['2D', '3D', 'Motion', 'Pixel', 'Illustration', 'Visualization'],
      error: null,
      layout: req.session.layout || 'layout-1'
    });
  },

  // Создание работы
  async create(req, res) {
    const userId = req.session.user.id;
    const { title, description, direction } = req.body;

    // Check for file validation error
    if (req.fileValidationError) {
      return res.render('pages/work-create', {
        title: 'Новая работа',
        user: req.session.user,
        directions: ['2D', '3D', 'Motion', 'Pixel', 'Illustration', 'Visualization'],
        error: req.fileValidationError
      });
    }

    const coverImage = req.file ? `/uploads/works/${req.file.filename}` : null;

    if (!title || !title.trim()) {
      return res.render('pages/work-create', {
        title: 'Новая работа',
        user: req.session.user,
        directions: ['2D', '3D', 'Motion', 'Pixel', 'Illustration', 'Visualization'],
        error: 'Название работы обязательно'
      });
    }

    try {
      const result = await query(
        'INSERT INTO works (user_id, title, description, cover_image, direction, status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, title.trim(), description?.trim() || null, coverImage, direction, 'published']
      );

      res.redirect(`/portfolio/${result.insertId}`);
    } catch (err) {
      console.error('Create work error:', err);
      res.render('pages/work-create', {
        title: 'Новая работа',
        user: req.session.user,
        directions: ['2D', '3D', 'Motion', 'Pixel', 'Illustration', 'Visualization'],
        error: 'Ошибка при создании работы'
      });
    }
  },

  // Просмотр работы
  async show(req, res) {
    const { id } = req.params;
    const isPjax = req.headers['x-pjax'] === 'true';

    const [work] = await query(`
      SELECT w.*, u.username as author_name, u.avatar as author_avatar, u.id as author_id
      FROM works w
      JOIN users u ON w.user_id = u.id
      WHERE w.id = ?
    `, [id]);

    if (!work) {
      return res.status(404).render('errors/404', {
        title: 'Работа не найдена',
        user: req.session.user
      });
    }

    // Увеличиваем счётчик просмотров
    await query('UPDATE works SET views = views + 1 WHERE id = ?', [id]);

    // Получаем медиа
    const media = await query('SELECT * FROM work_media WHERE work_id = ? ORDER BY sort_order', [id]);

    // Получаем лайки
    const [likesData] = await query('SELECT COUNT(*) as count FROM work_likes WHERE work_id = ?', [id]);

    // Проверка, лайкнул ли текущий пользователь
    let isLiked = false;
    if (req.session.user) {
      const [userLike] = await query(
        'SELECT id FROM work_likes WHERE work_id = ? AND user_id = ?',
        [id, req.session.user.id]
      );
      isLiked = !!userLike;
    }

    const content = `
      <div class="work-show-container">
        <div class="work-header">
          <div class="work-author">
            <img src="${work.author_avatar || '/images/default-avatar.png'}" alt="${work.author_name}" class="author-avatar">
            <div class="author-info">
              <h2>${work.author_name}</h2>
              <span class="work-date">${new Date(work.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
          </div>
          <h1 class="work-title">${work.title}</h1>
          <% if (typeof user !== 'undefined' && user && user.id === ${work.author_id}) { %>
            <div class="work-actions">
              <a href="/portfolio/${work.id}/edit" class="btn btn-secondary">Редактировать</a>
              <button class="btn btn-danger" onclick="deleteWork(${work.id})">Удалить</button>
            </div>
          <% } %>
        </div>

        <div class="work-media">
          ${work.cover_image ? `<img src="${work.cover_image}" alt="${work.title}" class="work-cover">` : ''}
        </div>

        ${work.description ? `<div class="work-description">${work.description}</div>` : ''}

        <div class="work-stats">
          <span class="stat">👁️ ${work.views}</span>
          <span class="stat" id="likes-count">❤️ ${likesData.count}</span>
          <button class="btn btn-primary like-btn" data-work-id="${work.id}" data-liked="${isLiked}">
            ${isLiked ? '❤️ Понравилось' : '🤍 Понравилось'}
          </button>
        </div>
      </div>
    `;

    if (isPjax) {
      return res.send(content);
    }

    res.render('pages/work-show', {
      title: work.title,
      work,
      media: media || [],
      likesCount: likesData.count,
      isLiked,
      layout: req.session.layout || 'layout-1'
    });
  },

  // Лайк/анлайк
  async toggleLike(req, res) {
    // Проверка авторизации
    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, error: 'Требуется авторизация' });
    }

    const workId = req.params.id;
    const userId = req.session.user.id;

    try {
      const [existing] = await query(
        'SELECT id FROM work_likes WHERE work_id = ? AND user_id = ?',
        [workId, userId]
      );

      if (existing) {
        await query('DELETE FROM work_likes WHERE work_id = ? AND user_id = ?', [workId, userId]);
      } else {
        await query('INSERT INTO work_likes (work_id, user_id) VALUES (?, ?)', [workId, userId]);
      }

      const [count] = await query('SELECT COUNT(*) as c FROM work_likes WHERE work_id = ?', [workId]);
      res.json({ success: true, likes: count.c, liked: !existing });

    } catch (err) {
      console.error('Toggle like error:', err);
      res.status(500).json({ success: false, error: 'Ошибка' });
    }
  },

  // Страница редактирования
  async showEdit(req, res) {
    const { id } = req.params;
    const userId = req.session.user.id;

    const [work] = await query('SELECT * FROM works WHERE id = ? AND user_id = ?', [id, userId]);

    if (!work) {
      return res.status(404).render('errors/404', {
        title: 'Работа не найдена',
        user: req.session.user
      });
    }

    res.render('pages/work-edit', {
      title: 'Редактировать работу',
      work,
      directions: ['2D', '3D', 'Motion', 'Pixel', 'Illustration', 'Visualization'],
      layout: req.session.layout || 'layout-1'
    });
  },

  // Обновление работы
  async update(req, res) {
    const { id } = req.params;
    const userId = req.session.user.id;
    const { title, description, direction } = req.body;

    const [work] = await query('SELECT * FROM works WHERE id = ? AND user_id = ?', [id, userId]);

    if (!work) {
      return res.status(404).render('errors/404', {
        title: 'Работа не найдена',
        user: req.session.user
      });
    }

    // Check for file validation error
    if (req.fileValidationError) {
      return res.render('pages/work-edit', {
        title: 'Редактировать работу',
        work,
        directions: ['2D', '3D', 'Motion', 'Pixel', 'Illustration', 'Visualization'],
        error: req.fileValidationError
      });
    }

    const coverImage = req.file ? `/uploads/works/${req.file.filename}` : work.cover_image;

    try {
      await query(
        'UPDATE works SET title = ?, description = ?, direction = ?, cover_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title.trim(), description?.trim() || null, direction, coverImage, id]
      );

      res.redirect(`/portfolio/${id}`);
    } catch (err) {
      console.error('Update work error:', err);
      res.render('pages/work-edit', {
        title: 'Редактировать работу',
        work,
        directions: ['2D', '3D', 'Motion', 'Pixel', 'Illustration', 'Visualization'],
        error: 'Ошибка при сохранении'
      });
    }
  },

  // Удаление работы
  async destroy(req, res) {
    const workId = req.params.id;
    const userId = req.session.user.id;

    const [work] = await query('SELECT user_id, cover_image FROM works WHERE id = ?', [workId]);

    if (!work || work.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Нет прав' });
    }

    try {
      await query('DELETE FROM works WHERE id = ?', [workId]);

      // Удаляем обложку
      if (work.cover_image) {
        const filePath = path.join(__dirname, '../public', work.cover_image);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Delete work error:', err);
      res.status(500).json({ success: false, error: 'Ошибка' });
    }
  }
};
