/**
 * Lazy access to the expo-speech-recognition native module.
 *
 * The package calls `requireNativeModule` at import time, which throws in
 * Expo Go (the module isn't bundled there). Requiring it lazily lets the
 * rest of Play Mode run in Expo Go with voice reported as unavailable.
 */
import type { ExpoSpeechRecognitionModule as RecognizerModule } from 'expo-speech-recognition';
import { createLogger } from '../lib/logger';

const logger = createLogger('Recognizer');

let cached: typeof RecognizerModule | null | undefined;

export function getRecognizer(): typeof RecognizerModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-speech-recognition').ExpoSpeechRecognitionModule as typeof RecognizerModule;
    if (!cached.isRecognitionAvailable()) {
      logger.warning('Speech recognition service not available on this device');
      cached = null;
    }
  } catch (err) {
    logger.warning(`Speech recognition module not loaded (Expo Go?): ${err}`);
    cached = null;
  }
  return cached;
}
