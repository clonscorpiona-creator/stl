import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllUsers() {
  try {
    console.log('Starting user deletion...');

    // Delete all users (cascade should handle related records)
    const result = await prisma.user.deleteMany({});

    console.log(`✅ Successfully deleted ${result.count} users`);
  } catch (error) {
    console.error('❌ Error deleting users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllUsers()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
