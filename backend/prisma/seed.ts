/**
 * Prisma Seed Script
 * Seeds the database with initial data
 */

import { PrismaClient, UserType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  console.log('Seeding database...');

  // Create default admin user
  const adminEmail = 'shacoof@gmail.com';
  const adminPassword = 'k48shacoof';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`Admin user ${adminEmail} already exists. Updating to admin role...`);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { userType: UserType.admin },
    });
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        emailVerified: true,
        userType: UserType.admin,
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
