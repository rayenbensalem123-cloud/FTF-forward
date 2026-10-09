import AsyncStorage from '@react-native-async-storage/async-storage';

/** Small JSON wrapper around AsyncStorage. Reads never throw; failures return null. */
export async function getJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function setJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is a cache: a failed write must never break the app.
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const KEYS = {
  players: 'wnt.players.v1',
  match: 'wnt.match.v1',
  user: 'wnt.user.v1',
  session: 'wnt.session.v1',
  notifications: 'wnt.notifications.v1',
  settings: 'wnt.settings.v1',
  bingoPicks: 'wnt.bingo-picks.v1',
  gameScores: 'wnt.game-scores.v1',
} as const;
