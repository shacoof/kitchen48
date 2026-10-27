import * as Speech from 'expo-speech';
import { createLogger } from '../lib/logger';

const logger = createLogger('TTS');

/** Interface language → BCP-47 voice language. */
const VOICE_LANG: Record<string, string> = {
  en: 'en-US',
  he: 'he-IL',
};

export function voiceLanguage(lang: string): string {
  return VOICE_LANG[lang] ?? VOICE_LANG.en;
}

const HEBREW_CHARS = /[\u0590-\u05FF]/;

/**
 * Voice language for one piece of text. Recipe content can be in a different
 * language than the interface, so Hebrew text gets the Hebrew voice even when
 * the interface is English.
 */
export function voiceLanguageFor(text: string, lang: string): string {
  return HEBREW_CHARS.test(text) ? VOICE_LANG.he : voiceLanguage(lang);
}

type MissingVoiceListener = (language: string) => void;

const missingVoiceListeners = new Set<MissingVoiceListener>();
let installedVoiceLangs: Promise<string[]> | null = null;
const reportedMissing = new Set<string>();

/** Subscribe to "no installed voice for this language". Returns an unsubscribe function. */
export function onMissingVoice(listener: MissingVoiceListener): () => void {
  missingVoiceListeners.add(listener);
  return () => { missingVoiceListeners.delete(listener); };
}

// Android reports Hebrew under the legacy code "iw" as well as "he".
function langPrefixes(language: string): string[] {
  const base = language.split('-')[0].toLowerCase();
  return base === 'he' ? ['he', 'iw'] : [base];
}

async function checkVoiceInstalled(language: string): Promise<void> {
  if (reportedMissing.has(language)) return;
  installedVoiceLangs ??= Speech.getAvailableVoicesAsync()
    .then((voices) => voices.map((v) => v.language.toLowerCase()))
    .catch((err) => {
      logger.warning(`getAvailableVoicesAsync failed: ${err}`);
      return [];
    });
  const langs = await installedVoiceLangs;
  // An empty list means the engine didn't report voices, not that none exist.
  if (langs.length === 0) return;
  const prefixes = langPrefixes(language);
  if (langs.some((l) => prefixes.some((p) => l.startsWith(p)))) return;
  reportedMissing.add(language);
  logger.warning(`no installed voice for ${language}`);
  for (const l of missingVoiceListeners) l(language);
}

type SpeakingListener = (speaking: boolean) => void;

const listeners = new Set<SpeakingListener>();
let speaking = false;
// Each speak() call gets a token so a stale onDone from an utterance that was
// interrupted doesn't flip the state of the one that replaced it.
let currentToken = 0;

function setSpeaking(value: boolean) {
  if (speaking === value) return;
  speaking = value;
  for (const l of listeners) l(value);
}

export function isSpeaking(): boolean {
  return speaking;
}

/** Subscribe to speaking state changes. Returns an unsubscribe function. */
export function onSpeakingChange(listener: SpeakingListener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/**
 * Speak `parts` in order, replacing anything currently being spoken.
 * Resolves when the last part finishes or speech is stopped.
 */
export function speak(parts: string[], lang: string): Promise<void> {
  const texts = parts.map((p) => p.trim()).filter(Boolean);
  Speech.stop();
  const token = ++currentToken;
  if (texts.length === 0) {
    setSpeaking(false);
    return Promise.resolve();
  }

  setSpeaking(true);
  const languages = texts.map((text) => voiceLanguageFor(text, lang));
  for (const language of new Set(languages)) void checkVoiceInstalled(language);
  return new Promise((resolve) => {
    const finish = () => {
      if (token === currentToken) setSpeaking(false);
      resolve();
    };
    texts.forEach((text, i) => {
      const last = i === texts.length - 1;
      Speech.speak(text, {
        language: languages[i],
        onDone: last ? finish : undefined,
        onStopped: finish,
        onError: (err) => {
          logger.warning(`speak failed: ${err.message}`);
          finish();
        },
      });
    });
  });
}

export function stopSpeaking(): void {
  currentToken++;
  Speech.stop();
  setSpeaking(false);
}
