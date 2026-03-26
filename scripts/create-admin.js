const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const result = await query(
      "INSERT INTO users (email, password, username, role) VALUES (?, ?, ?, ?)",
      ['admin@stl.local', hashedPassword, 'AdminUser', 'ADMIN']
    );

    console.log('Admin user created successfully:');
    console.log('  Email: admin@stl.local');
    console.log('  Password: admin123');
    console.log('  Username: AdminUser');
    console.log('  Role: ADMIN');
    console.log('  User ID:', result.insertId);

    process.exit(0);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      console.log('User already exists. Updating to ADMIN...');

      const users = await query('SELECT id FROM users WHERE email = ?', ['admin@stl.local']);
      if (users.length > 0) {
        await query("UPDATE users SET role = 'ADMIN' WHERE email = ?", ['admin@stl.local']);
        console.log('User admin@stl.local is now ADMIN');
      }
      console.log('\nLogin credentials:');
      console.log('  Email: admin@stl.local');
      console.log('  Password: admin123');
    } else {
      console.error('Error:', err);
    }
    process.exit(1);
  }
}

createAdmin();
