import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * LOCAL notifications only: reminders scheduled on this device and alerts shown
 * when this device changes a player's availability. Alerts for other staff
 * members' phones need a backend that sends Expo push notifications.
 *
 * Written for expo-notifications in SDK 53 or newer.
 */
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }) as Notifications.NotificationBehavior,
});

async function ensureChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Team updates',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Asks for permission if needed. Returns true when notifications can be shown. */
export async function ensurePermission(): Promise<boolean> {
  try {
    await ensureChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

export async function cancelMatchReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}

/**
 * Schedules "tomorrow" (18:00 the day before) and "match day" (08:00) reminders.
 * The platform stores a match date but no kickoff time, so reminders are pinned
 * to fixed hours instead of an offset from kickoff. Past reminders are skipped.
 */
export async function scheduleMatchReminders(date: string, opponent: string): Promise<number> {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return 0;
  const now = Date.now();
  const plan = [
    { at: new Date(y, m - 1, d - 1, 18, 0), title: 'Match tomorrow', body: `Tunisia vs ${opponent} is tomorrow. Check the squad.` },
    { at: new Date(y, m - 1, d, 8, 0), title: 'Match day', body: `Tunisia vs ${opponent} is today.` },
  ];

  await cancelMatchReminders();
  let scheduled = 0;
  for (const item of plan) {
    if (item.at.getTime() <= now + 5000) continue;
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: item.title, body: item.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.at },
      });
      scheduled += 1;
    } catch {
      // a single failed reminder should not block the other
    }
  }
  return scheduled;
}

export async function presentNow(title: string, body: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
  } catch {
    // ignore
  }
}

/** Replaces every scheduled reminder with this list (the phone's 64-notification limit is far away). */
export async function syncReminders(items: { at: Date; title: string; body: string }[]): Promise<number> {
  await cancelMatchReminders();
  let scheduled = 0;
  for (const item of items) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: item.title, body: item.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.at },
      });
      scheduled += 1;
    } catch {
      // one failed reminder should not block the rest
    }
  }
  return scheduled;
}
