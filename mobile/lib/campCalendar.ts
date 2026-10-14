import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar/legacy';
import { fetchCamps } from '@/lib/camps';
import { campEnd, campsForUser, planSync, campSig, type SavedEvents } from '@/lib/campCalendarLogic';
import type { Camp } from '@/lib/campsLogic';
import { getJson, KEYS, setJson } from '@/lib/storage';

interface State { userId: string; calendarId?: string; events: SavedEvents; asked: boolean }

const CAL_TITLE = 'Tunisia WNT';

async function getOrCreateCalendar(existing?: string): Promise<string> {
  const all = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  if (existing && all.some((c) => c.id === existing)) return existing;
  const found = all.find((c) => c.title === CAL_TITLE && c.allowsModifications);
  if (found) return found.id;
  const source = Platform.OS === 'ios'
    ? (await Calendar.getDefaultCalendarAsync()).source
    : { isLocalAccount: true, name: CAL_TITLE, type: Calendar.SourceType.LOCAL } as Calendar.Source;
  return Calendar.createCalendarAsync({
    title: CAL_TITLE, color: '#E70013', entityType: Calendar.EntityTypes.EVENT, source,
    name: CAL_TITLE, ownerAccount: 'personal', accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

// All-day, multi-day event. Android wants UTC midnight with an exclusive end; iOS only reads the date.
function eventDetails(c: Camp): Partial<Calendar.Event> {
  const end = campEnd(c);
  const next = new Date(`${end}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
  const android = Platform.OS === 'android';
  return {
    title: c.name || 'National camp', location: c.location || undefined, notes: c.category || undefined,
    allDay: true,
    startDate: android ? new Date(`${c.start}T00:00:00Z`) : new Date(`${c.start}T12:00:00`),
    endDate: android ? next : new Date(`${end}T12:00:00`),
    timeZone: android ? 'UTC' : undefined,
  };
}

async function clearAll(state: State) {
  for (const e of Object.values(state.events)) await Calendar.deleteEventAsync(e.id).catch(() => {});
  state.events = {};
}

/**
 * Puts the camps this person is named in onto their phone calendar (and keeps them in step:
 * dates changed, camp removed, no longer called up). Does nothing without calendar permission.
 * The first call after sign-in asks for permission once; a refusal is respected.
 */
export async function syncCampCalendar(user: { id: string; role: string; memberId?: number | null }): Promise<void> {
  const saved = await getJson<State>(KEYS.campCalendar);
  const state: State = saved && saved.userId === user.id ? saved : { userId: user.id, events: {}, asked: false };

  let perm = await Calendar.getCalendarPermissionsAsync();
  if (perm.status !== 'granted' && perm.canAskAgain && !state.asked) {
    state.asked = true;
    perm = await Calendar.requestCalendarPermissionsAsync();
  }
  if (perm.status !== 'granted') {
    await setJson(KEYS.campCalendar, state);
    return;
  }

  // A different account on the same phone: take the previous person's camps off the calendar first.
  if (saved && saved.userId !== user.id) {
    try { await getOrCreateCalendar(saved.calendarId); await clearAll(saved); } catch { /* best effort */ }
  }

  const camps = await fetchCamps();
  const plan = planSync(campsForUser(camps, user), state.events);
  if (!plan.create.length && !plan.update.length && !plan.remove.length) {
    await setJson(KEYS.campCalendar, state);
    return;
  }

  state.calendarId = await getOrCreateCalendar(state.calendarId);
  for (const id of plan.remove) {
    await Calendar.deleteEventAsync(state.events[id].id).catch(() => {});
    delete state.events[id];
  }
  for (const { camp, eventId } of plan.update) {
    try {
      await Calendar.updateEventAsync(eventId, eventDetails(camp));
      state.events[String(camp.id)] = { id: eventId, sig: campSig(camp) };
    } catch { // user deleted the event by hand: recreate it
      delete state.events[String(camp.id)];
      plan.create.push(camp);
    }
  }
  for (const camp of plan.create) {
    const id = await Calendar.createEventAsync(state.calendarId, eventDetails(camp));
    state.events[String(camp.id)] = { id, sig: campSig(camp) };
  }
  await setJson(KEYS.campCalendar, state);
}
