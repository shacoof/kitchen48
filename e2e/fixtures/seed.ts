/**
 * E2E Test Data Seeder
 *
 * Creates test users, recipes, ingredients, and LOV values for E2E tests.
 * Idempotent — safe to run multiple times (uses upserts).
 *
 * Run: cd backend && npx tsx ../e2e/fixtures/seed.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { TEST_USER, ADMIN_USER, OTHER_USER, RECIPES, INGREDIENTS } from '../fixtures/test-data.js';

const prisma = new PrismaClient();
const SALT_ROUNDS = 4; // Low rounds for test speed

async function seed() {
  console.log('🌱 Seeding E2E test data...\n');

  // ── Users ──────────────────────────────────────────────────────────────────

  const testUserHash = await bcrypt.hash(TEST_USER.password, SALT_ROUNDS);
  const adminHash = await bcrypt.hash(ADMIN_USER.password, SALT_ROUNDS);
  const otherHash = await bcrypt.hash(OTHER_USER.password, SALT_ROUNDS);

  const testUser = await prisma.user.upsert({
    where: { email: TEST_USER.email },
    update: { passwordHash: testUserHash, emailVerified: true },
    create: {
      email: TEST_USER.email,
      passwordHash: testUserHash,
      firstName: TEST_USER.firstName,
      lastName: TEST_USER.lastName,
      nickname: TEST_USER.nickname,
      emailVerified: true,
      userType: 'regular',
    },
  });
  console.log(`  ✅ Test user: ${testUser.email} (${testUser.nickname})`);

  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_USER.email },
    update: { passwordHash: adminHash, emailVerified: true, userType: 'admin' },
    create: {
      email: ADMIN_USER.email,
      passwordHash: adminHash,
      firstName: ADMIN_USER.firstName,
      lastName: ADMIN_USER.lastName,
      nickname: ADMIN_USER.nickname,
      emailVerified: true,
      userType: 'admin',
    },
  });
  console.log(`  ✅ Admin user: ${adminUser.email} (${adminUser.nickname})`);

  const otherUser = await prisma.user.upsert({
    where: { email: OTHER_USER.email },
    update: { passwordHash: otherHash, emailVerified: true },
    create: {
      email: OTHER_USER.email,
      passwordHash: otherHash,
      firstName: OTHER_USER.firstName,
      lastName: OTHER_USER.lastName,
      nickname: OTHER_USER.nickname,
      emailVerified: true,
      userType: 'regular',
    },
  });
  console.log(`  ✅ Other user: ${otherUser.email} (${otherUser.nickname})`);

  // ── Master Ingredients ─────────────────────────────────────────────────────

  for (const name of INGREDIENTS) {
    await prisma.masterIngredient.upsert({
      where: { name },
      update: {},
      create: { name, isActive: true },
    });
  }
  console.log(`  ✅ Master ingredients: ${INGREDIENTS.length} seeded`);

  // ── Measurement Units LOV ──────────────────────────────────────────────────

  const measureUnitsType = await prisma.listType.upsert({
    where: { name: 'Measurement Units' },
    update: {},
    create: { name: 'Measurement Units', description: 'Units for recipe ingredients', isActive: true },
  });

  const units = ['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch'];
  for (let i = 0; i < units.length; i++) {
    await prisma.listValue.upsert({
      where: { listTypeId_value: { listTypeId: measureUnitsType.id, value: units[i] } },
      update: {},
      create: {
        listTypeId: measureUnitsType.id,
        value: units[i],
        label: units[i],
        sortOrder: i + 1,
        isActive: true,
      },
    });
  }
  console.log(`  ✅ Measurement Units LOV: ${units.length} values`);

  // ── Recipes ────────────────────────────────────────────────────────────────

  async function upsertRecipe(
    authorId: string,
    recipeData: typeof RECIPES.published1,
    isPublished: boolean
  ) {
    // Delete existing recipe by slug + author to re-create cleanly
    const existing = await prisma.recipe.findFirst({
      where: { slug: recipeData.slug, authorId },
    });

    if (existing) {
      // Delete steps (cascades to ingredients) then recipe
      await prisma.stepIngredient.deleteMany({
        where: { step: { recipeId: existing.id } },
      });
      await prisma.recipeStep.deleteMany({ where: { recipeId: existing.id } });
      await prisma.savedRecipe.deleteMany({ where: { recipeId: existing.id } });
      await prisma.recipeDietaryTag.deleteMany({ where: { recipeId: existing.id } });
      await prisma.recipe.delete({ where: { id: existing.id } });
    }

    const recipe = await prisma.recipe.create({
      data: {
        title: recipeData.title,
        slug: recipeData.slug,
        description: recipeData.description,
        servings: recipeData.servings,
        isPublished,
        authorId,
        steps: {
          create: recipeData.steps.map((step, i) => ({
            title: step.title,
            slug: step.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            instruction: step.instruction,
            order: i + 1,
          })),
        },
      },
      include: { steps: true },
    });

    // Add sample ingredients to first step
    if (recipe.steps.length > 0) {
      const firstStep = recipe.steps[0];
      const sampleIngredients = ['Flour', 'Sugar', 'Salt'];
      for (let j = 0; j < sampleIngredients.length; j++) {
        const master = await prisma.masterIngredient.findUnique({
          where: { name: sampleIngredients[j] },
        });
        await prisma.stepIngredient.create({
          data: {
            stepId: firstStep.id,
            name: sampleIngredients[j],
            quantity: j + 1,
            unit: 'cup',
            order: j + 1,
            masterIngredientId: master?.id || null,
          },
        });
      }
    }

    return recipe;
  }

  const r1 = await upsertRecipe(testUser.id, RECIPES.published1, true);
  console.log(`  ✅ Recipe: "${r1.title}" (published, by ${TEST_USER.nickname})`);

  const r2 = await upsertRecipe(testUser.id, RECIPES.published2, true);
  console.log(`  ✅ Recipe: "${r2.title}" (published, by ${TEST_USER.nickname})`);

  const r3 = await upsertRecipe(testUser.id, RECIPES.draft, false);
  console.log(`  ✅ Recipe: "${r3.title}" (draft, by ${TEST_USER.nickname})`);

  const r4 = await upsertRecipe(otherUser.id, RECIPES.otherUser, true);
  console.log(`  ✅ Recipe: "${r4.title}" (published, by ${OTHER_USER.nickname})`);

  const r5 = await upsertRecipe(otherUser.id, RECIPES.otherUser2, true);
  console.log(`  ✅ Recipe: "${r5.title}" (published, by ${OTHER_USER.nickname})`);

  // ── System Parameters ──────────────────────────────────────────────────────

  await prisma.parameter.upsert({
    where: { key_ownerType_ownerId: { key: 'system.logging.console.minLevel', ownerType: 'SYSTEM', ownerId: '' } },
    update: {},
    create: {
      key: 'system.logging.console.minLevel',
      value: 'error',
      dataType: 'STRING',
      ownerType: 'SYSTEM',
      ownerId: '',
      category: 'logging',
      description: 'Minimum log level for console output',
    },
  });
  console.log(`  ✅ System parameters seeded`);

  console.log('\n🎉 E2E seed complete!\n');
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
