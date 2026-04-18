import { getDatabase } from './database';
import { generateId } from '../lib/id';

export type TimerKind = 'prep' | 'wait';
export type TimerState = 'running' | 'paused' | 'fired' | 'cancelled';

export interface StepTimer {
  id: string;
  sessionId: string;
  stepId: string;
  kind: TimerKind;
  startedAt: string;
  durationMs: number;
  firesAt: string;
  state: TimerState;
  pausedAt: string | null;
  remainingMs: number | null;
}

interface TimerRow {
  id: string;
  session_id: string;
  step_id: string;
  kind: TimerKind;
  started_at: string;
  duration_ms: number;
  fires_at: string;
  state: TimerState;
  paused_at: string | null;
  remaining_ms: number | null;
}

function mapRow(row: TimerRow): StepTimer {
  return {
    id: row.id,
    sessionId: row.session_id,
    stepId: row.step_id,
    kind: row.kind,
    startedAt: row.started_at,
    durationMs: row.duration_ms,
    firesAt: row.fires_at,
    state: row.state,
    pausedAt: row.paused_at,
    remainingMs: row.remaining_ms,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function addMs(isoBase: string, ms: number): string {
  return new Date(new Date(isoBase).getTime() + ms).toISOString();
}

export async function listTimersForSession(sessionId: string): Promise<StepTimer[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TimerRow>(
    'SELECT * FROM step_timers WHERE session_id = ? ORDER BY started_at ASC',
    [sessionId]
  );
  return rows.map(mapRow);
}

export async function listLiveTimersForSession(sessionId: string): Promise<StepTimer[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TimerRow>(
    "SELECT * FROM step_timers WHERE session_id = ? AND state IN ('running', 'paused') ORDER BY fires_at ASC",
    [sessionId]
  );
  return rows.map(mapRow);
}

export async function findLiveTimer(
  sessionId: string,
  stepId: string,
  kind: TimerKind
): Promise<StepTimer | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TimerRow>(
    "SELECT * FROM step_timers WHERE session_id = ? AND step_id = ? AND kind = ? AND state IN ('running', 'paused')",
    [sessionId, stepId, kind]
  );
  return row ? mapRow(row) : null;
}

export async function startTimer(
  sessionId: string,
  stepId: string,
  kind: TimerKind,
  durationMs: number
): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  const startedAt = nowIso();
  const firesAt = addMs(startedAt, durationMs);
  await db.runAsync(
    `INSERT INTO step_timers (id, session_id, step_id, kind, started_at, duration_ms, fires_at, state, paused_at, remaining_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'running', NULL, NULL)`,
    [id, sessionId, stepId, kind, startedAt, durationMs, firesAt]
  );
  return id;
}

export async function pauseTimer(timerId: string): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TimerRow>(
    "SELECT * FROM step_timers WHERE id = ? AND state = 'running'",
    [timerId]
  );
  if (!row) return;
  const remaining = Math.max(0, new Date(row.fires_at).getTime() - Date.now());
  await db.runAsync(
    "UPDATE step_timers SET state = 'paused', paused_at = ?, remaining_ms = ? WHERE id = ?",
    [nowIso(), remaining, timerId]
  );
}

export async function resumeTimer(timerId: string): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TimerRow>(
    "SELECT * FROM step_timers WHERE id = ? AND state = 'paused'",
    [timerId]
  );
  if (!row || row.remaining_ms == null) return;
  const startedAt = nowIso();
  const firesAt = addMs(startedAt, row.remaining_ms);
  await db.runAsync(
    `UPDATE step_timers
       SET state = 'running',
           started_at = ?,
           duration_ms = ?,
           fires_at = ?,
           paused_at = NULL,
           remaining_ms = NULL
     WHERE id = ?`,
    [startedAt, row.remaining_ms, firesAt, timerId]
  );
}

export async function cancelTimer(timerId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE step_timers SET state = 'cancelled' WHERE id = ? AND state IN ('running', 'paused')",
    [timerId]
  );
}

export async function cancelAllForSession(sessionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE step_timers SET state = 'cancelled' WHERE session_id = ? AND state IN ('running', 'paused')",
    [sessionId]
  );
}

export async function markFired(timerId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE step_timers SET state = 'fired' WHERE id = ? AND state = 'running'",
    [timerId]
  );
}
