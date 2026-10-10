import { insert, select, update } from '@/lib/supabase';
import { checkinFromDb, todayUtc, type Checkin, type CheckinState } from '@/lib/checkinsLogic';

export * from '@/lib/checkinsLogic';

/** Row-level security decides the scope: a player gets only her own rows, staff everyone's. */
export async function fetchRecentCheckins(): Promise<Checkin[]> {
  const rows = await select<any>('player_checkins', `select=member_id,day,state,note&day=gte.${todayUtc(new Date(Date.now() - 86400000))}&order=day.desc&limit=500`);
  return rows.map(checkinFromDb);
}

/** One row per player per day: change today's if it exists, otherwise add it. */
export async function saveCheckin(memberId: number, state: CheckinState, note = ''): Promise<void> {
  const day = todayUtc();
  const existing = await select<any>('player_checkins', `select=id&member_id=eq.${memberId}&day=eq.${day}`);
  if (existing[0]) await update('player_checkins', `id=eq.${existing[0].id}`, { state, note, updated_at: new Date().toISOString() });
  else await insert('player_checkins', { member_id: memberId, state, note });
}
