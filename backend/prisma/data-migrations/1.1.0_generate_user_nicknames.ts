/**
 * Data Migration: Generate nicknames for existing users
 *
 * Database Version: 1.1.0
 *
 * This migration generates nicknames for all existing users who don't have one.
 * Nicknames are created from: first letter of firstName + full lastName (lowercase)
 * If collision, appends incrementing number (jsmith, jsmith2, jsmith3)
 *
 * SAFE: This migration only ADDS data, never deletes or overwrites existing nicknames.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const version = '1.1.0';
export const description = 'Generate nicknames for existing users without one';

/**
 * Generate a unique nickname for a user
 */
async function generateNickname(firstName: string | null, lastName: string | null, email: string): Promise<string> {
  // Build base nickname
  let base: string;

  if (firstName && lastName) {
    // First letter of firstName + full lastName, lowercase, alphanumeric only
    base = (firstName[0] + lastName).toLowerCase().replace(/[^a-z0-9]/g, '');
  } else if (firstName) {
    base = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
  } else if (lastName) {
    base = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
  } else {
    // Fallback to email prefix
    base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Ensure minimum length
  if (base.length < 3) {
    base = base + 'user';
  }

  // Ensure starts with letter
  if (!/^[a-z]/.test(base)) {
    base = 'u' + base;
  }

  // Truncate if too long
  base = base.substring(0, 25);

  // Check for uniqueness and add number suffix if needed
  let nickname = base;
  let counter = 2;

  while (await prisma.user.findUnique({ where: { nickname } })) {
    nickname = `${base}${counter}`;
    counter++;

    // Safety limit
    if (counter > 1000) {
      nickname = `${base}${Date.now()}`;
      break;
    }
  }

  return nickname;
}

export async function run(): Promise<void> {
  console.log('Starting nickname generation for existing users...');

  // Find users without nicknames
  const usersWithoutNickname = await prisma.user.findMany({
    where: { nickname: null },
    select: { id: true, firstName: true, lastName: true, email: true }
  });

  console.log(`Found ${usersWithoutNickname.length} users without nicknames`);

  if (usersWithoutNickname.length === 0) {
    console.log('No users need nickname generation. Migration complete.');
    return;
  }

  // Process each user
  let successCount = 0;
  let errorCount = 0;

  for (const user of usersWithoutNickname) {
    try {
      const nickname = await generateNickname(user.firstName, user.lastName, user.email);

      await prisma.user.update({
        where: { id: user.id },
        data: { nickname }
      });

      console.log(`  Generated nickname "${nickname}" for user ${user.email}`);
      successCount++;
    } catch (error) {
      console.error(`  Failed to generate nickname for user ${user.email}:`, error);
      errorCount++;
    }
  }

  console.log(`Nickname generation complete: ${successCount} success, ${errorCount} errors`);

  if (errorCount > 0) {
    throw new Error(`${errorCount} users failed nickname generation`);
  }
}
