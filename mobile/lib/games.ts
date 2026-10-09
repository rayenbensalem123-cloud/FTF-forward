import { currentSession, select, upsert, insert } from '@/lib/supabase';
import { getJson, KEYS, setJson } from '@/lib/storage';
import type { PickEntry } from '@/lib/bingo-logic';

/**
 * Storage for the two staff games. Same tables as the website (supabase-games.sql), so picks and
 * scores are shared. If those tables are missing or the network fails, everything falls back to
 * this phone, so the games always work and the person is told when a result is not shared.
 */
export type StorageMode = 'shared' | 'device';

export interface ScoreRow { username: string; best: number; plays: number }

type LocalPicks = Record<string, Record<string, { picks: string[]; updatedAt: string }>>;
type LocalScore = { username: string; game: string; points: number; at: string };

export async function savePicks(username: string, matchKey: string, picks: string[]): Promise<StorageMode> {
  const now = new Date().toISOString();
  const userId = currentSession()?.userId;
  try {
    await upsert('bingo_picks', { ...(userId ? { user_id: userId } : {}), username, match_key: matchKey, picks, updated_at: now }, 'user_id,match_key');
    return 'shared';
  } catch {
    const all = (await getJson<LocalPicks>(KEYS.bingoPicks)) ?? {};
    all[username] = { ...(all[username] ?? {}), [matchKey]: { picks, updatedAt: now } };
    await setJson(KEYS.bingoPicks, all);
    return 'device';
  }
}

export async function fetchPicks(): Promise<{ entries: PickEntry[]; mode: StorageMode }> {
  try {
    const data = await select<any>('bingo_picks', 'select=username,match_key,picks,updated_at&limit=5000');
    const entries: PickEntry[] = data.map((r) => ({
      username: r.username,
      matchKey: r.match_key,
      picks: Array.isArray(r.picks) ? r.picks : [],
      updatedAt: r.updated_at,
    }));
    // Picks saved on this phone while the shared table was unreachable still count for their owner.
    const local = (await getJson<LocalPicks>(KEYS.bingoPicks)) ?? {};
    for (const [username, byKey] of Object.entries(local))
      for (const [matchKey, v] of Object.entries(byKey))
        if (!entries.some((e) => e.username === username && e.matchKey === matchKey))
          entries.push({ username, matchKey, picks: v.picks, updatedAt: v.updatedAt });
    return { entries, mode: 'shared' };
  } catch {
    const all = (await getJson<LocalPicks>(KEYS.bingoPicks)) ?? {};
    const entries: PickEntry[] = [];
    for (const [username, byKey] of Object.entries(all))
      for (const [matchKey, v] of Object.entries(byKey)) entries.push({ username, matchKey, picks: v.picks, updatedAt: v.updatedAt });
    return { entries, mode: 'device' };
  }
}

export async function saveScore(username: string, game: string, points: number): Promise<StorageMode> {
  const userId = currentSession()?.userId;
  try {
    await insert('game_scores', { ...(userId ? { user_id: userId } : {}), username, game, points });
    return 'shared';
  } catch {
    const all = (await getJson<LocalScore[]>(KEYS.gameScores)) ?? [];
    all.push({ username, game, points, at: new Date().toISOString() });
    await setJson(KEYS.gameScores, all.slice(-500));
    return 'device';
  }
}

export async function fetchTopScores(game: string): Promise<{ rows: ScoreRow[]; mode: StorageMode }> {
  let list: { username: string; points: number }[];
  let mode: StorageMode = 'shared';
  try {
    list = await select<any>('game_scores', `select=username,points&game=eq.${encodeURIComponent(game)}&limit=2000`);
  } catch {
    list = ((await getJson<LocalScore[]>(KEYS.gameScores)) ?? []).filter((s) => s.game === game);
    mode = 'device';
  }
  const by = new Map<string, ScoreRow>();
  for (const s of list) {
    const r = by.get(s.username) ?? { username: s.username, best: 0, plays: 0 };
    r.best = Math.max(r.best, s.points);
    r.plays += 1;
    by.set(s.username, r);
  }
  return { rows: [...by.values()].sort((a, b) => b.best - a.best || b.plays - a.plays).slice(0, 10), mode };
}
