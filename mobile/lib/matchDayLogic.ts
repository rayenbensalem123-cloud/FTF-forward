export type MatchDay = 'today' | 'tomorrow' | null;

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Is the match date today or tomorrow on the phone's calendar? */
export function matchDayState(matchDate: string | undefined, now = new Date()): MatchDay {
  if (!matchDate) return null;
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (matchDate.slice(0, 10) === iso(now)) return 'today';
  if (matchDate.slice(0, 10) === iso(t)) return 'tomorrow';
  return null;
}
