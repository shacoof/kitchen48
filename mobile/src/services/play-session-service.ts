import {
  createSession,
  endSession as endSessionDb,
  getActiveSessionByRecipe,
  setCurrentStep,
  type PlaySession,
} from '../db/play-sessions-db';
import {
  cancelAllForSession,
  findLiveTimer,
  listLiveTimersForSession,
  pauseTimer as pauseTimerDb,
  resumeTimer as resumeTimerDb,
  cancelTimer as cancelTimerDb,
  startTimer as startTimerDb,
  setNotificationId,
  getTimerById,
  type TimerKind,
  type StepTimer,
} from '../db/step-timers-db';
import {
  ensureNotificationPermission,
  scheduleTimerNotification,
  cancelTimerNotification,
} from './notifications';
import { forgetFired } from './timer-alarms';
import { createLogger } from '../lib/logger';

const logger = createLogger('PlaySession');

/**
 * Idempotent: returns the existing active session for this recipe, or creates
 * a fresh one if none exists. Never produces more than one active session per
 * recipe.
 */
export async function startOrResumeSession(recipeId: string): Promise<PlaySession> {
  const existing = await getActiveSessionByRecipe(recipeId);
  if (existing) {
    logger.debug(`Resumed session ${existing.id} for recipe ${recipeId}`);
    return existing;
  }
  const id = await createSession(recipeId);
  logger.debug(`Started new session ${id} for recipe ${recipeId}`);
  return {
    id,
    recipeId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    currentStepId: null,
    status: 'active',
  };
}

/**
 * End a session and cancel all its running/paused timers. Safe to call twice.
 */
export async function stopSession(sessionId: string): Promise<void> {
  const live = await listLiveTimersForSession(sessionId);
  for (const t of live) {
    await cancelTimerNotification(t.notificationId);
    forgetFired(t.id);
  }
  await cancelAllForSession(sessionId);
  await endSessionDb(sessionId);
  logger.debug(`Stopped session ${sessionId}`);
}

export async function advanceToStep(sessionId: string, stepId: string): Promise<void> {
  await setCurrentStep(sessionId, stepId);
}

export interface StartTimerArgs {
  sessionId: string;
  stepId: string;
  kind: TimerKind;
  durationMs: number;
  recipeId: string;
  recipeTitle: string;
}

/**
 * Start a new timer and schedule a matching OS notification. Asks for
 * notification permission lazily on first use; if the user denies, the
 * timer still works — it just won't fire the OS notification when the app
 * is killed. The in-app foreground alarm still runs via handleFiredTimers.
 */
export async function startStepTimer(args: StartTimerArgs): Promise<string> {
  const timerId = await startTimerDb(args.sessionId, args.stepId, args.kind, args.durationMs);
  const firesAt = new Date(Date.now() + args.durationMs).toISOString();
  await ensureNotificationPermission();
  const notificationId = await scheduleTimerNotification({
    firesAt,
    recipeTitle: args.recipeTitle,
    data: {
      timerId,
      sessionId: args.sessionId,
      recipeId: args.recipeId,
      stepId: args.stepId,
      kind: args.kind,
    },
  });
  if (notificationId) {
    await setNotificationId(timerId, notificationId);
  }
  return timerId;
}

export async function pauseStepTimer(timerId: string): Promise<void> {
  const existing = await getTimerById(timerId);
  await cancelTimerNotification(existing?.notificationId ?? null);
  if (existing) await setNotificationId(timerId, null);
  await pauseTimerDb(timerId);
}

export async function resumeStepTimer(timerId: string, recipeId: string, recipeTitle: string): Promise<void> {
  await resumeTimerDb(timerId);
  const refreshed = await getTimerById(timerId);
  if (!refreshed || refreshed.state !== 'running') return;
  await ensureNotificationPermission();
  const notificationId = await scheduleTimerNotification({
    firesAt: refreshed.firesAt,
    recipeTitle,
    data: {
      timerId,
      sessionId: refreshed.sessionId,
      recipeId,
      stepId: refreshed.stepId,
      kind: refreshed.kind,
    },
  });
  if (notificationId) await setNotificationId(timerId, notificationId);
}

export async function cancelStepTimer(timerId: string): Promise<void> {
  const existing = await getTimerById(timerId);
  await cancelTimerNotification(existing?.notificationId ?? null);
  if (existing) await setNotificationId(timerId, null);
  forgetFired(timerId);
  await cancelTimerDb(timerId);
}

// Re-export read helpers so play.tsx keeps a single import surface.
export { findLiveTimer };
export type { StepTimer };
