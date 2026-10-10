import type { Player } from '@/types';

/**
 * Pure part of the camp program: the shapes the parser hands over and the
 * matching of a coach's mention ("S. Gharbi") to a player card.
 * No React Native or Supabase import, so plain node can test it.
 */

// ───────── Types ─────────
export interface CampActivity {
  /** DB id once saved, local id before. */
  id: string | number;
  dayIndex: number;
  /** Day header as written: "Day 1", "21 October"... */
  dayLabel: string;
  /** Order inside the day. */
  seq: number;
  /** "09:00" or '' */
  time: string;
  activity: string;
  /** Linked player card id, null when the line is for everybody. */
  playerId: number | null;
  /** Name as the coach typed it: "S. Gharbi". */
  playerLabel: string;
}

export interface CampSchedule {
  id: number;
  title: string;
  status: 'draft' | 'published';
  sourceFile: string;
  version: number;
  author: string | null;
  updatedAt: string;
  activities: CampActivity[];
}

/** A day of the program, in display order. */
export interface CampDay {
  dayIndex: number;
  dayLabel: string;
  activities: CampActivity[];
}

// ───────── Name matching ─────────
/** "Béchir Abla" -> "bechirabla": accents, case and punctuation must not stop a match. */
export function normName(txt: string): string {
  return txt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

/**
 * Link the coach's mention ("S. Gharbi", "Y. Ben Amor") to a player card.
 * The last word is the last name; the words before it line up with the END of
 * the player's first names, each as a prefix or an initial ("Y." matches
 * "Yasmine"). Aligning at the end matters because the parser often keeps only
 * part of the name ("Ben Amor" for "Yasmine Ben Amor").
 * Returns null when nothing is unambiguous -- the line then stays staff-only
 * until a human picks the player, rather than being shown to the wrong one.
 */
export function matchPlayerId(label: string, players: Player[]): number | null {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  // Fast path: the whole mention equals the whole card name once accents,
  // case, spacing and hyphens are folded ("yasmine ben-amor" -> "Yasmine Ben Amor").
  const full = normName(label);
  const exact = players.filter((p) => normName(p.name) === full);
  if (exact.length === 1) return Number(exact[0].id);
  if (exact.length > 1) return null;

  const mentionLast = normName(words[words.length - 1]);
  const mentionFirst = words.slice(0, -1).map(normName).filter(Boolean);
  if (!mentionLast) return null;

  const hits = players.filter((p) => {
    const nw = p.name.trim().split(/\s+/).filter(Boolean);
    if (nw.length === 0) return false;
    const last = normName(nw[nw.length - 1]);
    if (!last || last !== mentionLast) return false;
    // Last name only: good enough when a single card carries it.
    if (mentionFirst.length === 0) return true;
    const first = nw.slice(0, -1).map(normName).filter(Boolean);
    // The mention may carry fewer words than the card ("Ben Amor") but never more.
    if (mentionFirst.length > first.length) return false;
    const tail = first.slice(first.length - mentionFirst.length);
    // "Y. Ben" lines up with "Yasmine Ben", "S" with "Sarra", but "Sa" not with "Sana".
    return mentionFirst.every((tok, i) => tail[i] === tok || tail[i].startsWith(tok));
  });

  // Ambiguous (two cards sharing the pattern) resolves to nobody.
  // Player.id mirrors the database id as a string; the schedule stores it as a number.
  return hits.length === 1 ? Number(hits[0].id) : null;
}

// ───────── Grouping ─────────
/** One line as the parse API returns it. */
export interface ParsedLine {
  id?: string;
  day?: string;
  time?: string;
  activity?: string;
  /** The parser's wording; the app only ever shows the activity and the name. */
  type?: 'collective' | 'private';
  playerName?: string;
}

/**
 * Turn the parser's flat list into store-ready activities.
 * Day headers become an index in order of first appearance ("Day 1" = 0), so
 * the program keeps the coach's order even when a day has no number in it.
 */
export function activitiesFromParsed(lines: ParsedLine[]): CampActivity[] {
  const dayIndex = new Map<string, number>();
  return lines.map((l, i) => {
    const label = (l.day || '').trim() || 'Day 1';
    if (!dayIndex.has(label)) dayIndex.set(label, dayIndex.size);
    const label2 = (l.playerName || '').trim();
    return {
      id: l.id ?? `act-${i}`,
      dayIndex: dayIndex.get(label)!,
      dayLabel: label,
      seq: i,
      time: (l.time || '').trim(),
      activity: (l.activity || '').trim(),
      // A line only becomes personal when the parser found a name on it.
      playerId: null,
      playerLabel: label2,
    };
  });
}

/** Group a flat activity list into days, in order, keeping line order inside a day. */
export function groupByDay(activities: CampActivity[]): CampDay[] {
  const days: CampDay[] = [];
  const byIndex = new Map<number, CampDay>();
  for (const a of [...activities].sort((x, y) => x.dayIndex - y.dayIndex || x.seq - y.seq)) {
    let day = byIndex.get(a.dayIndex);
    if (!day) {
      day = { dayIndex: a.dayIndex, dayLabel: a.dayLabel, activities: [] };
      byIndex.set(a.dayIndex, day);
      days.push(day);
    }
    day.activities.push(a);
  }
  return days;
}
