import { NextRequest, NextResponse } from 'next/server';
// pdfjs-dist 6.x ships pure ESM with named exports only - there is no default
// export, so a default import resolves to undefined and getDocument is missing.
// The *legacy* build is the one that runs under Node: the modern build waits on
// a DOM worker that a route handler never provides, and the request hangs.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import JSZip from 'jszip';
import Tesseract from 'tesseract.js';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

// OCR (image uploads) and the AI parsing call on top of it can both take a
// while; Vercel's default function timeout is too short for the combination.
// Matches app/api/import-players/route.ts, the other route in this app doing
// slow server-side file processing.
export const maxDuration = 60;

// pdfjs needs its bundled font and cmap data to decode PDFs that use standard
// (non-embedded) fonts - which is what a Word/Docs export usually produces.
// Without them it warns "standardFontDataUrl is not provided" and can mis-map
// characters.
// Resolved from the app's own node_modules rather than via require.resolve:
// under Turbopack require.resolve returns a module id, not a filesystem path,
// and pdfjs rejects it with "Invalid factory url". Forward slashes because
// pdfjs parses these as URLs and demands a trailing separator.
const PDFJS_ASSETS = path.join(process.cwd(), 'node_modules', 'pdfjs-dist');
const STANDARD_FONTS_URL = path.join(PDFJS_ASSETS, 'standard_fonts') + '/';
const CMAP_URL = path.join(PDFJS_ASSETS, 'cmaps') + '/';

// tesseract.js has the same problem: its node worker path is built from
// __dirname, which points somewhere else once Turbopack has bundled this
// route. The worker never starts, recognize() never settles, and the request
// hung forever with no error to show - the phone just spun. Resolved from the
// app's own node_modules, which also lets the worker's require() of
// tesseract.js-core resolve through pnpm's symlinked layout.
const TESSERACT_WORKER = path.join(
  process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js',
);
// Backstop: even with the path right, a stall must surface as an error the
// coach can read rather than an endless spinner.
const OCR_TIMEOUT_MS = 45_000;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface CampActivity {
  id: string;
  day: string;           // "21 Oct"
  time: string;          // "09:00"
  activity: string;      // "Training"
  type: 'collective' | 'private';
  playerName?: string;   // for private activities
  duration?: string;     // "60min"
  location?: string;     // "Main Pitch"
  notes?: string;
}

export interface ParsedSchedule {
  days: CampActivity[];
  totalActivities: number;
  collectiveCount: number;
  privateCount: number;
  playersMentioned: string[];
  rawText: string;
}

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const ACTIVITY_KEYWORDS = [
  'waking up', 'wake up', 'training', 'lunch', 'dinner', 'breakfast',
  'match', 'meeting', 'therapy', 'gym', 'pool', 'stretch', 'yoga',
  'tactics', 'video analysis', 'team talk', 'medical', 'checkup',
  'recovery', 'massage', 'physio', 'nutrition', 'press', 'interview',
  'travel', 'arrival', 'departure', 'free time', 'rest', 'lights out',
  'briefing', 'debrief', 'warm up', 'cool down', 'fitness', 'running',
  'weights', 'skills', 'drills', 'scrimmage', 'practice', 'game',
  // French, in both accented and plain spelling - the team's own documents
  // are written in French and every one of these was invisible before.
  'reveil', 'réveil', 'entrainement', 'entraînement', 'dejeuner', 'déjeuner',
  'petit-dejeuner', 'petit-déjeuner', 'diner', 'dîner', 'reunion', 'réunion',
  'seance', 'séance', 'salle', 'piscine', 'etirement', 'étirement',
  'tactique', 'video', 'vidéo', 'medical', 'médical', 'recupération',
  'récupération', 'kine', 'kiné', 'conference', 'conférence', 'presse',
  'voyage', 'arrivee', 'arrivée', 'depart', 'départ', 'repos', 'libre',
  'echauffement', 'échauffement', 'course', 'jeu', 'entrainement collectif',
];

