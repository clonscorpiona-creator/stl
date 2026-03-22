const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllUsers() {
  try {
    console.log('Deleting all users...');

    const result = await prisma.user.deleteMany({});

    console.log(`Successfully deleted ${result.count} users`);
    console.log('All related data has been cascade deleted');
  } catch (error) {
    console.error('Error deleting users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllUsers();
