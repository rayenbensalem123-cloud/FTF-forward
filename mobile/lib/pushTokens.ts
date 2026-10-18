import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ensurePermission } from '@/lib/notifications';
import { currentSession, remove, upsert } from '@/lib/supabase';

/**
 * This phone's push token, stored in the platform's push_tokens table so the
 * database can reach it when a player logs a club match - even with the app
 * closed. The other half is supabase-push.sql.
 *
 * Expo Go cannot receive remote notifications (expo-notifications is
 * remote-disabled in Expo Go from SDK 53), so this quietly does nothing there.
 * The 30 second in-app check in NotificationsContext covers that case.
 */

export type PushRegistration = 'saved' | 'denied' | 'unsupported' | 'failed';

/** 'storeClient' means Expo Go, which can never hold a remote push token. */
export function pushSupported(): boolean {
  return Platform.OS !== 'web' && Constants.executionEnvironment !== 'storeClient';
}

function projectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

let currentToken: string | null = null;

export const getCurrentPushToken = () => currentToken;

/** Asks for permission once, then stores the token against the signed-in account. */
export async function registerPushToken(): Promise<PushRegistration> {
  if (!pushSupported()) return 'unsupported';
  const profileId = currentSession()?.userId;
  if (!profileId) return 'failed';

  try {
    // Same permission and channel as the reminders use ("Team updates").
    if (!(await ensurePermission())) return 'denied';

    const id = projectId();
    const token = (await Notifications.getExpoPushTokenAsync(id ? { projectId: id } : {})).data;
    if (!token) return 'failed';
    currentToken = token;

    await upsert(
      'push_tokens',
      { profile_id: profileId, token, platform: Platform.OS, updated_at: new Date().toISOString() },
      'profile_id',
    );
    return 'saved';
  } catch {
    // No project id, no FCM/APNs credentials yet, or offline. The app carries on.
    return 'failed';
  }
}

/** Forgets this phone. Called before sign-out, while the session is still valid. */
export async function unregisterPushToken(): Promise<void> {
  currentToken = null;
  const profileId = currentSession()?.userId;
  if (!profileId) return;
  try {
    await remove('push_tokens', `profile_id=eq.${profileId}`);
  } catch {
    // No row, or the profile is already gone: nothing to forget.
  }
}
