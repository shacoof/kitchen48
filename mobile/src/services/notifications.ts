import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createLogger } from '../lib/logger';

const logger = createLogger('Notifications');

export const TIMER_CHANNEL_ID = 'timer';

let initialized = false;
let permissionStatus: 'granted' | 'denied' | 'undetermined' = 'undetermined';

export interface TimerNotificationData {
  timerId: string;
  sessionId: string;
  recipeId: string;
  stepId: string;
  kind: 'prep' | 'wait';
  [key: string]: unknown;
}

async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Foreground behavior: banner + sound + list entry.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowAlert: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(TIMER_CHANNEL_ID, {
      name: 'Cooking timers',
      description: 'Notifies when a prep or wait timer finishes.',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
    });
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  await ensureInitialized();
  if (permissionStatus === 'granted') return true;

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') {
    permissionStatus = 'granted';
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  permissionStatus = requested.status === 'granted' ? 'granted' : 'denied';
  if (permissionStatus !== 'granted') {
    logger.warning('Notification permission not granted; timers will only alarm when the app is in foreground.');
  }
  return permissionStatus === 'granted';
}

export interface ScheduleArgs {
  firesAt: string;           // ISO
  recipeTitle: string;
  data: TimerNotificationData;
}

export async function scheduleTimerNotification(args: ScheduleArgs): Promise<string | null> {
  await ensureInitialized();
  const fireTime = new Date(args.firesAt).getTime();
  if (fireTime - Date.now() < 1000) {
    // Too soon / already past — skip OS scheduling. Foreground alarm loop
    // will handle it.
    return null;
  }
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: args.recipeTitle,
        body: args.data.kind === 'wait' ? 'Wait timer finished' : 'Prep timer finished',
        data: args.data,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(args.firesAt),
        channelId: TIMER_CHANNEL_ID,
      },
    });
    return id;
  } catch (err) {
    logger.warning(`Failed to schedule notification: ${String(err)}`);
    return null;
  }
}

export async function cancelTimerNotification(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (err) {
    logger.debug(`Cancel notification failed (likely already fired): ${String(err)}`);
  }
}

export function addNotificationResponseListener(
  handler: (data: TimerNotificationData) => void
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as unknown;
    if (isTimerData(data)) handler(data);
  });
  return () => sub.remove();
}

function isTimerData(data: unknown): data is TimerNotificationData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.timerId === 'string' &&
    typeof d.sessionId === 'string' &&
    typeof d.recipeId === 'string' &&
    typeof d.stepId === 'string' &&
    (d.kind === 'prep' || d.kind === 'wait')
  );
}
