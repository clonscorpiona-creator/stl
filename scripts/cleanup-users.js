const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true
    }
  });

  console.log('Current users:');
  console.log(JSON.stringify(users, null, 2));

  // Find Cerdex user
  const cerdexUser = users.find(u => u.username.toLowerCase() === 'cerdex');

  if (!cerdexUser) {
    console.log('\nCerdex user not found!');
    return;
  }

  console.log(`\nKeeping user: ${cerdexUser.username} (${cerdexUser.email})`);

  // Delete all users except Cerdex
  const usersToDelete = users.filter(u => u.id !== cerdexUser.id);

  if (usersToDelete.length === 0) {
    console.log('\nNo other users to delete.');
    return;
  }

  console.log(`\nDeleting ${usersToDelete.length} users...`);

  for (const user of usersToDelete) {
    await prisma.user.delete({
      where: { id: user.id }
    });
    console.log(`Deleted: ${user.username} (${user.email})`);
  }

  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
