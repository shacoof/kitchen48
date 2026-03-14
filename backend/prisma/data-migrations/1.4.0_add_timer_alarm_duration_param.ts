import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const version = '1.4.0';
export const description = 'Add timer alarm duration parameter (seconds alarm plays after timer completes)';

export async function run(): Promise<void> {
  await prisma.parameter.upsert({
    where: {
      key_ownerType_ownerId: {
        key: 'system.timer.alarmDurationSeconds',
        ownerType: 'SYSTEM',
        ownerId: 'SYSTEM',
      },
    },
    update: {},
    create: {
      key: 'system.timer.alarmDurationSeconds',
      value: '10',
      dataType: 'NUMBER',
      ownerType: 'SYSTEM',
      ownerId: 'SYSTEM',
      category: 'timer',
      description: 'How many seconds the alarm sound plays after a step timer reaches zero. The alarm stops early if the user taps the timer.',
      defaultValue: '10',
    },
  });

  console.log('Created parameter: system.timer.alarmDurationSeconds = 10');
}