const PRIVATE_INDICATORS = [
  'meeting with', 'private', 'one on one', '1:1', 'individual',
  'medical check', 'physio session', 'counseling', 'interview with',
  'coach talk', 'review', 'assessment', 'evaluation',
  // French counterparts, same reason as above.
  'reunion avec', 'réunion avec', 'prive', 'privé', 'individuel',
  'individuelle', 'entretien avec', 'tete-a-tete', 'tête-à-tête', 'bilan',
];

// A time, in either notation the team's documents use: "09:00" and "09.00".
// Declared once at module scope with /g, so only String.match is safe on it -
// RegExp.test would carry lastIndex between lines and skip activities at
// random. Never call .test() on this.
const TIME_REGEX = /(\d{1,2}):(\d{2})|(\d{1,2})\.(\d{2})|(\d{1,2})\s*(am|pm|h)/gi;

// ═══════════════════════════════════════════════════════════════
// TEXT EXTRACTION
// ═══════════════════════════════════════════════════════════════

async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({
    data: buffer,
    standardFontDataUrl: STANDARD_FONTS_URL,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
  }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let out = '';
    let lastY: number | null = null;
    let lastEndX: number | null = null;
    for (const raw of content.items as any[]) {
      if (typeof raw?.str !== 'string') continue; // marked-content stubs have no str
      const t = Array.isArray(raw.transform) ? raw.transform : null;
      const y = typeof t?.[5] === 'number' ? t[5] : null;
      const x = typeof t?.[4] === 'number' ? t[4] : null;
      const width = typeof raw.width === 'number' ? raw.width : 0;

      if (lastY !== null && y !== null && Math.abs(y - lastY) > 1) {
        // New baseline -> new line. This is the whole fix: joining with a
        // space collapsed every page into a single line, so no day header was
        // ever found on a real PDF and the programme stayed one day.
        out = out.trimEnd() + '\n';
        lastEndX = null;
      } else if (lastEndX !== null && x !== null && x - lastEndX > 1) {
        // A real gap between runs on the same line: keep the words apart
        // without inventing a line break.
        if (out && !/\s$/.test(out) && !/^\s/.test(raw.str)) out += ' ';
      }

      out += raw.str;
      lastY = y;
      lastEndX = x !== null ? x + width : null;

      if (raw.hasEOL) {
        out = out.trimEnd() + '\n';
        lastY = null;
        lastEndX = null;
      }
    }
    pages.push(out.trimEnd());
  }
  // Blank line between pages, so a day header that starts a new page is not
  // welded to the last activity of the page before it.
  return pages.join('\n\n');
}

async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const doc = await zip.file('word/document.xml')?.async('string');
  if (!doc) throw new Error('Invalid Word document');
  // Paragraph ends and explicit breaks become new lines. Replacing them with
  // a space - as this did - turned the whole document into one line, which is
  // the same failure the PDF path had.
  return doc
    .replace(/<w:br[^>]*\/>/gi, '\n')
    .replace(/<w:tab[^>]*\/>/gi, ' ')
    .replace(/<\/w:p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractTextFromImage(buffer: ArrayBuffer): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(
        `The photo could not be read (OCR timed out after ${OCR_TIMEOUT_MS / 1000}s). ` +
        'Paste the programme as text instead, or upload the PDF.',
      ));
    }, OCR_TIMEOUT_MS);
  });
  try {
    const result = await Promise.race([
      Tesseract.recognize(Buffer.from(buffer), 'eng+fra', {
        logger: () => {}, // suppress logs
        workerPath: TESSERACT_WORKER,
      }),
      timeout,
    ]);
    return result.data.text;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Dispatch on the file extension. `name` drives the branch, not the bytes. */
async function extractTextFromBuffer(
  buffer: ArrayBuffer,
  name: string,
): Promise<{ text: string; type: string }> {
  const ext = name.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    return { text: await extractTextFromPdf(buffer), type: 'pdf' };
  } else if (ext === 'docx' || ext === 'doc') {
    return { text: await extractTextFromDocx(buffer), type: 'docx' };
  } else if (['jpg', 'jpeg', 'png', 'tiff', 'bmp'].includes(ext || '')) {
    return { text: await extractTextFromImage(buffer), type: 'image' };
  } else {
    // Try as text
    const text = new TextDecoder().decode(buffer);
    return { text, type: 'text' };
  }
}

