import { useState, useRef, useCallback, useEffect } from 'react';
import { createLogger } from '../lib/logger';

const logger = createLogger('useAutoSave');

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave<T>(
  saveFn: (data: T) => Promise<void>,
  debounceMs = 1500
) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  const scheduleSave = useCallback(
    (data: T) => {
      // Skip auto-save during initial data load
      if (isInitialLoad.current) return;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(async () => {
        setStatus('saving');
        try {
          await saveFn(data);
          setStatus('saved');
          if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
          statusTimerRef.current = setTimeout(() => setStatus('idle'), 2000);
        } catch (err) {
          logger.error(`Auto-save failed: ${err}`);
          setStatus('error');
        }
      }, debounceMs);
    },
    [saveFn, debounceMs]
  );

  const markLoaded = useCallback(() => {
    isInitialLoad.current = false;
  }, []);

  return { status, scheduleSave, markLoaded };
}
