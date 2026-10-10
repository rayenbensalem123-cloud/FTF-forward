import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import type { Match } from '@/types';

const CALENDAR_NAME = 'Tunisia WNT';

/** The platform stores a match date only (no kickoff time), so events are set for 18:00-20:00 local. */
const EVENT_HOUR = 18;

async function findOrCreateCalendarId(): Promise<string | null> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') return null;

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existing = calendars.find((c) => c.title === CALENDAR_NAME);
  if (existing) return existing.id;

  const defaultSource =
    Platform.OS === 'ios'
      ? await Calendar.getDefaultCalendarAsync().then((c) => c.source).catch(() => undefined)
      : { isLocalAccount: true, name: CALENDAR_NAME, type: 'LOCAL' as any };

  return Calendar.createCalendarAsync({
    title: CALENDAR_NAME,
    color: '#E30613',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: Platform.OS === 'ios' ? (defaultSource as any)?.id : undefined,
    source: defaultSource as any,
    name: CALENDAR_NAME,
    ownerAccount: CALENDAR_NAME,
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

export type CalendarResult = 'added' | 'denied' | 'failed';

/** Adds one match to the device calendar, with reminders at the day before and on match day. Idempotent-ish: a second tap makes a second event (iOS/Android have no simple de-dupe key). */
export async function addMatchToCalendar(m: Match): Promise<CalendarResult> {
  try {
    const calendarId = await findOrCreateCalendarId();
    if (!calendarId) return 'denied';

    const [y, mo, d] = m.date.split('-').map(Number);
    if (!y || !mo || !d) return 'failed';
    const start = new Date(y, mo - 1, d, EVENT_HOUR, 0, 0);
    const end = new Date(y, mo - 1, d, EVENT_HOUR + 2, 0, 0);

    await Calendar.createEventAsync(calendarId, {
      title: `Tunisia vs ${m.opponent}`,
      startDate: start,
      endDate: end,
      location: m.venue || undefined,
      notes: [m.competition, m.category].filter(Boolean).join(' · '),
      alarms: [{ relativeOffset: -14 * 60 }, { relativeOffset: -24 * 60 }],
    });
    return 'added';
  } catch {
    return 'failed';
  }
}

export async function addMatchesToCalendar(matches: Match[]): Promise<CalendarResult> {
  try {
    const calendarId = await findOrCreateCalendarId();
    if (!calendarId) return 'denied';
    for (const m of matches) {
      const [y, mo, d] = m.date.split('-').map(Number);
      if (!y || !mo || !d) continue;
      const start = new Date(y, mo - 1, d, EVENT_HOUR, 0, 0);
      const end = new Date(y, mo - 1, d, EVENT_HOUR + 2, 0, 0);
      await Calendar.createEventAsync(calendarId, {
        title: `Tunisia vs ${m.opponent}`,
        startDate: start,
        endDate: end,
        location: m.venue || undefined,
        notes: [m.competition, m.category].filter(Boolean).join(' · '),
        alarms: [{ relativeOffset: -14 * 60 }, { relativeOffset: -24 * 60 }],
      });
    }
    return 'added';
  } catch {
    return 'failed';
  }
}
