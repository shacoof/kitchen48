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
  const language = voiceLanguage(lang);
  return new Promise((resolve) => {
    const finish = () => {
      if (token === currentToken) setSpeaking(false);
      resolve();
    };
    texts.forEach((text, i) => {
      const last = i === texts.length - 1;
      Speech.speak(text, {
        language,
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
