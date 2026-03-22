const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeUserAdmin() {
  try {
    console.log('Searching for user "Cerdex"...');

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'Cerdex' },
          { username: 'cerdex' },
          { username: 'CERDEX' }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      console.log('❌ User "Cerdex" not found in database');
      console.log('\nAvailable users:');
      const allUsers = await prisma.user.findMany({
        select: { username: true, email: true, role: true }
      });
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.email}) - Role: ${u.role}`);
      });
      return;
    }

    console.log(`\nFound user: ${user.username} (${user.email})`);
    console.log(`Current role: ${user.role}`);

    if (user.role === 'ADMIN') {
      console.log('✓ User already has ADMIN role');
      return;
    }

    console.log('\nUpdating role to ADMIN...');
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' }
    });

    console.log('✓ Successfully updated user role to ADMIN');
    console.log(`\nUser ${user.username} now has administrator access`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeUserAdmin();