async function extractText(file: File): Promise<{ text: string; type: string }> {
  return extractTextFromBuffer(await file.arrayBuffer(), file.name);
}

/** base64 -> ArrayBuffer, keeping the view's own byte range (not the pooled buffer). */
function base64ToBuffer(base64: string): ArrayBuffer {
  const bytes = Buffer.from(base64, 'base64');
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

// ═══════════════════════════════════════════════════════════════
// PARSING
// ═══════════════════════════════════════════════════════════════

const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';
const WEEKDAYS =
  'monday|tuesday|wednesday|thursday|friday|saturday|sunday|' +
  'lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche';
// Spelled-out day numbers, both languages. Missing ones were why a header
// like "Day eight" fell through and its activities joined the previous day.
const DAY_NUMERALS =
  'one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|' +
  'deux|trois|quatre|cinq|sept|huit|neuf|dix';

// Arabic-Indic (٠١٢) and Eastern Arabic-Indic (۰۱۲) digits. Folding these to
// ASCII once, up front, means every time and date rule below only has to deal
// with a single numeral system - so "٠٩:٠٠" is read by the same code that
// reads "09:00".
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
export function toAsciiDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, (c) => {
    const a = ARABIC_DIGITS.indexOf(c);
    if (a !== -1) return String(a);
    const p = PERSIAN_DIGITS.indexOf(c);
    return p !== -1 ? String(p) : c;
  });
}

// Vowel marks (fatha, damma, kasra, tanwin, shadda, sukun, dagger alef).
// A typed programme may carry them while the keyword list cannot, so "تَدْرِيب"
// would never match "تدريب". Removed before any keyword comparison.
const AR_DIACRITICS = /[\u064B-\u0652\u0670]/g;
export function stripArabicDiacritics(s: string): string {
  return s.replace(AR_DIACRITICS, '');
}

// Arabic weekday and month names. Tunisia uses the French-derived month names
// (جانفي، فيفري، أفريل، جوان، جويلية، أوت) alongside the classical ones, so
// both are listed - a document from the federation uses the first set.
const AR_WEEKDAYS =
  'اﻷحد|الأحد|الاثنين|الإثنين|الإثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|السبت';
const AR_MONTHS =
  'جانفي|يناير|فيفري|فبراير|مارس|أفريل|أبريل|أبريل|ماي|مايو|جوان|يونيو|' +
  'جويلية|يوليو|أوت|أغسطس|اغسطس|سبتمبر|أكتوبر|اكتوبر|نوفمبر|ديسمبر';
const AR_DAY_NUMERALS = 'الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر';

// Arabic activity and private-session words. Every one of these was invisible
// before, so an Arabic programme parsed to nothing at all.
const AR_ACTIVITIES = [
  'تدريب', 'تمرين', 'تمارين', 'غداء', 'عشاء', 'فطور', 'إفطار', 'افطار',
  'اجتماع', 'مباراة', 'استشفاء', 'علاج', 'سباحة', 'جيم', 'صالة', 'سفر',
  'وصول', 'مغادرة', 'راحة', 'نوم', 'استراحة', 'تكتيك', 'فيديو', 'تحليل',
  'طبي', 'طبيب', 'معالجة', 'تدليك', 'تغذية', 'مؤتمر', 'صحافة', 'مقابلة',
  'إحماء', 'احماء', 'إطالة', 'اطالة', 'استرجاع', 'لعب', 'مبارزة',
];
const AR_PRIVATE = [
  'اجتماع مع', 'اجتماع خاص', 'خاص', 'فردي', 'فردية', 'مقابلة مع',
  'جلسة علاج', 'جلسة فردية', 'تقييم', 'مراجعة', 'جلسة معالجة',
];

