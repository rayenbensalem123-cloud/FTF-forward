import type { Availability, Category, FormResult, FormationId, Match, Player, Position, SquadTemplate, User } from '@/types';

/**
 * Pure translation between the website's database rows and the app's types.
 * No React Native imports, so it can be tested with plain node.
 */

const POS_FROM_DB: Record<string, Position> = { GOALKEEPER: 'GK', DEFENDER: 'DEF', MIDFIELDER: 'MID', FORWARD: 'FWD' };
export const POS_TO_DB: Record<Position, string> = { GK: 'GOALKEEPER', DEF: 'DEFENDER', MID: 'MIDFIELDER', FWD: 'FORWARD' };
const CAT_FROM_DB: Record<string, Category> = { SENIORS: 'Seniors', U20: 'U-20', U17: 'U-17' };
export const CAT_TO_DB: Record<Category, string> = { Seniors: 'SENIORS', 'U-20': 'U20', 'U-17': 'U17' };

const FORMATION_IDS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2'];

export function toNum(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

/** Age from "DD/MM/YYYY" (the website's format) or "YYYY-MM-DD"; 0 when unreadable. */
export function ageFromBirthdate(bd: string | null | undefined, now = new Date()): number {
  if (!bd) return 0;
  let y: number, m: number, d: number;
  if (bd.includes('/')) [d, m, y] = bd.split('/').map(Number);
  else if (bd.includes('-')) [y, m, d] = bd.split('-').map(Number);
  else return 0;
  if (!y || !m || !d) return 0;
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return age >= 0 && age < 100 ? age : 0;
}

/** True for "DD/MM/YYYY" with a real calendar date. */
export function isValidBirthdate(bd: string): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(bd);
  if (!m) return false;
  const d = +m[1], mo = +m[2], y = +m[3];
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d && y > 1950;
}

export interface InjuryRow {
  id: number;
  member_id: number;
  status: 'active' | 'recovering' | 'recovered';
  injury_type?: string | null;
  body_part?: string | null;
  severity?: string | null;
  occurred_on?: string | null;
  expected_return?: string | null;
  notes?: string | null;
  created_at?: string | null;
}

function injuryLine(i: InjuryRow): string {
  const head = [i.injury_type, i.body_part ? `(${i.body_part})` : ''].filter(Boolean).join(' ') || 'Injury';
  const tail = i.notes ? `: ${i.notes}` : '';
  const state = i.status === 'recovered' ? ' [recovered]' : i.status === 'recovering' ? ' [recovering]' : ' [active]';
  return `${head}${tail}${state}`;
}

export function memberToPlayer(r: any, injuries: InjuryRow[], canViewMedical: boolean): Player | null {
  // The members table also holds staff (role COACHES); only players belong in the squad.
  if (r.role !== 'PLAYERS') return null;
  const mine = injuries.filter((i) => i.member_id === r.id);
  const active = mine.find((i) => i.status === 'active');
  const recovering = mine.find((i) => i.status === 'recovering');
  const open = active ?? recovering;
  const suspended = !!r.suspended;

  let status: Availability;
  if (suspended) status = 'suspended';
  // Without the viewMedical permission the database returns no injuries at all,
  // which must not be mistaken for "everyone is fit".
  else if (!canViewMedical) status = 'unknown';
  else if (active) status = 'injured';
  else if (recovering) status = 'recovery';
  else status = 'fit';

  const log = [...mine]
    .sort((a, b) => String(b.occurred_on || b.created_at || '').localeCompare(String(a.occurred_on || a.created_at || '')))
    .map((i) => ({ date: String(i.occurred_on || i.created_at || '').slice(0, 10), note: injuryLine(i) }));

  return {
    id: String(r.id),
    name: r.name || 'Unnamed player',
    number: r.jersey_number != null ? toNum(r.jersey_number) : 0,
    position: POS_FROM_DB[r.position] ?? 'MID',
    category: CAT_FROM_DB[r.team_category] ?? 'Seniors',
    club: r.club || 'Unattached',
    age: ageFromBirthdate(r.birthdate),
    birthdate: r.birthdate || '',
    imagePath: r.image_path || undefined,
    photoUrl: typeof r.image_url === 'string' && /^https?:/.test(r.image_url) ? r.image_url : undefined,
    caps: toNum(r.nat_matches),
    goals: toNum(r.goals),
    assists: toNum(r.assists),
    yellowCards: toNum(r.yellow_cards),
    redCards: toNum(r.red_cards),
    suspended,
    status,
    openInjuryId: open?.id,
    medicalNote: open ? open.notes || open.injury_type || '' : '',
    medicalLog: log,
  };
}

