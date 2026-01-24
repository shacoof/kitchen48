/**
 * Prisma Seed Script
 * Seeds the database with initial data
 */

import { PrismaClient, UserType, OwnerType, DataType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

// System parameters to seed
const systemParameters = [
  {
    key: 'system.logging.console.minLevel',
    value: 'error',
    dataType: DataType.STRING,
    ownerType: OwnerType.SYSTEM,
    category: 'logging',
    description: 'Minimum severity level for console output (debug, warning, error)',
    defaultValue: 'error',
  },
  {
    key: 'system.logging.timezone',
    value: 'Asia/Jerusalem',
    dataType: DataType.STRING,
    ownerType: OwnerType.SYSTEM,
    category: 'logging',
    description: 'Timezone for log timestamps (IANA timezone identifier)',
    defaultValue: 'Asia/Jerusalem',
  },
];

async function seedParameters() {
  console.log('Seeding system parameters...');

  for (const param of systemParameters) {
    const existing = await prisma.parameter.findFirst({
      where: {
        key: param.key,
        ownerType: param.ownerType,
        ownerId: null,
      },
    });

    if (existing) {
      console.log(`  Parameter "${param.key}" already exists, skipping...`);
    } else {
      await prisma.parameter.create({
        data: param,
      });
      console.log(`  Created parameter: ${param.key}`);
    }
  }
}

async function seedAdminUser() {
  console.log('Seeding admin user...');

  // Create default admin user
  const adminEmail = 'shacoof@gmail.com';
  const adminPassword = 'k48shacoof';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`  Admin user ${adminEmail} already exists. Updating to admin role...`);
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
    console.log(`  Created admin user: ${adminEmail}`);
  }
}

async function main() {
  console.log('Seeding database...');

  await seedAdminUser();
  await seedParameters();

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