// Roles, not people. "اجتماع مع المدرب" is a meeting with THE COACH, and
// treating "المدرب" as a player name marks a collective line personal and
// points it at nobody. Only an exact match is dropped, so "المدرب خالد"
// (coach Khaled) is still taken as a person.
const AR_ROLE_WORDS = new Set([
  'المدرب', 'المدربة', 'الطبيب', 'الطبيبة', 'المعالج', 'المعالجة',
  'الأخصائي', 'الاخصائي', 'الطاقم', 'الجهاز', 'الفريق', 'اللاعبون',
  'اللاعبات', 'الجامعة', 'الاتحاد', 'الوكلاء', 'الإدارة', 'الادارة',
]);

// Combined once at module load rather than rebuilt per line.
const ALL_KEYWORDS = [...ACTIVITY_KEYWORDS, ...AR_ACTIVITIES];
const ALL_PRIVATE = [...PRIVATE_INDICATORS, ...AR_PRIVATE];

/**
 * Returns the day label a line opens, or null if it is not a header.
 *
 * Covers what a real proposal actually contains: "Day 3", "Day ONE",
 * "21 October", "October 21, 2026", "Monday", "Lundi", "21/10/2026",
 * "اليوم 1", "الثلاثاء", "21 أكتوبر".
 * The English weekday and the numeric date were both absent, which is what
 * collapsed a multi-day programme into a single day.
 *
 * \b is deliberately absent from the Arabic branches: JavaScript counts only
 * [A-Za-z0-9_] as word characters, so a \b next to Arabic letters never
 * matches and the pattern would silently find nothing.
 */
interface DayHeaderMatch {
  label: string;
  /** Where the matched date/weekday text sits in the line, so the caller can
   *  tell a bare header ("Day 3" alone) from a table row that opens with a
   *  date and then carries its own activity text on the same line
   *  ("24 November   Radès – Annex, grass   Training"). */
  index: number;
  length: number;
}

function detectDayHeader(line: string): DayHeaderMatch | null {
  if (line.length > 80) return null; // a paragraph that merely mentions a date
  // A full date such as "21.10.2026" must still count as a header even though
  // its first two components look exactly like a European time, so that test
  // runs first. Only a two-component value is treated as a time.
  const isFullDate = /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/.test(line);
  if (!isFullDate && /^\d{1,2}[.:]\d{2}\b/.test(line)) return null;
  const m = line.match(
    new RegExp(
      [
        `\\bday\\s*(?:\\d{1,2}|${DAY_NUMERALS})\\b`,
        `\\b(?:jour|etape)\\s*(?:n[o°.]?\\s*)?(?:\\d{1,2}|${DAY_NUMERALS})\\b`,
        `\\b(?:${WEEKDAYS})\\b`,
        `\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTHS})[a-z]*\\b`, // 21 October
        `\\b(?:${MONTHS})[a-z]*\\s+\\d{1,2}(?:st|nd|rd|th)?\\b`, // October 21
        `\\b\\d{1,2}[/.-]\\d{1,2}(?:[/.-]\\d{2,4})?\\b`, // 21/10/2026
        `اليوم\\s*(?:\\d{1,2}|${AR_DAY_NUMERALS})`, // اليوم 1 / اليوم الأول
        `(?:${AR_WEEKDAYS})`, // الثلاثاء
        `\\d{1,2}\\s*(?:${AR_MONTHS})`, // 21 أكتوبر
        `(?:${AR_MONTHS})\\s*\\d{1,2}`, // أكتوبر 21
      ].join('|'),
      'i',
    ),
  );
  return m ? { label: m[0], index: m.index ?? 0, length: m[0].length } : null;
}

/**
 * Builds one activity from a line plus the activity-bearing text already
 * carved out of it (the side of a time match that reads like an activity, or
 * the remainder of a table row after its leading date column). Shared by both
 * branches below so a dated table row without a clock time gets exactly the
 * same private/player-name handling as one that has one.
 *
 * Returns null when the text has no activity keyword and no private marker -
 * the caller's signal to skip the line rather than invent an entry for it.
 */
