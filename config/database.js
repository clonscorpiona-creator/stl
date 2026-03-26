const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(path.join(__dirname, '../data/stl.db'), (err) => {
      if (err) {
        console.error('Database connection failed:', err.message);
      } else {
        console.log('Connected to SQLite database');
      }
    });
  }
  return db;
}

// Инициализация таблиц
async function initTables() {
  const database = getDb();

  // Добавляем колонку avatar, если её нет
  await new Promise((resolve) => {
    database.run('ALTER TABLE users ADD COLUMN avatar TEXT', (err) => {
      if (err) {
        // Колонка уже существует - это нормально
        console.log('Avatar column already exists or added');
      } else {
        console.log('Avatar column added');
      }
      resolve();
    });
  });

  const tables = `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string',
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'USER',
      layout_preference TEXT DEFAULT 'layout-1',
      avatar TEXT,
      email_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'TEXT',
      deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      expires DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      direction TEXT,
      status TEXT DEFAULT 'published',
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS work_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS work_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(work_id, user_id),
      FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  return new Promise((resolve, reject) => {
    database.exec(tables, (err) => {
      if (err) {
        console.error('Error creating tables:', err);
        reject(err);
      } else {
        console.log('Tables initialized');

        // Создаём дефолтные каналы
        const defaultChannels = [
          { name: 'Общий', slug: 'general', description: 'Общий чат для всех' },
          { name: 'Творчество', slug: 'creative', description: 'Обсуждение творческих работ' },
          { name: 'Музыка', slug: 'music', description: 'Музыкальные обсуждения' }
        ];

        let channelsCompleted = 0;
        defaultChannels.forEach(channel => {
          database.run(
            'INSERT OR IGNORE INTO channels (name, slug, description) VALUES (?, ?, ?)',
            [channel.name, channel.slug, channel.description],
            (err) => {
              channelsCompleted++;
              if (channelsCompleted === defaultChannels.length) {
                console.log('Default channels created');
                // После каналов создаём настройки
                initSettings(database, resolve);
              }
            }
          );
        });
      }
    });
  });
}

// Инициализация таблицы настроек
function initSettings(database, callback) {
  const defaultSettings = [
    { key: 'site_name', value: 'STL - Сообщество творческих людей', type: 'string', description: 'Название сайта' },
    { key: 'header_text', value: 'Добро пожаловать!', type: 'string', description: 'Приветственный текст в шапке' },
    { key: 'footer_text', value: 'Все права защищены', type: 'string', description: 'Текст в футере' },
    { key: 'max_file_size_mb', value: '10', type: 'number', description: 'Максимальный размер файла в МБ' },
    { key: 'active_modules', value: '["chat"]', type: 'json', description: 'Активные модули' }
  ];

  let settingsCompleted = 0;
  defaultSettings.forEach(setting => {
    database.run(
      'INSERT OR IGNORE INTO settings (key, value, type, description) VALUES (?, ?, ?, ?)',
      [setting.key, setting.value, setting.type, setting.description],
      (err) => {
        settingsCompleted++;
        if (settingsCompleted === defaultSettings.length) {
          console.log('Default settings created');
          if (callback) callback();
        }
      }
    );
  });
}

// Промисификация query
function query(sql, params = []) {
  const database = getDb();
  return new Promise((resolve, reject) => {
    if (sql.trim().toUpperCase().startsWith('INSERT') || sql.trim().toUpperCase().startsWith('UPDATE') || sql.trim().toUpperCase().startsWith('DELETE')) {
      database.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ insertId: this.lastID, changes: this.changes });
      });
    } else {
      database.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);  // Возвращаем просто rows, а не [rows]
      });
    }
  });
}

module.exports = { getDb, initTables, query };
