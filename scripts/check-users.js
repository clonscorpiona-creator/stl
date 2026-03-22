const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);

    if (userCount === 0) {
      console.log('✓ Database is clean - no users found');
    }
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