function buildActivity(
  line: string,
  time: string,
  candidateText: string,
  playersMentioned: Set<string>,
): Omit<CampActivity, 'id' | 'day'> | null {
  // Check for private indicators. Diacritics removed first so a vocalised
  // Arabic line still matches its keyword.
  const haystack = stripArabicDiacritics(line.toLowerCase());
  let isPrivate = ALL_PRIVATE.some(ind => haystack.includes(ind));

  // A name in front of a colon is the coach singling one player out,
  // whatever the activity itself says. Until now only a private keyword
  // could make a line personal, so "Meeting with Coach" reached the player
  // as hers while "S. Gharbi: Recovery session" did not - the clearest
  // signal in the document was the one being ignored.
  const colonMatch = line.match(/([A-Z][a-z]*\.?\s+[A-Z][a-z]+)\s*:/);
  const arabicColonMatch = !colonMatch
    ? line.match(/([ء-ي][ء-ي\s]{2,30}?)\s*:/)
    : null;
  if (colonMatch || arabicColonMatch) isPrivate = true;

  // Extract player name for private activities
  let playerName: string | undefined;
  if (isPrivate) {
    // Format 1: "S. Gharbi: Meeting with Coach" or "Y. Ben Amor: Physio"
    if (colonMatch) {
      playerName = colonMatch[1];
    } else if (arabicColonMatch) {
      // Format 4: Arabic. Arabic has no capitalisation to key off, so the
      // Latin patterns find nothing. It only resolves to a card if that
      // card carries the same spelling - otherwise it surfaces as unlinked
      // for the coach to settle, which is the safe failure.
      playerName = arabicColonMatch[1].trim();
    } else {
      // Format 2: "Meeting with Coach — S. Gharbi"
      const dashMatch = line.match(/[—–-]\s*([A-Z][a-z]*\.?\s+[A-Z][a-z]+)/);
      if (dashMatch) {
        playerName = dashMatch[1];
      } else {
        // Format 3: just a capitalized name
        const nameMatch = line.match(/([A-Z][a-z]*\.?\s+[A-Z][a-z]+)/);
        if (nameMatch) {
          playerName = nameMatch[1];
        }
      }
    }
    if (!playerName) {
      // Format 5: Arabic with no colon - take what follows an indicator
      // ("اجتماع مع ياسمين"). The Latin patterns above find nothing here.
      for (const ind of AR_PRIVATE) {
        const i = haystack.indexOf(ind);
        if (i === -1) continue;
        const after = line.substring(i + ind.length).trim();
        const nm = after.match(/[ء-ي]{2,}(?:\s+[ء-ي]{2,}){0,3}/);
        if (nm) playerName = nm[0];
        break;
      }
    }
    if (playerName && AR_ROLE_WORDS.has(stripArabicDiacritics(playerName))) {
      playerName = undefined; // a role, not a person - leave the line collective
    }
    if (playerName) playersMentioned.add(playerName);
  }

  let activity = candidateText.replace(/^[-–—]\s*/, '').trim();

  // "S. Gharbi: Recovery session" - the name is the player, not part of
  // what she is doing. Left in place the name showed up twice: once as her
  // card and again inside the activity text.
  if (playerName && activity.toLowerCase().startsWith(playerName.toLowerCase())) {
    activity = activity.slice(playerName.length).replace(/^[\s:：-]+/, '').trim();
  }
  if (!activity) activity = 'Activity';

  // Check if activity contains keywords
  const activityHay = stripArabicDiacritics(activity.toLowerCase());
  const hasKeyword = ALL_KEYWORDS.some(kw => activityHay.includes(kw));
  if (!hasKeyword && !isPrivate) return null; // doesn't look like an activity

  return { time, activity, type: isPrivate ? 'private' : 'collective', playerName };
}

