import * as Haptics from 'expo-haptics';
import { markFired, setNotificationId, getTimerById, type StepTimer } from '../db/step-timers-db';
import { cancelTimerNotification } from './notifications';
import { createLogger } from '../lib/logger';

const logger = createLogger('TimerAlarms');

// Timers the app has already alerted on (since app launch). Prevents repeat
// haptics while the user lingers on a step whose timer just fired.
const firedInSession = new Set<string>();

/**
 * Given the latest snapshot of a session's timers and the current wall-clock
 * time, trigger foreground alarm side-effects for timers that just hit zero:
 * - Short notification-style haptic buzz
 * - Mark the DB state as 'fired'
 * - Cancel the OS notification (it may have already fired; cancel is a no-op then)
 *
 * The OS notification itself handles sound/banner when the app is foreground or
 * background. This function is about the additional haptic nudge and keeping
 * the DB authoritative.
 */
export async function handleFiredTimers(timers: StepTimer[]): Promise<void> {
  const now = Date.now();
  for (const timer of timers) {
    if (timer.state !== 'running') continue;
    const remaining = new Date(timer.firesAt).getTime() - now;
    if (remaining > 0) continue;
    if (firedInSession.has(timer.id)) continue;
    firedInSession.add(timer.id);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      logger.debug(`Haptics failed: ${String(err)}`);
    }
    await markFired(timer.id);
    await cancelTimerNotification(timer.notificationId);
    await setNotificationId(timer.id, null);
  }
}

/** Drop the in-memory "already fired" tracking for a timer — e.g. when cancelled. */
export function forgetFired(timerId: string): void {
  firedInSession.delete(timerId);
}

/** Lookup helper used by deep links. */
export async function getStepTimerById(timerId: string): Promise<StepTimer | null> {
  return getTimerById(timerId);
}
