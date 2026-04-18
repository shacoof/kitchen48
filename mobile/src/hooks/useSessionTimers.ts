import { useCallback, useEffect, useState } from 'react';
import {
  listTimersForSession,
  type StepTimer,
} from '../db/step-timers-db';

/**
 * Live timer snapshot for one session. Returns all timers (including finished)
 * and re-queries on demand. The countdown value should be computed by the
 * consumer from `firesAt` vs. Date.now() on a tick (every 250–500 ms is plenty).
 */
export function useSessionTimers(sessionId: string | null, tickMs = 500) {
  const [timers, setTimers] = useState<StepTimer[]>([]);
  const [, setTick] = useState(0);

  const refresh = useCallback(async () => {
    if (!sessionId) {
      setTimers([]);
      return;
    }
    const rows = await listTimersForSession(sessionId);
    setTimers(rows);
  }, [sessionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  return { timers, refresh };
}

export function computeRemainingMs(timer: StepTimer): number {
  if (timer.state === 'paused') return timer.remainingMs ?? 0;
  if (timer.state === 'running') {
    return Math.max(0, new Date(timer.firesAt).getTime() - Date.now());
  }
  return 0;
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
