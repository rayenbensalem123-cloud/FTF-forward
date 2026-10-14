import type { Camp } from '@/lib/campsLogic';

export interface SavedEvent { id: string; sig: string }
export type SavedEvents = Record<string, SavedEvent>;

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Camps this person is named in (players list for players, staff list for staff). Dated camps only. */
export function campsForUser(camps: Camp[], user: { role: string; memberId?: number | null }): Camp[] {
  if (user.memberId == null) return [];
  const id = user.memberId;
  return camps.filter((c) => {
    if (!ISO.test(c.start)) return false;
    return user.role === 'player' ? c.players.includes(id) : c.staffRoles.some((s) => s.memberId === id);
  });
}

/** Changes whenever something shown in the calendar event changes. */
export const campSig = (c: Camp) => [c.name, c.location, c.start, c.end, c.category].join('|');

export const campEnd = (c: Camp) => (ISO.test(c.end) && c.end >= c.start ? c.end : c.start);

export interface SyncPlan {
  create: Camp[];
  update: { camp: Camp; eventId: string }[];
  /** campIds whose events must be deleted (no longer called up, or camp removed) */
  remove: string[];
}

export function planSync(wanted: Camp[], saved: SavedEvents): SyncPlan {
  const plan: SyncPlan = { create: [], update: [], remove: [] };
  const wantedIds = new Set(wanted.map((c) => String(c.id)));
  for (const c of wanted) {
    const s = saved[String(c.id)];
    if (!s) plan.create.push(c);
    else if (s.sig !== campSig(c)) plan.update.push({ camp: c, eventId: s.id });
  }
  for (const campId of Object.keys(saved)) if (!wantedIds.has(campId)) plan.remove.push(campId);
  return plan;
}
