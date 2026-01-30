/**
 * Prisma Seed Script
 * Seeds the database with initial data
 */

import { PrismaClient, UserType, OwnerType, DataType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

// System parameters to seed
const systemParameters = [
  // Logging
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
  // Authentication
  {
    key: 'auth.sessionDuration',
    value: '7d',
    dataType: DataType.STRING,
    ownerType: OwnerType.SYSTEM,
    category: 'auth',
    description: 'JWT token expiration duration (e.g., "7d", "24h", "60m")',
    defaultValue: '7d',
  },
  // Email
  {
    key: 'email.fromAddress',
    value: 'shacoof@gmail.com',
    dataType: DataType.STRING,
    ownerType: OwnerType.SYSTEM,
    category: 'email',
    description: 'Default "from" address for outgoing emails',
    defaultValue: 'noreply@kitchen48.com',
  },
  {
    key: 'email.smtp.host',
    value: 'smtp.gmail.com',
    dataType: DataType.STRING,
    ownerType: OwnerType.SYSTEM,
    category: 'email',
    description: 'SMTP server hostname',
    defaultValue: 'smtp.gmail.com',
  },
  {
    key: 'email.smtp.port',
    value: '587',
    dataType: DataType.NUMBER,
    ownerType: OwnerType.SYSTEM,
    category: 'email',
    description: 'SMTP server port (typically 587 for TLS, 465 for SSL)',
    defaultValue: '587',
  },
  {
    key: 'email.smtp.user',
    value: 'shacoof@gmail.com',
    dataType: DataType.STRING,
    ownerType: OwnerType.SYSTEM,
    category: 'email',
    description: 'SMTP authentication username',
    defaultValue: '',
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

async function seedMasterIngredients() {
  console.log('Seeding master ingredients...');

  // Read ingredients from file
  const ingredientsPath = resolve(__dirname, '../../misc/ingredients.txt');
  let ingredientsText: string;

  try {
    ingredientsText = readFileSync(ingredientsPath, 'utf-8');
  } catch (error) {
    console.log('  Warning: ingredients.txt not found, skipping...');
    return;
  }

  // Parse unique ingredients (lowercase, trimmed, no empty lines)
  const ingredientNames = [...new Set(
    ingredientsText
      .split('\n')
      .map(line => line.trim().toLowerCase())
      .filter(line => line.length > 0)
  )];

  console.log(`  Found ${ingredientNames.length} unique ingredients`);

  let created = 0;
  let skipped = 0;

  for (const name of ingredientNames) {
    try {
      await prisma.masterIngredient.upsert({
        where: { name },
        update: {}, // Don't update if exists
        create: {
          name,
          isActive: true,
        },
      });
      created++;
    } catch (error) {
      // Skip duplicates or other errors
      skipped++;
    }
  }

  console.log(`  Created ${created} ingredients, skipped ${skipped}`);
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
  await seedMasterIngredients();

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
