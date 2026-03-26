const { query } = require('../config/database');

module.exports = {
  // Get all settings as object
  async getAll() {
    const rows = await query('SELECT * FROM settings');
    const settings = {};
    for (const row of rows) {
      settings[row.key] = this.parseValue(row.value, row.type);
    }
    return settings;
  },

  // Get single setting
  async get(key) {
    const [row] = await query('SELECT * FROM settings WHERE key = ?', [key]);
    return row ? this.parseValue(row.value, row.type) : null;
  },

  // Update setting
  async set(key, value, type = 'string') {
    const serialized = this.serializeValue(value, type);
    await query(
      'INSERT OR REPLACE INTO settings (key, value, type, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [key, serialized, type]
    );
  },

  // Helper functions
  parseValue(value, type) {
    if (type === 'number') return Number(value);
    if (type === 'boolean') return value === 'true';
    if (type === 'json') return JSON.parse(value);
    return value;
  },

  serializeValue(value, type) {
    if (type === 'json') return JSON.stringify(value);
    if (type === 'boolean') return value ? 'true' : 'false';
    return String(value);
  }
};