function parseSchedule(text: string): ParsedSchedule {
  // One numeral system for everything below: after this, "٠٩:٠٠" is read by
  // exactly the same rule as "09:00", and "٢١ أكتوبر" as "21 أكتوبر".
  const normalized = toAsciiDigits(text);
  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);
  const activities: CampActivity[] = [];
  const playersMentioned = new Set<string>();
  let currentDay = '';

  for (const line of lines) {
    // Detect day headers: "Day ONE", "Day 1", "21 October", "21 Oct", "Lundi 21"
    const dayMatch = detectDayHeader(line);
    if (dayMatch) currentDay = dayMatch.label;

    const timeMatch = line.match(TIME_REGEX);

    if (dayMatch && !timeMatch) {
      // A table row (date | venue | programme, one line per day, the shape
      // every "Training" camp row in a federation document actually uses)
      // has no clock time at all - just a date followed by what's happening.
      // Treating every header-looking line as a bare "Day 3" header and
      // `continue`-ing past it, as before, threw that day's only activity
      // away entirely: an 11-day programme like this one came back as "1 day,
      // 2 activities" because only the two lines that happened to carry a
      // literal time (the match kick-offs) survived.
      const remainder = line.slice(dayMatch.index + dayMatch.length).trim();
      if (!remainder) continue; // genuinely bare header, e.g. just "Day 3"
      const built = buildActivity(line, '', remainder, playersMentioned);
      if (!built) continue; // date-led line with no recognizable activity on it
      activities.push({ id: `act-${activities.length}`, day: currentDay || 'Day 1', ...built });
      continue;
    }

    if (!timeMatch) continue;

    const time = timeMatch[0];
    const timeIndex = line.indexOf(time);
    // A table row's date column sits before the time ("30 November Radès
    // Stadium MATCH: Tunisia – Russia at 19:00") and used to be kept as part
    // of the activity text verbatim. Strip the line's own day-header match
    // off the front so the activity reads as "Radès Stadium MATCH..." rather
    // than repeating the date that already became `currentDay`.
    const beforeStart = dayMatch && dayMatch.index === 0 ? dayMatch.index + dayMatch.length : 0;
    const beforeTime = line.substring(beforeStart, timeIndex).trim();
    const afterTime = line.substring(timeIndex + time.length).trim();

    // Determine activity type. Prefer whichever side of the time actually
    // reads like an activity: "21 Oct  09:00  Training" has the date before
    // the time, and taking beforeTime blindly made "21 Oct" the activity -
    // which then failed the keyword check and dropped the line entirely.
    const sides = [beforeTime, afterTime].filter(Boolean);
    // ALL_KEYWORDS, not ACTIVITY_KEYWORDS: without the Arabic list an Arabic
    // line with the date before the time picked the date as its activity.
    const haystackForSides = (s: string) => stripArabicDiacritics(s.toLowerCase());
    const keywordSide = sides.find(s =>
      ALL_KEYWORDS.some(kw => haystackForSides(s).includes(kw)),
    );
    const candidateText = keywordSide || sides[0] || 'Activity';

    const built = buildActivity(line, time, candidateText, playersMentioned);
    if (!built) continue; // skip lines that don't look like activities

    activities.push({ id: `act-${activities.length}`, day: currentDay || 'Day 1', ...built });
  }

  const collectiveCount = activities.filter(a => a.type === 'collective').length;
  const privateCount = activities.filter(a => a.type === 'private').length;

  return {
    days: activities,
    totalActivities: activities.length,
    collectiveCount,
    privateCount,
    playersMentioned: Array.from(playersMentioned),
    rawText: text,
  };
}

// ═══════════════════════════════════════════════════════════════
// AI PARSING (primary path)
// ═══════════════════════════════════════════════════════════════

// The regex parser above only recognizes the handful of layouts it was
// written against: a literal "Day N" header, a keyword list, a time on the
// same line as the activity. A real federation document is a table, a bullet
// list, a paragraph per day, or some house format nobody anticipated, and the
// regex parser silently drops everything it doesn't recognize - which is why
// a real multi-day camp was coming back as one or two days. Claude reads the
// extracted text the way a staff member would: it knows what a training camp
// programme looks like regardless of layout, in English, French or Arabic,
// and returns every activity it finds as structured data instead of lines
// that happened to match a pattern.
const AI_MODEL = 'claude-sonnet-5';
// A long, dense multi-week camp document can run past this in output tokens
// before it has listed every activity; raise it if a real document still gets
// cut short (check `stop_reason` in the server logs).
const AI_MAX_OUTPUT_TOKENS = 8000;
// Guards against an enormous or garbled extraction (e.g. OCR noise) blowing
// the context window or the per-request cost. A typical multi-day camp
// programme is a few thousand characters; this leaves generous headroom.
const AI_MAX_INPUT_CHARS = 60000;

