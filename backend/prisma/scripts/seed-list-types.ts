/**
 * Seed List Types
 *
 * Creates initial list types and values for Kitchen48
 *
 * Run: npx tsx prisma/scripts/seed-list-types.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ListTypeSeed {
  name: string;
  description: string;
  values: {
    value: string;
    label: string;
    description?: string;
    sortOrder: number;
  }[];
}

const seedData: ListTypeSeed[] = [
  {
    name: 'ingredient_categories',
    description: 'Categories for organizing ingredients',
    values: [
      { value: 'VEGETABLES', label: 'Vegetables', sortOrder: 1 },
      { value: 'FRUITS', label: 'Fruits', sortOrder: 2 },
      { value: 'DAIRY', label: 'Dairy', sortOrder: 3 },
      { value: 'MEAT', label: 'Meat & Poultry', sortOrder: 4 },
      { value: 'SEAFOOD', label: 'Seafood', sortOrder: 5 },
      { value: 'GRAINS', label: 'Grains & Pasta', sortOrder: 6 },
      { value: 'LEGUMES', label: 'Legumes & Beans', sortOrder: 7 },
      { value: 'NUTS_SEEDS', label: 'Nuts & Seeds', sortOrder: 8 },
      { value: 'SPICES', label: 'Spices & Herbs', sortOrder: 9 },
      { value: 'OILS', label: 'Oils & Fats', sortOrder: 10 },
      { value: 'CONDIMENTS', label: 'Condiments & Sauces', sortOrder: 11 },
      { value: 'BAKING', label: 'Baking Supplies', sortOrder: 12 },
      { value: 'BEVERAGES', label: 'Beverages', sortOrder: 13 },
      { value: 'OTHER', label: 'Other', sortOrder: 99 },
    ],
  },
  {
    name: 'measurement_units',
    description: 'Units of measurement for recipe ingredients',
    values: [
      { value: 'G', label: 'grams (g)', sortOrder: 1 },
      { value: 'KG', label: 'kilograms (kg)', sortOrder: 2 },
      { value: 'ML', label: 'milliliters (ml)', sortOrder: 3 },
      { value: 'L', label: 'liters (L)', sortOrder: 4 },
      { value: 'TSP', label: 'teaspoon (tsp)', sortOrder: 5 },
      { value: 'TBSP', label: 'tablespoon (tbsp)', sortOrder: 6 },
      { value: 'CUP', label: 'cup', sortOrder: 7 },
      { value: 'OZ', label: 'ounces (oz)', sortOrder: 8 },
      { value: 'LB', label: 'pounds (lb)', sortOrder: 9 },
      { value: 'PCS', label: 'pieces', sortOrder: 10 },
      { value: 'PINCH', label: 'pinch', sortOrder: 11 },
      { value: 'DASH', label: 'dash', sortOrder: 12 },
      { value: 'CLOVE', label: 'clove', sortOrder: 13 },
      { value: 'BUNCH', label: 'bunch', sortOrder: 14 },
      { value: 'SLICE', label: 'slice', sortOrder: 15 },
      { value: 'TO_TASTE', label: 'to taste', sortOrder: 99 },
    ],
  },
  {
    name: 'cuisine_types',
    description: 'Types of cuisine for recipe categorization',
    values: [
      { value: 'ITALIAN', label: 'Italian', sortOrder: 1 },
      { value: 'MEXICAN', label: 'Mexican', sortOrder: 2 },
      { value: 'CHINESE', label: 'Chinese', sortOrder: 3 },
      { value: 'JAPANESE', label: 'Japanese', sortOrder: 4 },
      { value: 'INDIAN', label: 'Indian', sortOrder: 5 },
      { value: 'THAI', label: 'Thai', sortOrder: 6 },
      { value: 'FRENCH', label: 'French', sortOrder: 7 },
      { value: 'MEDITERRANEAN', label: 'Mediterranean', sortOrder: 8 },
      { value: 'MIDDLE_EASTERN', label: 'Middle Eastern', sortOrder: 9 },
      { value: 'AMERICAN', label: 'American', sortOrder: 10 },
      { value: 'KOREAN', label: 'Korean', sortOrder: 11 },
      { value: 'VIETNAMESE', label: 'Vietnamese', sortOrder: 12 },
      { value: 'GREEK', label: 'Greek', sortOrder: 13 },
      { value: 'SPANISH', label: 'Spanish', sortOrder: 14 },
      { value: 'FUSION', label: 'Fusion', sortOrder: 15 },
      { value: 'OTHER', label: 'Other', sortOrder: 99 },
    ],
  },
  {
    name: 'difficulty_levels',
    description: 'Recipe difficulty levels',
    values: [
      { value: 'BEGINNER', label: 'Beginner', description: 'Simple recipes for cooking beginners', sortOrder: 1 },
      { value: 'EASY', label: 'Easy', description: 'Quick and straightforward recipes', sortOrder: 2 },
      { value: 'MEDIUM', label: 'Medium', description: 'Moderate skill and time required', sortOrder: 3 },
      { value: 'HARD', label: 'Hard', description: 'Advanced techniques required', sortOrder: 4 },
      { value: 'EXPERT', label: 'Expert', description: 'Professional-level complexity', sortOrder: 5 },
    ],
  },
  {
    name: 'dietary_restrictions',
    description: 'Dietary preferences and restrictions',
    values: [
      { value: 'VEGETARIAN', label: 'Vegetarian', sortOrder: 1 },
      { value: 'VEGAN', label: 'Vegan', sortOrder: 2 },
      { value: 'GLUTEN_FREE', label: 'Gluten-Free', sortOrder: 3 },
      { value: 'DAIRY_FREE', label: 'Dairy-Free', sortOrder: 4 },
      { value: 'NUT_FREE', label: 'Nut-Free', sortOrder: 5 },
      { value: 'KOSHER', label: 'Kosher', sortOrder: 6 },
      { value: 'HALAL', label: 'Halal', sortOrder: 7 },
      { value: 'LOW_CARB', label: 'Low Carb', sortOrder: 8 },
      { value: 'KETO', label: 'Keto', sortOrder: 9 },
      { value: 'PALEO', label: 'Paleo', sortOrder: 10 },
    ],
  },
  {
    name: 'meal_types',
    description: 'Type of meal',
    values: [
      { value: 'BREAKFAST', label: 'Breakfast', sortOrder: 1 },
      { value: 'BRUNCH', label: 'Brunch', sortOrder: 2 },
      { value: 'LUNCH', label: 'Lunch', sortOrder: 3 },
      { value: 'DINNER', label: 'Dinner', sortOrder: 4 },
      { value: 'SNACK', label: 'Snack', sortOrder: 5 },
      { value: 'DESSERT', label: 'Dessert', sortOrder: 6 },
      { value: 'APPETIZER', label: 'Appetizer', sortOrder: 7 },
      { value: 'SIDE_DISH', label: 'Side Dish', sortOrder: 8 },
      { value: 'BEVERAGE', label: 'Beverage', sortOrder: 9 },
    ],
  },
];

async function seedListTypes() {
  console.log('🌱 Starting list types seed...\n');

  for (const listTypeData of seedData) {
    console.log(`📋 Processing list type: ${listTypeData.name}`);

    // Upsert list type
    const listType = await prisma.listType.upsert({
      where: { name: listTypeData.name },
      update: {
        description: listTypeData.description,
      },
      create: {
        name: listTypeData.name,
        description: listTypeData.description,
        isActive: true,
      },
    });

    console.log(`   ✓ List type created/updated: ${listType.id}`);

    // Upsert values
    for (const valueData of listTypeData.values) {
      await prisma.listValue.upsert({
        where: {
          listTypeId_value: {
            listTypeId: listType.id,
            value: valueData.value,
          },
        },
        update: {
          label: valueData.label,
          description: valueData.description || null,
          sortOrder: valueData.sortOrder,
        },
        create: {
          listTypeId: listType.id,
          value: valueData.value,
          label: valueData.label,
          description: valueData.description || null,
          sortOrder: valueData.sortOrder,
          isActive: true,
        },
      });
    }

    console.log(`   ✓ ${listTypeData.values.length} values created/updated\n`);
  }

  console.log('✅ List types seed completed!');
}

seedListTypes()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
