const Settings = require('../models/Settings');
const { query } = require('../config/database');
const path = require('path');
const fs = require('fs');

module.exports = {
  // Dashboard
  async dashboard(req, res) {
    const stats = {
      users: await query('SELECT COUNT(*) as count FROM users'),
      works: await query('SELECT COUNT(*) as count FROM works'),
      messages: await query('SELECT COUNT(*) as count FROM messages')
    };

    res.render('admin/dashboard', {
      title: 'Админ-панель',
      stats,
      flash: req.session.flash || null,
      settings: req.appSettings
    });

    req.session.flash = null; // Clear flash after rendering
  },

  // Get settings page
  async getSettings(req, res) {
    const settingsList = await query('SELECT * FROM settings ORDER BY key');
    res.render('admin/settings', {
      title: 'Настройки сайта',
      settings: settingsList,
      flash: req.session.flash || null
    });
    req.session.flash = null;
  },

  // Save settings
  async saveSettings(req, res) {
    try {
      for (const [key, value] of Object.entries(req.body)) {
        if (key.startsWith('_')) continue; // Skip form metadata
        const type = req.body[`_type_${key}`] || 'string';
        await Settings.set(key, value, type);
      }

      // Clear module cache if modules changed
      if (req.body.active_modules) {
        // Trigger module reload
        await reloadModules();
      }

      req.session.flash = { success: 'Настройки сохранены' };
      res.redirect('/admin/settings');
    } catch (err) {
      req.session.flash = { error: 'Ошибка сохранения: ' + err.message };
      res.redirect('/admin/settings');
    }
  },

  // Get modules page
  async getModules(req, res) {
    const availableModules = await scanModules();
    const activeModules = req.appSettings.active_modules || [];

    const modules = availableModules.map(mod => ({
      id: mod,
      name: mod.charAt(0).toUpperCase() + mod.slice(1),
      path: `modules/${mod}`,
      active: activeModules.includes(mod)
    }));

    res.render('admin/modules', {
      title: 'Управление модулями',
      modules,
      flash: req.session.flash || null
    });
    req.session.flash = null;
  },

  // Toggle module
  async toggleModule(req, res) {
    const { moduleId } = req.params;
    const { action } = req.body; // 'enable' or 'disable'

    let activeModules = req.appSettings.active_modules || [];

    if (action === 'enable') {
      if (!activeModules.includes(moduleId)) {
        activeModules.push(moduleId);
      }
    } else {
      activeModules = activeModules.filter(m => m !== moduleId);
    }

    await Settings.set('active_modules', activeModules, 'json');
    await reloadModules();

    res.json({ success: true, activeModules });
  },

  // List users
  async listUsers(req, res) {
    const users = await query(
      'SELECT id, email, username, role, created_at FROM users ORDER BY id'
    );
    res.render('admin/users', {
      title: 'Пользователи',
      users,
      flash: req.session.flash || null
    });
    req.session.flash = null;
  },

  // Change user role
  async changeUserRole(req, res) {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'USER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ success: true });
  }
};

// Scan modules directory for available modules
async function scanModules() {
  const modulesDir = path.join(__dirname, '../modules');
  try {
    const items = await fs.promises.readdir(modulesDir);
    const dirs = [];
    for (const item of items) {
      const stat = await fs.promises.stat(path.join(modulesDir, item));
      if (stat.isDirectory()) {
        dirs.push(item);
      }
    }
    return dirs;
  } catch (err) {
    // Modules directory doesn't exist yet
    return [];
  }
}

// Reload active modules (for hot-reload without restart)
async function reloadModules() {
  // This could emit an event to notify the app to reload module configurations
  // For now, the settings cache will refresh on next request (5 second TTL)
}
