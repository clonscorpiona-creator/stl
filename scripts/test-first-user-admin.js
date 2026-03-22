const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFirstUserAdmin() {
  try {
    console.log('Testing first user admin assignment...\n');

    // Check current user count
    const userCount = await prisma.user.count();
    console.log(`Current users in database: ${userCount}`);

    if (userCount > 0) {
      console.log('\n⚠️  Database already has users. First user admin logic will not trigger.');
      console.log('To test, delete all users first with: node scripts/delete-all-users.js\n');

      // Show existing users and their roles
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      console.log('Existing users:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.username} (${user.email}) - Role: ${user.role}`);
      });
    } else {
      console.log('\n✓ Database is empty. Next registered user will become ADMIN.');
      console.log('Register a user at: http://localhost:3001/auth/register\n');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFirstUserAdmin();
