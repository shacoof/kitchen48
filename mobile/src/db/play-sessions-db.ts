import { getDatabase } from './database';
import { generateId } from '../lib/id';

export type SessionStatus = 'active' | 'ended';

export interface PlaySession {
  id: string;
  recipeId: string;
  startedAt: string;
  endedAt: string | null;
  currentStepId: string | null;
  status: SessionStatus;
}

interface SessionRow {
  id: string;
  recipe_id: string;
  started_at: string;
  ended_at: string | null;
  current_step_id: string | null;
  status: SessionStatus;
}

function mapRow(row: SessionRow): PlaySession {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    currentStepId: row.current_step_id,
    status: row.status,
  };
}

function now(): string {
  return new Date().toISOString();
}

export async function listActiveSessions(): Promise<PlaySession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    "SELECT * FROM play_sessions WHERE status = 'active' ORDER BY started_at ASC"
  );
  return rows.map(mapRow);
}

export async function getActiveSessionByRecipe(recipeId: string): Promise<PlaySession | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>(
    "SELECT * FROM play_sessions WHERE recipe_id = ? AND status = 'active'",
    [recipeId]
  );
  return row ? mapRow(row) : null;
}

export async function getSessionById(id: string): Promise<PlaySession | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>(
    'SELECT * FROM play_sessions WHERE id = ?',
    [id]
  );
  return row ? mapRow(row) : null;
}

export async function createSession(recipeId: string): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  const timestamp = now();
  await db.runAsync(
    `INSERT INTO play_sessions (id, recipe_id, started_at, ended_at, current_step_id, status)
     VALUES (?, ?, ?, NULL, NULL, 'active')`,
    [id, recipeId, timestamp]
  );
  return id;
}

export async function setCurrentStep(sessionId: string, stepId: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE play_sessions SET current_step_id = ? WHERE id = ?',
    [stepId, sessionId]
  );
}

export async function endSession(sessionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE play_sessions SET status = 'ended', ended_at = ? WHERE id = ?",
    [now(), sessionId]
  );
}
