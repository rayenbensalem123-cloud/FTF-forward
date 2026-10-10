export type CheckinState = 'fit' | 'tired' | 'sore' | 'unwell';
export interface Checkin { memberId: number; day: string; state: CheckinState; note: string }

export const STATES: CheckinState[] = ['fit', 'tired', 'sore', 'unwell'];

export const checkinFromDb = (r: any): Checkin => ({
  memberId: Number(r.member_id), day: String(r.day ?? '').slice(0, 10),
  state: STATES.includes(r.state) ? r.state : 'fit', note: r.note ?? '',
});

/** The database's "today" is UTC (current_date), so the app compares with the UTC date too. */
export const todayUtc = (now = new Date()) => now.toISOString().slice(0, 10);

/** Summary for staff: one entry per player, today's rows only, and who still has not answered. */
export function summarize(rows: Checkin[], squadIds: number[], today = todayUtc()) {
  const mine = rows.filter((r) => r.day === today);
  const byMember = new Map(mine.map((r) => [r.memberId, r]));
  const counts: Record<CheckinState, number> = { fit: 0, tired: 0, sore: 0, unwell: 0 };
  for (const r of byMember.values()) counts[r.state] += 1;
  return {
    counts,
    answered: byMember.size,
    attention: [...byMember.values()].filter((r) => r.state !== 'fit'),
    missing: squadIds.filter((id) => !byMember.has(id)),
  };
}
