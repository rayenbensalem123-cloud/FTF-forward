export interface Reminder { at: Date; title: string; body: string }

interface PlanInput {
  match?: { date: string; opponent: string } | null;
  meetings?: { title: string; at: string }[];
  camps?: { name: string; start: string }[];
  now?: number;
}

const ymd = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] as const : null;
};

/**
 * Every local reminder the phone should hold, in time order. The platform stores a match date and
 * a camp start date but no clock time, so those are pinned to fixed hours; a meeting has a real
 * time, so it is announced 30 minutes before. Anything already past is dropped.
 */
export function buildReminderPlan({ match, meetings = [], camps = [], now = Date.now() }: PlanInput): Reminder[] {
  const out: Reminder[] = [];
  const md = match ? ymd(match.date) : null;
  if (match && md) {
    const [y, m, d] = md;
    out.push({ at: new Date(y, m - 1, d - 1, 18, 0), title: 'Match tomorrow', body: `Tunisia vs ${match.opponent} is tomorrow. Check the squad.` });
    out.push({ at: new Date(y, m - 1, d, 8, 0), title: 'Match day', body: `Tunisia vs ${match.opponent} is today.` });
  }
  for (const mt of meetings) {
    const t = Date.parse(mt.at);
    if (!Number.isNaN(t)) out.push({ at: new Date(t - 30 * 60000), title: 'Meeting in 30 minutes', body: mt.title });
  }
  for (const c of camps) {
    const d = ymd(c.start);
    if (d) out.push({ at: new Date(d[0], d[1] - 1, d[2] - 1, 18, 0), title: 'Camp starts tomorrow', body: c.name });
  }
  return out.filter((r) => r.at.getTime() > now + 5000).sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 40);
}
