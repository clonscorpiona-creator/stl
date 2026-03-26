const { query } = require('../config/database');

module.exports = {
  async chatPage(req, res) {
    try {
      const channels = await query('SELECT * FROM channels ORDER BY id');
      const currentChannel = channels[0] || null;

      console.log('[ChatController] User:', req.session.user);
      console.log('[ChatController] Channels:', channels.length);
      console.log('[ChatController] Current channel:', currentChannel);

      res.render('pages/chat', {
        title: 'Чат',
        user: req.session.user,
        channels,
        currentChannel,
        pjax: false,
        layout: req.session.layout || 'layout-1'
      });
    } catch (err) {
      console.error('Chat page error:', err);
      res.status(500).render('errors/500', {
        title: 'Ошибка',
        user: req.session.user
      });
    }
  },

  async channelPage(req, res) {
    try {
      const { slug } = req.params;

      // Получаем все каналы
      const channels = await query('SELECT * FROM channels ORDER BY id');

      // Находим текущий канал
      const currentChannel = channels.find(c => c.slug === slug) || channels[0];

      if (!currentChannel) {
        return res.status(404).render('errors/404', {
          title: 'Канал не найден',
          user: req.session.user
        });
      }

      res.render('pages/chat', {
        title: `Чат - ${currentChannel.name}`,
        user: req.session.user,
        channels,
        currentChannel,
        pjax: false,
        layout: req.session.layout || 'layout-1'
      });
    } catch (err) {
      console.error('Channel page error:', err);
      res.status(500).render('errors/500', {
        title: 'Ошибка',
        user: req.session.user
      });
    }
  },

  async getMessages(req, res) {
    try {
      const { channelId } = req.params;

      const messages = await query(
        `SELECT m.*, u.username as author
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.channel_id = ? AND m.deleted = 0
         ORDER BY m.created_at ASC
         LIMIT 100`,
        [channelId]
      );

      res.json({ success: true, messages });
    } catch (err) {
      console.error('Get messages error:', err);
      res.status(500).json({ success: false, error: 'Ошибка получения сообщений' });
    }
  },

  async sendMessage(req, res) {
    try {
      const { channelId } = req.params;
      const { content, type = 'TEXT' } = req.body;
      const userId = req.session.user.id;

      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, error: 'Пустое сообщение' });
      }

      const result = await query(
        'INSERT INTO messages (channel_id, user_id, content, type) VALUES (?, ?, ?, ?)',
        [channelId, userId, content, type]
      );

      const messages = await query(
        'SELECT m.*, u.username as author FROM messages m JOIN users u ON m.user_id = u.id WHERE m.id = ?',
        [result.insertId]
      );

      const message = messages[0];

      // Отправляем событие в Socket.io
      const io = req.app.get('io');
      io.to(channelId.toString()).emit('new-message', message);

      res.json({ success: true, message });
    } catch (err) {
      console.error('Send message error:', err);
      res.status(500).json({ success: false, error: 'Ошибка отправки сообщения' });
    }
  }
};