const SCHEDULE_TOOL: Anthropic.Tool = {
  name: 'submit_camp_schedule',
  description: 'Submit the structured training-camp programme extracted from the document.',
  input_schema: {
    type: 'object',
    properties: {
      activities: {
        type: 'array',
        description: 'Every activity in the programme, in the order the document lists them, grouped implicitly by day.',
        items: {
          type: 'object',
          properties: {
            day: {
              type: 'string',
              description:
                'The day this activity belongs to, in the document\'s own words where possible (e.g. "Day 1", "Day 1 — Mon 21 Oct", "21 October", "اليوم 1"). Every activity on the same calendar day must use the exact same string so the app can group them.',
            },
            time: {
              type: 'string',
              description: 'Start time in 24-hour HH:MM, e.g. "09:00". Empty string if the document genuinely gives no time for this activity.',
            },
            activity: {
              type: 'string',
              description: 'The activity itself (e.g. "Training", "Team breakfast", "Video analysis"), in the document\'s own language - do not translate it.',
            },
            type: {
              type: 'string',
              enum: ['collective', 'private'],
              description: 'collective: the whole squad or a group. private: aimed at one named player (a 1:1 meeting, an individual medical or physio session, etc).',
            },
            playerName: {
              type: 'string',
              description: 'Only for type "private": the player\'s name exactly as the document spells it. Omit for collective activities.',
            },
            duration: {
              type: 'string',
              description: 'Only if the document states one explicitly, e.g. "60min". Omit otherwise - do not guess.',
            },
            location: {
              type: 'string',
              description: 'Only if the document states one explicitly, e.g. "Main Pitch", "Hotel conference room". Omit otherwise.',
            },
            notes: {
              type: 'string',
              description: 'Any other detail attached to this specific activity worth keeping. Omit if there is none.',
            },
          },
          required: ['day', 'time', 'activity', 'type'],
        },
      },
    },
    required: ['activities'],
  },
};

const SCHEDULE_SYSTEM_PROMPT = `You read training-camp programmes for a national football team's staff and \
players and turn them into a clean, day-by-day, hour-by-hour schedule.

The source text below was extracted from a PDF, Word document or scanned image, so its layout may be \
flattened, a table may read as run-together columns, and OCR text may have minor errors - read past that \
and recover the programme a human would see in the original document.

Rules:
- Extract every single activity the document lists, for every day it covers. Do not skip a day or an \
activity because it does not match a pattern you expect; this is a real staff document, read it as one.
- Keep each activity's day, time and wording faithful to the source. Do not invent activities, times, or \
days that are not in the document, and do not translate text to another language.
- If the same label (e.g. a person's name before a colon, or a header like "Individual sessions") clearly \
marks several following lines as private to one player, apply that to each of them.
- A role ("the coach", "medical staff", "الطاقم") is not a player's name - never \
set playerName to a role.
- If the document is not a training-camp programme at all (e.g. it's unrelated paperwork), call the tool \
with an empty activities array.
Call the submit_camp_schedule tool exactly once with everything you found.`;

/**
 * Structures the extracted text with Claude. Returns null (not a thrown
 * error) when the model can't be reached or doesn't comply, so the caller can
 * fall back to the regex parser rather than failing the whole upload.
 */
