/**
 * Data Migration: Seed Voice Commands
 *
 * Database Version: 1.4.0
 *
 * Populates the voice_commands and voice_command_translations tables
 * with the 15 default voice commands used in Recipe Play Mode.
 * Each command includes English and Hebrew translations.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const version = '1.4.0';
export const description = 'Seed voice commands for Recipe Play Mode with EN+HE translations';

interface VoiceCommandDef {
  command: string;
  keywords: string[];
  icon: string;
  sortOrder: number;
  translations: {
    en: { displayKeyword: string; description: string };
    he: { displayKeyword: string; description: string };
  };
}

const VOICE_COMMANDS: VoiceCommandDef[] = [
  {
    command: 'describe',
    keywords: ['read instructions', 'read step', 'describe', 'read', 'קרא הוראות', 'תקריא', 'קרא'],
    icon: 'record_voice_over',
    sortOrder: 1,
    translations: {
      en: { displayKeyword: '"Read Instructions"', description: 'Read the current step instructions aloud' },
      he: { displayKeyword: '"קרא הוראות"', description: 'הקראת הוראות השלב הנוכחי בקול' },
    },
  },
  {
    command: 'ingredients',
    keywords: ['read ingredients', 'ingredients', 'קרא מרכיבים', 'מרכיבים'],
    icon: 'shopping_basket',
    sortOrder: 2,
    translations: {
      en: { displayKeyword: '"Read Ingredients"', description: 'Read the ingredients for this step aloud' },
      he: { displayKeyword: '"קרא מרכיבים"', description: 'הקראת המרכיבים של שלב זה בקול' },
    },
  },
  {
    command: 'stop',
    keywords: ['stop', 'עצור'],
    icon: 'stop_circle',
    sortOrder: 3,
    translations: {
      en: { displayKeyword: '"Stop"', description: 'Stop reading aloud' },
      he: { displayKeyword: '"עצור"', description: 'הפסקת הקראה' },
    },
  },
  {
    command: 'next',
    keywords: ['next', 'הבא'],
    icon: 'skip_next',
    sortOrder: 4,
    translations: {
      en: { displayKeyword: '"Next"', description: 'Go to the next step' },
      he: { displayKeyword: '"הבא"', description: 'מעבר לשלב הבא' },
    },
  },
  {
    command: 'previous',
    keywords: ['previous', 'back', 'הקודם', 'אחורה'],
    icon: 'skip_previous',
    sortOrder: 5,
    translations: {
      en: { displayKeyword: '"Previous"', description: 'Go to the previous step' },
      he: { displayKeyword: '"הקודם"', description: 'חזרה לשלב הקודם' },
    },
  },
  {
    command: 'play',
    keywords: ['play video', 'play', 'הפעל'],
    icon: 'play_circle',
    sortOrder: 6,
    translations: {
      en: { displayKeyword: '"Play"', description: 'Play the step video' },
      he: { displayKeyword: '"הפעל"', description: 'הפעלת סרטון השלב' },
    },
  },
  {
    command: 'louder',
    keywords: ['louder', 'volume up', 'חזק יותר'],
    icon: 'volume_up',
    sortOrder: 7,
    translations: {
      en: { displayKeyword: '"Louder"', description: 'Increase the volume' },
      he: { displayKeyword: '"חזק יותר"', description: 'הגברת עוצמת הקול' },
    },
  },
  {
    command: 'quieter',
    keywords: ['quieter', 'volume down', 'שקט יותר', 'חלש יותר'],
    icon: 'volume_down',
    sortOrder: 8,
    translations: {
      en: { displayKeyword: '"Quieter"', description: 'Decrease the volume' },
      he: { displayKeyword: '"שקט יותר"', description: 'הנמכת עוצמת הקול' },
    },
  },
  {
    command: 'bigger',
    keywords: ['bigger', 'larger', 'גדול יותר'],
    icon: 'text_increase',
    sortOrder: 9,
    translations: {
      en: { displayKeyword: '"Bigger"', description: 'Increase the text size' },
      he: { displayKeyword: '"גדול יותר"', description: 'הגדלת גודל הטקסט' },
    },
  },
  {
    command: 'smaller',
    keywords: ['smaller', 'קטן יותר'],
    icon: 'text_decrease',
    sortOrder: 10,
    translations: {
      en: { displayKeyword: '"Smaller"', description: 'Decrease the text size' },
      he: { displayKeyword: '"קטן יותר"', description: 'הקטנת גודל הטקסט' },
    },
  },
  {
    command: 'timer',
    keywords: ['start timer', 'activate timer', 'התחל טיימר'],
    icon: 'timer',
    sortOrder: 11,
    translations: {
      en: { displayKeyword: '"Start Timer"', description: 'Start the step timer' },
      he: { displayKeyword: '"התחל טיימר"', description: 'הפעלת טיימר השלב' },
    },
  },
  {
    command: 'timerStatus',
    keywords: ['timer status', 'סטטוס טיימר'],
    icon: 'av_timer',
    sortOrder: 12,
    translations: {
      en: { displayKeyword: '"Timer Status"', description: 'Read the timer remaining time' },
      he: { displayKeyword: '"סטטוס טיימר"', description: 'הקראת הזמן שנותר בטיימר' },
    },
  },
  {
    command: 'restart',
    keywords: ['restart', 'התחל מחדש'],
    icon: 'replay',
    sortOrder: 13,
    translations: {
      en: { displayKeyword: '"Restart"', description: 'Go back to step 1' },
      he: { displayKeyword: '"התחל מחדש"', description: 'חזרה לשלב 1' },
    },
  },
  {
    command: 'exit',
    keywords: ['exit', 'יציאה'],
    icon: 'logout',
    sortOrder: 14,
    translations: {
      en: { displayKeyword: '"Exit"', description: 'Return to recipe details' },
      he: { displayKeyword: '"יציאה"', description: 'חזרה לפרטי המתכון' },
    },
  },
  {
    command: 'help',
    keywords: ['help', 'עזרה'],
    icon: 'help',
    sortOrder: 15,
    translations: {
      en: { displayKeyword: '"Help"', description: 'Show this help and read all commands' },
      he: { displayKeyword: '"עזרה"', description: 'הצגת עזרה והקראת כל הפקודות' },
    },
  },
];

export async function run(): Promise<void> {
  for (const def of VOICE_COMMANDS) {
    const vc = await prisma.voiceCommand.upsert({
      where: { command: def.command },
      update: {
        keywords: def.keywords,
        icon: def.icon,
        sortOrder: def.sortOrder,
      },
      create: {
        command: def.command,
        keywords: def.keywords,
        icon: def.icon,
        sortOrder: def.sortOrder,
        isActive: true,
      },
    });

    // Upsert translations
    for (const [lang, trans] of Object.entries(def.translations)) {
      await prisma.voiceCommandTranslation.upsert({
        where: {
          voiceCommandId_language: {
            voiceCommandId: vc.id,
            language: lang,
          },
        },
        update: {
          displayKeyword: trans.displayKeyword,
          description: trans.description,
        },
        create: {
          voiceCommandId: vc.id,
          language: lang,
          displayKeyword: trans.displayKeyword,
          description: trans.description,
        },
      });
    }
  }

  console.log(`Seeded ${VOICE_COMMANDS.length} voice commands with EN+HE translations`);
}
