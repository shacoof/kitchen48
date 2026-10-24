import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getRecognizer } from '../voice/recognizer';
import { ALL_KEYWORDS, matchVoiceCommand, type MatchedCommand } from '../voice/commands';
import { isSpeaking, onSpeakingChange, voiceLanguage } from '../services/tts';
import { createLogger } from '../lib/logger';

const logger = createLogger('useVoiceControl');

/** off = not listening; continuous = mic toggle on; ptt = one push-to-talk utterance. */
export type VoiceMode = 'off' | 'continuous' | 'ptt';

export type VoiceError = 'unavailable' | 'permission' | 'failed';

export interface LastHeard {
  text: string;
  command: MatchedCommand | null;
}

interface Options {
  lang: string;
  onCommand: (cmd: MatchedCommand) => void;
}

const RESTART_DELAY_MS = 300;
// Consecutive real errors (not silence) before continuous mode gives up.
const MAX_ERRORS = 5;

/**
 * Speech recognition for Play Mode.
 *
 * Recognition runs one utterance at a time and is restarted after each
 * `end` while continuous mode is on — more reliable across Android/iOS than
 * native continuous sessions. Half-duplex: recognition is aborted while TTS
 * is speaking and resumes when it finishes, so the mic never transcribes
 * the app's own voice.
 */
export function useVoiceControl({ lang, onCommand }: Options) {
  const recognizer = getRecognizer();
  const [mode, setMode] = useState<VoiceMode>('off');
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState<LastHeard | null>(null);
  const [error, setError] = useState<VoiceError | null>(recognizer ? null : 'unavailable');

  const modeRef = useRef<VoiceMode>('off');
  const onCommandRef = useRef(onCommand);
  const langRef = useRef(lang);
  const errorCountRef = useRef(0);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permissionRef = useRef(false);

  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  const updateMode = useCallback((next: VoiceMode) => {
    modeRef.current = next;
    setMode(next);
  }, []);

  const clearRestart = () => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
  };

  const startOnce = useCallback(() => {
    if (!recognizer || isSpeaking() || AppState.currentState !== 'active') return;
    try {
      recognizer.start({
        lang: voiceLanguage(langRef.current),
        interimResults: false,
        maxAlternatives: 3,
        continuous: false,
        contextualStrings: ALL_KEYWORDS,
        addsPunctuation: false,
      });
    } catch (err) {
      logger.error(`start failed: ${err}`);
      setError('failed');
      updateMode('off');
    }
  }, [recognizer, updateMode]);

  const scheduleRestart = useCallback(() => {
    clearRestart();
    restartTimerRef.current = setTimeout(() => {
      if (modeRef.current === 'continuous') startOnce();
    }, RESTART_DELAY_MS);
  }, [startOnce]);

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    if (!recognizer) return false;
    if (permissionRef.current) return true;
    const res = await recognizer.requestPermissionsAsync();
    permissionRef.current = res.granted;
    if (!res.granted) {
      logger.warning('Microphone / speech permission denied');
      setError('permission');
    }
    return res.granted;
  }, [recognizer]);

  // Native event wiring
  useEffect(() => {
    if (!recognizer) return;
    const subs = [
      recognizer.addListener('start', () => setListening(true)),
      recognizer.addListener('end', () => {
        setListening(false);
        if (modeRef.current === 'ptt') updateMode('off');
        else if (modeRef.current === 'continuous') scheduleRestart();
      }),
      recognizer.addListener('result', (ev) => {
        if (!ev.isFinal) return;
        errorCountRef.current = 0;
        const alternatives = ev.results.map((r) => r.transcript).filter(Boolean);
        if (alternatives.length === 0) return;
        let matched: MatchedCommand | null = null;
        for (const alt of alternatives) {
          matched = matchVoiceCommand(alt);
          if (matched) break;
        }
        setLastHeard({ text: alternatives[0], command: matched });
        logger.debug(`heard "${alternatives[0]}" → ${matched?.id ?? 'no match'}`);
        if (matched) onCommandRef.current(matched);
      }),
      recognizer.addListener('error', (ev) => {
        // Silence and our own aborts are normal in a listen/restart loop.
        if (ev.error === 'no-speech' || ev.error === 'aborted' || ev.error === 'speech-timeout') return;
        logger.warning(`recognition error: ${ev.error} ${ev.message}`);
        if (ev.error === 'not-allowed') {
          permissionRef.current = false;
          setError('permission');
          updateMode('off');
          return;
        }
        errorCountRef.current += 1;
        if (errorCountRef.current >= MAX_ERRORS) {
          setError('failed');
          updateMode('off');
        }
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [recognizer, scheduleRestart, updateMode]);

  // Half-duplex with TTS
  useEffect(() => {
    if (!recognizer) return;
    return onSpeakingChange((speaking) => {
      if (speaking) {
        clearRestart();
        recognizer.abort();
      } else if (modeRef.current === 'continuous') {
        scheduleRestart();
      }
    });
  }, [recognizer, scheduleRestart]);

  // Pause in background, resume in foreground
  useEffect(() => {
    if (!recognizer) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        clearRestart();
        recognizer.abort();
        if (modeRef.current === 'ptt') updateMode('off');
      } else if (modeRef.current === 'continuous') {
        scheduleRestart();
      }
    });
    return () => sub.remove();
  }, [recognizer, scheduleRestart, updateMode]);

  // Stop on unmount
  useEffect(() => () => {
    clearRestart();
    modeRef.current = 'off';
    recognizer?.abort();
  }, [recognizer]);

  const toggleContinuous = useCallback(async () => {
    if (!recognizer) return;
    if (modeRef.current === 'continuous') {
      updateMode('off');
      clearRestart();
      recognizer.abort();
      return;
    }
    if (!(await ensurePermission())) return;
    setError(null);
    errorCountRef.current = 0;
    updateMode('continuous');
    startOnce();
  }, [recognizer, ensurePermission, startOnce, updateMode]);

  const pushToTalk = useCallback(async () => {
    if (!recognizer || modeRef.current !== 'off') return;
    if (!(await ensurePermission())) return;
    setError(null);
    updateMode('ptt');
    startOnce();
  }, [recognizer, ensurePermission, startOnce, updateMode]);

  return {
    available: !!recognizer,
    mode,
    listening,
    lastHeard,
    error,
    toggleContinuous,
    pushToTalk,
  };
}