export function matchFromDb(r: any): Match {
  const d = r.details && typeof r.details === 'object' ? r.details : {};
  const poss = toNum(d.tunisiaPossession, NaN);
  return {
    id: r.id,
    opponent: r.opponent || '',
    date: String(r.match_date || '').slice(0, 10),
    competition: r.competition || '',
    category: CAT_FROM_DB[r.category] ?? 'Seniors',
    venue: d.venue || '',
    result: typeof d.result === 'string' ? d.result.trim() : '',
    // Matches saved by staff without approval rights wait as "pending" on the website.
    approved: d.status === undefined || d.status === 'approved',
    tunisiaPossession: Number.isFinite(poss) && poss > 0 ? poss : null,
  };
}

/** "2-1" -> {for:2, against:1}; null when it isn't a score. */
export function parseScore(result: string): { gf: number; ga: number } | null {
  const m = /^(\d+)\s*-\s*(\d+)$/.exec(result.trim());
  return m ? { gf: +m[1], ga: +m[2] } : null;
}

/** Same rule as the website: dated today or later, no result yet, earliest first. Seniors win ties of date. */
export function nextMatch(matches: Match[], today: string): Match | null {
  const up = matches
    .filter((m) => m.approved && m.date && m.date >= today && !m.result)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.category === 'Seniors' ? -1 : 1));
  return up[0] ?? null;
}

export function upcomingMatches(matches: Match[], today: string): Match[] {
  return matches
    .filter((m) => m.approved && m.date && m.date >= today && !m.result)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Last five played matches, oldest first. Seniors only, unless there are none. */
export function recentForm(matches: Match[]): FormResult[] {
  const played = matches.filter((m) => m.approved && parseScore(m.result));
  const seniors = played.filter((m) => m.category === 'Seniors');
  const pool = seniors.length > 0 ? seniors : played;
  return pool
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-5)
    .map((m) => {
      const s = parseScore(m.result)!;
      return {
        result: s.gf > s.ga ? 'W' : s.gf < s.ga ? 'L' : 'D',
        opponent: m.opponent.replace(/[^\p{L}]/gu, '').slice(0, 3).toUpperCase() || '—',
        goalsFor: s.gf,
        goalsAgainst: s.ga,
      } as FormResult;
    });
}

export function averagePossession(matches: Match[]): number | null {
  const vals = matches.filter((m) => m.approved && m.tunisiaPossession !== null).slice(-5).map((m) => m.tunisiaPossession as number);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}

export function templateFromDb(r: any): SquadTemplate {
  return {
    id: r.id,
    name: r.name || 'Lineup',
    formation: (FORMATION_IDS.includes(r.formation) ? r.formation : '4-3-3') as FormationId,
    category: CAT_FROM_DB[r.team_category] ?? 'Seniors',
    slots: r.slots && typeof r.slots === 'object' ? r.slots : {},
    createdBy: r.created_by_username || '',
  };
}

export function profileToUser(p: any): User {
  const name = [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || p.username;
  const perms: Record<string, boolean> = {};
  if (p.permissions && typeof p.permissions === 'object') {
    for (const [k, v] of Object.entries(p.permissions)) perms[k] = v === true;
  }
  return {
    username: p.username,
    name,
    role: p.role === 'admin' || p.role === 'player' ? p.role : 'staff',
    permissions: perms,
    memberId: p.member_id ?? null,
  };
}
