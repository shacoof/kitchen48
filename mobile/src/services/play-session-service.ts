import {
  createSession,
  endSession as endSessionDb,
  getActiveSessionByRecipe,
  setCurrentStep,
  type PlaySession,
} from '../db/play-sessions-db';
import { cancelAllForSession } from '../db/step-timers-db';
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
  await cancelAllForSession(sessionId);
  await endSessionDb(sessionId);
  logger.debug(`Stopped session ${sessionId}`);
}

export async function advanceToStep(sessionId: string, stepId: string): Promise<void> {
  await setCurrentStep(sessionId, stepId);
}
