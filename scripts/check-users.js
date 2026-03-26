const { query } = require('../config/database');

async function checkUsers() {
  try {
    const users = await query('SELECT id, email, username, role FROM users ORDER BY id');

    if (users.length === 0) {
      console.log('No users found. Creating admin user...');

      // Create admin user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);

      const result = await query(
        "INSERT INTO users (email, password, username, role) VALUES (?, ?, ?, ?)",
        ['admin@stl.local', hashedPassword, 'Admin', 'ADMIN']
      );

      console.log('Admin user created:');
      console.log('  Email: admin@stl.local');
      console.log('  Password: admin123');
      console.log('  User ID:', result.insertId);
    } else {
      console.log('Existing users:');
      users.forEach(user => {
        console.log(`  ${user.id}. ${user.username} (${user.email}) - Role: ${user.role}`);
      });

      // Check if any admin exists
      const hasAdmin = users.some(u => u.role === 'ADMIN');
      if (!hasAdmin) {
        console.log('\nNo admin user found. Promoting first user to ADMIN...');

        const result = await query(
          "UPDATE users SET role = 'ADMIN' WHERE id = ?",
          [users[0].id]
        );

        console.log(`User ${users[0].username} promoted to ADMIN`);
      } else {
        console.log('\nAdmin user already exists.');
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers();
