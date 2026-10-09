/** A player's self-logged club match, from the platform's club_match_reports table. */
export interface ClubReport {
  id: number;
  memberId: number;
  /** YYYY-MM-DD or '' */
  date: string;
  opponent: string;
  competition: string;
  result: string;
  didNotPlay: boolean;
  position: string;
  isStarting: boolean | null;
  minutes: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  rating: number | null;
  highlightsUrl: string;
  hadInjury: boolean | null;
  injuryNotes: string;
  notes: string;
  verified: boolean;
  verifiedBy: string;
}

export function reportFromDb(r: any): ClubReport {
  return {
    id: r.id,
    memberId: r.member_id,
    date: r.match_date ?? '',
    opponent: r.opponent ?? '',
    competition: r.competition ?? '',
    result: r.result ?? '',
    didNotPlay: !!r.did_not_play,
    position: r.position_played ?? '',
    isStarting: r.is_starting ?? null,
    minutes: r.minutes_played ?? 0,
    goals: r.goals ?? 0,
    assists: r.assists ?? 0,
    yellow: r.yellow_cards ?? 0,
    red: r.red_cards ?? 0,
    rating: r.rating == null ? null : Number(r.rating),
    highlightsUrl: r.highlights_url ?? '',
    hadInjury: r.had_injury ?? null,
    injuryNotes: r.injury_notes ?? '',
    notes: r.notes ?? '',
    verified: !!r.verified,
    verifiedBy: r.verified_by_username ?? '',
  };
}

export interface ReportForm {
  date: string; // DD/MM/YYYY, empty = today
  opponent: string;
  competition: string;
  result: string;
  didNotPlay: boolean;
  position: string;
  minutes: string;
  goals: string;
  assists: string;
  yellow: string;
  red: string;
  isStarting: '' | 'yes' | 'no';
  rating: string;
  highlightsUrl: string;
  hadInjury: '' | 'yes' | 'no';
  injuryNotes: string;
  notes: string;
}

export const emptyForm: ReportForm = {
  date: '', opponent: '', competition: '', result: '', didNotPlay: false, position: '', minutes: '', goals: '',
  assists: '', yellow: '', red: '', isStarting: '', rating: '', highlightsUrl: '', hadInjury: '', injuryNotes: '', notes: '',
};

/** DD/MM/YYYY -> YYYY-MM-DD, or null when it is not a real calendar date. */
export function dmyToIso(v: string): string | null {
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(v.trim());
  if (!m) return null;
  const d = +m[1], mo = +m[2], y = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Same rules as the website's form: a "did not play" report zeroes the stats and drops the rest. */
export function buildPayload(f: ReportForm, todayIso: string): { payload?: Record<string, unknown>; error?: 'opponent' | 'date' } {
  if (!f.opponent.trim()) return { error: 'opponent' };
  let date = todayIso;
  if (f.date.trim()) {
    const iso = dmyToIso(f.date);
    if (!iso) return { error: 'date' };
    date = iso;
  }
  const n = (s: string) => (s ? parseInt(s, 10) : 0);
  const dnp = f.didNotPlay;
  const rating = f.rating ? parseFloat(f.rating) : undefined;
  const payload: Record<string, unknown> = {
    match_date: date,
    opponent: f.opponent.trim(),
    competition: f.competition.trim() || undefined,
    result: f.result.trim() || undefined,
    notes: f.notes.trim() || undefined,
    did_not_play: dnp,
    minutes_played: dnp ? 0 : f.minutes ? n(f.minutes) : undefined,
    goals: dnp ? 0 : n(f.goals),
    assists: dnp ? 0 : n(f.assists),
    yellow_cards: dnp ? 0 : n(f.yellow),
    red_cards: dnp ? 0 : n(f.red),
    position_played: dnp ? undefined : f.position.trim() || undefined,
    is_starting: dnp || !f.isStarting ? undefined : f.isStarting === 'yes',
    rating: dnp || rating == null || isNaN(rating) ? undefined : Math.min(10, rating),
    highlights_url: dnp ? undefined : f.highlightsUrl.trim() || undefined,
    had_injury: dnp || !f.hadInjury ? undefined : f.hadInjury === 'yes',
    injury_notes: dnp ? undefined : f.injuryNotes.trim() || undefined,
  };
  for (const k of Object.keys(payload)) if (payload[k] === undefined) delete payload[k];
  return { payload };
}
