const { query } = require('../config/database');

const VALID_LAYOUTS = ['layout-1', 'layout-2', 'layout-3', 'layout-4', 'layout-5'];

module.exports = {
  async setLayout(req, res) {
    const { layout } = req.body;

    if (!VALID_LAYOUTS.includes(layout)) {
      return res.status(400).json({ success: false, error: 'Неверный макет' });
    }

    try {
      // Сохранение в сессии
      req.session.layout = layout;

      // Сохранение в БД для постоянства
      if (req.session.user) {
        await query(
          'UPDATE users SET layout_preference = ? WHERE id = ?',
          [layout, req.session.user.id]
        );
      }

      res.json({ success: true, layout });
    } catch (err) {
      console.error('Set layout error:', err);
      res.status(500).json({ success: false, error: 'Ошибка сохранения макета' });
    }
  },

  async getLayout(req, res) {
    const layout = req.session.layout || 'layout-1';
    res.json({ success: true, layout });
  }
};
