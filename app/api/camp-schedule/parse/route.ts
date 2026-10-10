import { NextRequest, NextResponse } from 'next/server';
// pdfjs-dist 6.x ships pure ESM with named exports only - there is no default
// export, so a default import resolves to undefined and getDocument is missing.
// The *legacy* build is the one that runs under Node: the modern build waits on
// a DOM worker that a route handler never provides, and the request hangs.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import JSZip from 'jszip';
import Tesseract from 'tesseract.js';
import path from 'node:path';

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
];

const PRIVATE_INDICATORS = [
  'meeting with', 'private', 'one on one', '1:1', 'individual',
  'medical check', 'physio session', 'counseling', 'interview with',
  'coach talk', 'review', 'assessment', 'evaluation',
];

const TIME_REGEX = /(\d{1,2}):(\d{2})|(\d{1,2})\s*(am|pm|h)/gi;

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
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + '\n';
  }
  return text;
}

async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const doc = await zip.file('word/document.xml')?.async('string');
  if (!doc) throw new Error('Invalid Word document');
  // Strip XML tags
  return doc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

async function extractTextFromImage(buffer: ArrayBuffer): Promise<string> {
  const result = await Tesseract.recognize(Buffer.from(buffer), 'eng+fra', {
    logger: () => {}, // suppress logs
  });
  return result.data.text;
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

function parseSchedule(text: string): ParsedSchedule {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const activities: CampActivity[] = [];
  const playersMentioned = new Set<string>();
  let currentDay = '';

  for (const line of lines) {
    // Detect day headers: "Day ONE", "Day 1", "21 October", "21 Oct", "Lundi 21"
    const dayMatch = line.match(/(?:day\s+(?:\d+|one|two|three|four|five|six|seven))|(?:\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*)|(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i);
    if (dayMatch && line.length < 50) {
      currentDay = dayMatch[0];
      continue;
    }

    // Detect time
    const timeMatch = line.match(TIME_REGEX);
    if (!timeMatch) continue;

    const time = timeMatch[0];
    const timeIndex = line.indexOf(time);
    const beforeTime = line.substring(0, timeIndex).trim();
    const afterTime = line.substring(timeIndex + time.length).trim();

    // Check for private indicators
    const isPrivate = PRIVATE_INDICATORS.some(ind => line.toLowerCase().includes(ind));
    
    // Extract player name for private activities
    let playerName: string | undefined;
    if (isPrivate) {
      // Format 1: "S. Gharbi: Meeting with Coach" or "Y. Ben Amor: Physio"
      const colonMatch = line.match(/([A-Z][a-z]*\.?\s+[A-Z][a-z]+)\s*:/);
      if (colonMatch) {
        playerName = colonMatch[1];
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
      if (playerName) {
        playersMentioned.add(playerName);
      }
    }

    // Determine activity type
    let activity = beforeTime || afterTime || 'Activity';
    activity = activity.replace(/^[-–—]\s*/, '').trim();

    // Check if activity contains keywords
    const hasKeyword = ACTIVITY_KEYWORDS.some(kw => activity.toLowerCase().includes(kw));
    if (!hasKeyword && !isPrivate) {
      // Skip lines that don't look like activities
      continue;
    }

    activities.push({
      id: `act-${activities.length}`,
      day: currentDay || 'Day 1',
      time,
      activity,
      type: isPrivate ? 'private' : 'collective',
      playerName,
    });
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

    const parsed = parseSchedule(text);

    return NextResponse.json({
      success: true,
      fileType: type,
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
