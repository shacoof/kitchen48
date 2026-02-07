/**
 * Data Migration: Seed Recipe LOVs
 *
 * Database Version: 1.3.0
 *
 * Creates LOV types and values required by the recipe module:
 * - Measurement Units (with system attribute: universal/metric/imperial)
 * - Measurement System (metric/imperial)
 * - Difficulty (easy/medium/hard)
 * - Cuisine (Italian, Japanese, etc.)
 * - Meal Type (Breakfast, Lunch, etc.)
 * - Dietary Tags (Vegetarian, Vegan, etc.)
 *
 * Time Units are handled by the TimeUnit Prisma enum, not LOV.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const version = '1.3.0';
export const description = 'Seed recipe LOV types: Measurement Units, Measurement System, Difficulty, Cuisine, Meal Type, Dietary Tags';

interface LovDefinition {
  typeName: string;
  typeDescription: string;
  values: Array<{
    value: string;
    label: string;
    description?: string;
    heLabel?: string;
  }>;
}

const LOV_DEFINITIONS: LovDefinition[] = [
  {
    typeName: 'Measurement Units',
    typeDescription: 'Units of measurement for recipe ingredients. Each value has a system attribute (universal/metric/imperial) stored in the description field.',
    values: [
      // Universal units (used in both metric and imperial cooking)
      { value: 'cups', label: 'cups', description: 'universal', heLabel: 'כוסות' },
      { value: 'tbsp', label: 'tablespoons', description: 'universal', heLabel: 'כפות' },
      { value: 'tsp', label: 'teaspoons', description: 'universal', heLabel: 'כפיות' },
      { value: 'pieces', label: 'pieces', description: 'universal', heLabel: 'יחידות' },
      { value: 'pinch', label: 'pinch', description: 'universal', heLabel: 'קמצוץ' },
      { value: 'cloves', label: 'cloves', description: 'universal', heLabel: 'שיני' },
      { value: 'slices', label: 'slices', description: 'universal', heLabel: 'פרוסות' },
      { value: 'whole', label: 'whole', description: 'universal', heLabel: 'שלם' },
      { value: 'bunch', label: 'bunch', description: 'universal', heLabel: 'צרור' },
      // Metric units
      { value: 'g', label: 'grams', description: 'metric', heLabel: 'גרם' },
      { value: 'kg', label: 'kilograms', description: 'metric', heLabel: 'קילוגרם' },
      { value: 'ml', label: 'milliliters', description: 'metric', heLabel: 'מיליליטר' },
      { value: 'l', label: 'liters', description: 'metric', heLabel: 'ליטר' },
      // Imperial units
      { value: 'oz', label: 'ounces', description: 'imperial', heLabel: 'אונקיות' },
      { value: 'lb', label: 'pounds', description: 'imperial', heLabel: 'ליברות' },
      { value: 'fl_oz', label: 'fluid ounces', description: 'imperial', heLabel: 'אונקיות נוזל' },
    ],
  },
  {
    typeName: 'Measurement System',
    typeDescription: 'Metric or Imperial measurement system preference for users and recipes.',
    values: [
      { value: 'metric', label: 'Metric', heLabel: 'מטרי' },
      { value: 'imperial', label: 'Imperial', heLabel: 'אימפריאלי' },
    ],
  },
  {
    typeName: 'Difficulty',
    typeDescription: 'Recipe difficulty level.',
    values: [
      { value: 'easy', label: 'Easy', heLabel: 'קל' },
      { value: 'medium', label: 'Medium', heLabel: 'בינוני' },
      { value: 'hard', label: 'Hard', heLabel: 'קשה' },
    ],
  },
  {
    typeName: 'Cuisine',
    typeDescription: 'Types of cuisine for recipe classification.',
    values: [
      { value: 'italian', label: 'Italian', heLabel: 'איטלקי' },
      { value: 'japanese', label: 'Japanese', heLabel: 'יפני' },
      { value: 'mexican', label: 'Mexican', heLabel: 'מקסיקני' },
      { value: 'indian', label: 'Indian', heLabel: 'הודי' },
      { value: 'french', label: 'French', heLabel: 'צרפתי' },
      { value: 'thai', label: 'Thai', heLabel: 'תאילנדי' },
      { value: 'chinese', label: 'Chinese', heLabel: 'סיני' },
      { value: 'mediterranean', label: 'Mediterranean', heLabel: 'ים תיכוני' },
      { value: 'american', label: 'American', heLabel: 'אמריקאי' },
      { value: 'middle_eastern', label: 'Middle Eastern', heLabel: 'מזרח תיכוני' },
    ],
  },
  {
    typeName: 'Meal Type',
    typeDescription: 'Type of meal the recipe is intended for.',
    values: [
      { value: 'breakfast', label: 'Breakfast', heLabel: 'ארוחת בוקר' },
      { value: 'lunch', label: 'Lunch', heLabel: 'ארוחת צהריים' },
      { value: 'dinner', label: 'Dinner', heLabel: 'ארוחת ערב' },
      { value: 'snack', label: 'Snack', heLabel: 'חטיף' },
      { value: 'dessert', label: 'Dessert', heLabel: 'קינוח' },
      { value: 'appetizer', label: 'Appetizer', heLabel: 'מנה ראשונה' },
    ],
  },
  {
    typeName: 'Dietary Tags',
    typeDescription: 'Dietary restriction and preference tags for recipes. Multi-select.',
    values: [
      { value: 'vegetarian', label: 'Vegetarian', heLabel: 'צמחוני' },
      { value: 'vegan', label: 'Vegan', heLabel: 'טבעוני' },
      { value: 'gluten_free', label: 'Gluten-Free', heLabel: 'ללא גלוטן' },
      { value: 'dairy_free', label: 'Dairy-Free', heLabel: 'ללא חלב' },
      { value: 'nut_free', label: 'Nut-Free', heLabel: 'ללא אגוזים' },
      { value: 'keto', label: 'Keto', heLabel: 'קטו' },
      { value: 'low_carb', label: 'Low-Carb', heLabel: 'דל פחמימות' },
      { value: 'halal', label: 'Halal', heLabel: 'חלאל' },
      { value: 'kosher', label: 'Kosher', heLabel: 'כשר' },
    ],
  },
];

export async function run(): Promise<void> {
  for (const lovDef of LOV_DEFINITIONS) {
    // Upsert the list type
    const listType = await prisma.listType.upsert({
      where: { name: lovDef.typeName },
      update: { description: lovDef.typeDescription },
      create: {
        name: lovDef.typeName,
        description: lovDef.typeDescription,
        isActive: true,
      },
    });

    // Upsert each value
    for (const [index, val] of lovDef.values.entries()) {
      const listValue = await prisma.listValue.upsert({
        where: {
          listTypeId_value: { listTypeId: listType.id, value: val.value },
        },
        update: {
          label: val.label,
          description: val.description || null,
          sortOrder: index + 1,
        },
        create: {
          listTypeId: listType.id,
          value: val.value,
          label: val.label,
          description: val.description || null,
          sortOrder: index + 1,
          isActive: true,
        },
      });

      // Add Hebrew translation if provided
      if (val.heLabel) {
        await prisma.listValueTranslation.upsert({
          where: {
            listValueId_language: { listValueId: listValue.id, language: 'he' },
          },
          update: { label: val.heLabel },
          create: {
            listValueId: listValue.id,
            language: 'he',
            label: val.heLabel,
          },
        });
      }
    }

    console.log(`  Created LOV type "${lovDef.typeName}" with ${lovDef.values.length} values`);
  }
}
