export interface CampSession { day: string; time: string; activity: string; details?: string }
export interface Camp {
  id: number; name: string; location: string; start: string; end: string; category: string;
  program: CampSession[]; players: number[]; staffRoles: { memberId: number; role: string }[];
  reportUrl: string; reportName: string; images: string[];
}
export type CampState = 'upcoming' | 'live' | 'done';

export const campFromDb = (r: any): Camp => ({
  id: Number(r.id), name: r.name || '', location: r.location || '', start: r.start_date || '', end: r.end_date || '',
  category: r.team_category || '',
  program: Array.isArray(r.program) ? r.program.map((p: any) => ({ day: String(p.day ?? ''), time: String(p.time ?? ''), activity: String(p.activity ?? ''), details: p.details ? String(p.details) : undefined })) : [],
  players: Array.isArray(r.players) ? r.players.map(Number).filter((n: number) => !Number.isNaN(n)) : [],
  staffRoles: Array.isArray(r.staff_roles) ? r.staff_roles.filter((s: any) => s && s.memberId != null).map((s: any) => ({ memberId: Number(s.memberId), role: String(s.role ?? '') })) : [],
  reportUrl: r.report_url || '', reportName: r.report_name || '',
  images: Array.isArray(r.images) ? r.images.filter((u: any) => typeof u === 'string' && /^https?:/.test(u)) : [],
});

/** Same rule as the website: finished once the end date is past, upcoming before the start. */
export function campState(c: Pick<Camp, 'start' | 'end'>, today = new Date().toISOString().slice(0, 10)): CampState {
  if (c.end && c.end < today) return 'done';
  if (c.start && c.start > today) return 'upcoming';
  return 'live';
}

export const dmy = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '—';
};

/** Group sessions by their day label, keeping the order they were entered in. */
export function groupByDay(program: CampSession[]): { day: string; items: CampSession[] }[] {
  const out: { day: string; items: CampSession[] }[] = [];
  for (const s of program) {
    const last = out[out.length - 1];
    if (last && last.day === s.day) last.items.push(s);
    else out.push({ day: s.day, items: [s] });
  }
  return out;
}
