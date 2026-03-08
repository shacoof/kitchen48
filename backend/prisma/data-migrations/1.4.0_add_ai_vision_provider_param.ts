import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const version = '1.4.0';
export const description = 'Add AI vision provider parameter for smart recipe upload';

export async function run(): Promise<void> {
  await prisma.parameter.upsert({
    where: {
      key_ownerType_ownerId: {
        key: 'ai.vision.provider',
        ownerType: 'SYSTEM',
        ownerId: 'SYSTEM',
      },
    },
    update: {},
    create: {
      key: 'ai.vision.provider',
      value: 'gemini',
      dataType: 'STRING',
      ownerType: 'SYSTEM',
      ownerId: 'SYSTEM',
      category: 'ai',
      description: 'AI provider for smart recipe upload image extraction. Possible values: gemini, openai. Each provider requires its corresponding API key in environment variables (GEMINI_API_KEY or OPENAI_API_KEY).',
      defaultValue: 'gemini',
    },
  });

  console.log('Created parameter: ai.vision.provider = gemini');
}