async function parseScheduleWithAI(text: string): Promise<ParsedSchedule | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('camp-schedule parse: ANTHROPIC_API_KEY is not set, falling back to the regex parser');
    return null;
  }

  const truncated = text.length > AI_MAX_INPUT_CHARS;
  const input = truncated ? text.slice(0, AI_MAX_INPUT_CHARS) : text;

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: AI_MAX_OUTPUT_TOKENS,
      system: SCHEDULE_SYSTEM_PROMPT,
      tools: [SCHEDULE_TOOL],
      tool_choice: { type: 'tool', name: 'submit_camp_schedule' },
      messages: [
        {
          role: 'user',
          content: `Extracted document text${truncated ? ' (truncated - document was longer)' : ''}:\n\n${input}`,
        },
      ],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === 'submit_camp_schedule',
    );
    if (!toolUse) {
      console.error('camp-schedule parse: model did not call the tool', JSON.stringify(response.content));
      return null;
    }

    const raw = toolUse.input as { activities?: Partial<CampActivity>[] };
    const playersMentioned = new Set<string>();
    const activities: CampActivity[] = (raw.activities ?? [])
      .filter((a) => typeof a.day === 'string' && typeof a.activity === 'string')
      .map((a, i) => {
        const type: CampActivity['type'] = a.type === 'private' ? 'private' : 'collective';
        if (type === 'private' && a.playerName) playersMentioned.add(a.playerName);
        return {
          id: `act-${i}`,
          day: a.day!.trim(),
          time: (a.time ?? '').trim(),
          activity: a.activity!.trim(),
          type,
          playerName: type === 'private' ? a.playerName?.trim() || undefined : undefined,
          duration: a.duration?.trim() || undefined,
          location: a.location?.trim() || undefined,
          notes: a.notes?.trim() || undefined,
        };
      });

    if (response.stop_reason === 'max_tokens') {
      console.warn('camp-schedule parse: model hit the output token limit, the schedule below may be cut short');
    }

    return {
      days: activities,
      totalActivities: activities.length,
      collectiveCount: activities.filter((a) => a.type === 'collective').length,
      privateCount: activities.filter((a) => a.type === 'private').length,
      playersMentioned: Array.from(playersMentioned),
      rawText: text,
    };
  } catch (err) {
    console.error('camp-schedule parse: Claude request failed, falling back to the regex parser', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// API ROUTE
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    let text = '';
    let type = 'text';
    
    if (contentType.includes('application/json')) {
      // Two JSON shapes:
      //   { text }                      - pasted straight from the textarea
      //   { filename, mimeType, base64 }- a picked file, sent as base64
      // The mobile app uses the base64 shape because React Native's native
      // networking rejects the {uri,name,type} FormData part on device, so a
      // multipart upload never reaches the server.
      const body = await request.json();

      if (typeof body.base64 === 'string' && body.base64.length > 0) {
        const buffer = base64ToBuffer(body.base64);
        const filename = String(body.filename || 'upload.txt');
        const result = await extractTextFromBuffer(buffer, filename);
        text = result.text;
        type = result.type;
      } else {
        text = body.text || '';
        type = 'text';
      }
    } else if (
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      // Legacy multipart upload, kept so older clients keep working. The app
      // itself now uses the base64 JSON shape above.
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: 'No file or text provided' },
          { status: 400 }
        );
      }

      const result = await extractText(file);
      text = result.text;
      type = result.type;
    } else {
      // Anything else (including no Content-Type at all) used to escape as an
      // unhandled 500 from request.formData(). Be explicit instead.
      return NextResponse.json(
        {
          error:
            'Unsupported request. Send JSON as {text} or {filename, base64}, or multipart/form-data with a "file" part.',
        },
        { status: 400 },
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'No text content found' },
        { status: 400 }
      );
    }

    // AI parsing first: it reads the document the way a person would,
    // regardless of layout or language. Only when it can't run or doesn't
    // come back (no API key, a down model, a malformed response) does this
    // fall back to the regex parser, which is deliberately kept rather than
    // deleted so an upload still produces something before that key exists.
    const aiParsed = await parseScheduleWithAI(text);
    const parsed = aiParsed ?? parseSchedule(text);

    return NextResponse.json({
      success: true,
      fileType: type,
      parsedBy: aiParsed ? 'ai' : 'regex',
      ...parsed,
    });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse file' },
      { status: 500 }
    );
  }
}
