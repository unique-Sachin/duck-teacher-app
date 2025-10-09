import { prisma } from '../src/lib/prisma';

async function setAdminRole() {
  const adminEmail = 'sachin.mern@gmail.com';
  
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (user) {
      // Update existing user to admin
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'ADMIN' },
      });
      console.log(`✅ User ${adminEmail} has been set as ADMIN`);
    } else {
      console.log(`⚠️  User ${adminEmail} not found in database`);
      console.log('The user will be automatically set as ADMIN when they sign up');
    }
  } catch (error) {
    console.error('Error setting admin role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminRole();
