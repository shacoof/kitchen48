/**
 * Play Mode voice commands. Keywords ported from the web `voice_commands`
 * seed (backend/prisma/data-migrations/1.4.0_seed_voice_commands.ts) and
 * bundled here because the mobile app has no backend.
 *
 * Display text and descriptions live in i18n under `voice.cmd.<id>`.
 */
import type { TimerKind } from '../db/step-timers-db';

export type VoiceCommandId =
  | 'next'
  | 'previous'
  | 'restart'
  | 'describe'
  | 'ingredients'
  | 'stop'
  | 'timer'
  | 'pauseTimer'
  | 'resumeTimer'
  | 'resetTimer'
  | 'timerStatus'
  | 'exit'
  | 'help';

export const VOICE_COMMANDS: { id: VoiceCommandId; keywords: string[] }[] = [
  { id: 'describe', keywords: ['read instructions', 'read step', 'describe', 'read', 'קרא הוראות', 'תקריא', 'קרא'] },
  { id: 'ingredients', keywords: ['read ingredients', 'ingredients', 'קרא מרכיבים', 'מרכיבים'] },
  { id: 'stop', keywords: ['stop', 'quiet', 'עצור', 'שקט'] },
  { id: 'next', keywords: ['next', 'next step', 'הבא', 'השלב הבא'] },
  { id: 'previous', keywords: ['previous', 'back', 'הקודם', 'אחורה'] },
  { id: 'restart', keywords: ['restart', 'start over', 'התחל מחדש'] },
  { id: 'timer', keywords: ['start timer', 'activate timer', 'start prep timer', 'start wait timer', 'התחל טיימר', 'הפעל טיימר'] },
  { id: 'pauseTimer', keywords: ['pause timer', 'stop timer', 'pause', 'עצור טיימר', 'השהה טיימר', 'השהה'] },
  { id: 'resumeTimer', keywords: ['resume timer', 'continue timer', 'resume', 'המשך טיימר', 'המשך'] },
  { id: 'resetTimer', keywords: ['reset timer', 'cancel timer', 'אפס טיימר', 'בטל טיימר'] },
  { id: 'timerStatus', keywords: ['timer status', 'how much time', 'time left', 'סטטוס טיימר', 'כמה זמן'] },
  { id: 'exit', keywords: ['exit', 'close', 'יציאה', 'צא'] },
  { id: 'help', keywords: ['help', 'commands', 'עזרה', 'פקודות'] },
];

/** Every keyword, for recognizer biasing (`contextualStrings`). */
export const ALL_KEYWORDS: string[] = VOICE_COMMANDS.flatMap((c) => c.keywords);

export interface MatchedCommand {
  id: VoiceCommandId;
  /** Explicit timer kind if the user said "prep"/"wait". */
  timerKind: TimerKind | null;
  /** Normalized transcript, for matching recipe titles. */
  text: string;
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match a transcript to a command. The longest matching keyword wins, so
 * "read ingredients" beats "read" and "stop timer" beats "stop".
 */
export function matchVoiceCommand(transcript: string): MatchedCommand | null {
  const text = normalize(transcript);
  if (!text) return null;
  const padded = ` ${text} `;

  let best: { id: VoiceCommandId; len: number } | null = null;
  for (const cmd of VOICE_COMMANDS) {
    for (const kw of cmd.keywords) {
      if (padded.includes(` ${kw} `) && (!best || kw.length > best.len)) {
        best = { id: cmd.id, len: kw.length };
      }
    }
  }
  if (!best) return null;

  let timerKind: TimerKind | null = null;
  if (/\b(prep|preparation)\b|הכנה/u.test(text)) timerKind = 'prep';
  else if (/\bwait\b|המתנה/u.test(text)) timerKind = 'wait';

  return { id: best.id, timerKind, text };
}

const KEYWORD_WORDS = new Set(ALL_KEYWORDS.flatMap((kw) => kw.split(' ')));

/**
 * How many words of a recipe title the transcript mentions, ignoring short
 * words and command words. "pause lasagna timer" scores 1 against
 * "Classic Lasagna"; 0 means the title wasn't mentioned.
 */
export function titleMatchScore(text: string, title: string): number {
  const padded = ` ${text} `;
  return normalize(title)
    .split(' ')
    .filter((w) => w.length >= 3 && !KEYWORD_WORDS.has(w))
    .filter((w) => padded.includes(` ${w} `)).length;
}
