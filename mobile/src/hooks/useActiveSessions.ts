import { useCallback, useEffect, useState } from 'react';
import {
  listActiveSessions,
  type PlaySession,
} from '../db/play-sessions-db';
import {
  listLiveTimersForSession,
  type StepTimer,
} from '../db/step-timers-db';
import { getRecipeById, type Recipe } from '../db/recipes-db';

export interface ActiveSessionSnapshot {
  session: PlaySession;
  recipe: Recipe | null;
  timers: StepTimer[];
  nextTimer: StepTimer | null;
}

/**
 * Reactive list of active sessions with recipe metadata and next-firing timer.
 * Re-queries every `pollIntervalMs` so tab badges, dashboards, and pill-like
 * surfaces stay current. Safe to mount in layout components.
 */
export function useActiveSessions(pollIntervalMs = 1000): ActiveSessionSnapshot[] {
  const [snapshots, setSnapshots] = useState<ActiveSessionSnapshot[]>([]);

  const refresh = useCallback(async () => {
    const sessions = await listActiveSessions();
    const results: ActiveSessionSnapshot[] = [];
    for (const session of sessions) {
      const [recipe, timers] = await Promise.all([
        getRecipeById(session.recipeId).then((r) => (r ? (r as Recipe) : null)),
        listLiveTimersForSession(session.id),
      ]);
      const nextTimer = timers
        .filter((t) => t.state === 'running')
        .sort((a, b) => new Date(a.firesAt).getTime() - new Date(b.firesAt).getTime())[0] ?? null;
      results.push({ session, recipe, timers, nextTimer });
    }
    setSnapshots(results);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(id);
  }, [refresh, pollIntervalMs]);

  return snapshots;
}
