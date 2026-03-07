/**
 * Data Migration: Seed Languages LOV
 *
 * Database Version: 1.4.0
 *
 * Creates the "Languages" LOV type and 16 language values with Hebrew translations.
 * This was previously only in seed.ts and never ran in production.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const version = '1.4.0';
export const description = 'Seed Languages LOV type with 16 languages and Hebrew translations';

const supportedLanguages = [
  { value: 'en', label: 'English', he: 'אנגלית' },
  { value: 'he', label: 'Hebrew', he: 'עברית' },
  { value: 'es', label: 'Spanish', he: 'ספרדית' },
  { value: 'fr', label: 'French', he: 'צרפתית' },
  { value: 'de', label: 'German', he: 'גרמנית' },
  { value: 'it', label: 'Italian', he: 'איטלקית' },
  { value: 'pt', label: 'Portuguese', he: 'פורטוגזית' },
  { value: 'ru', label: 'Russian', he: 'רוסית' },
  { value: 'zh', label: 'Chinese', he: 'סינית' },
  { value: 'ja', label: 'Japanese', he: 'יפנית' },
  { value: 'ko', label: 'Korean', he: 'קוריאנית' },
  { value: 'ar', label: 'Arabic', he: 'ערבית' },
  { value: 'hi', label: 'Hindi', he: 'הינדית' },
  { value: 'tr', label: 'Turkish', he: 'טורקית' },
  { value: 'nl', label: 'Dutch', he: 'הולנדית' },
  { value: 'pl', label: 'Polish', he: 'פולנית' },
];

export async function run(): Promise<void> {
  // Create or find the Languages list type
  const listType = await prisma.listType.upsert({
    where: { name: 'Languages' },
    update: {},
    create: {
      name: 'Languages',
      description: 'Supported languages for video/audio content and interface',
      isActive: true,
    },
  });

  // Create language values and their translations
  for (let i = 0; i < supportedLanguages.length; i++) {
    const lang = supportedLanguages[i];

    const listValue = await prisma.listValue.upsert({
      where: {
        listTypeId_value: {
          listTypeId: listType.id,
          value: lang.value,
        },
      },
      update: { label: lang.label, sortOrder: i },
      create: {
        listTypeId: listType.id,
        value: lang.value,
        label: lang.label,
        sortOrder: i,
        isActive: true,
      },
    });

    // Hebrew translation
    await prisma.listValueTranslation.upsert({
      where: {
        listValueId_language: {
          listValueId: listValue.id,
          language: 'he',
        },
      },
      update: { label: lang.he },
      create: {
        listValueId: listValue.id,
        language: 'he',
        label: lang.he,
      },
    });

    // English translation
    await prisma.listValueTranslation.upsert({
      where: {
        listValueId_language: {
          listValueId: listValue.id,
          language: 'en',
        },
      },
      update: { label: lang.label },
      create: {
        listValueId: listValue.id,
        language: 'en',
        label: lang.label,
      },
    });
  }

  console.log(`Seeded ${supportedLanguages.length} languages with translations`);
}
