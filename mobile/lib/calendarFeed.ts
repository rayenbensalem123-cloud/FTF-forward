import { currentSession } from '@/lib/supabase';
import { SITE_URL } from '@/lib/site';

/** Gets (or rotates) the signed-in user's personal calendar token from the website backend. */
export async function fetchCalendarUrl(regenerate = false): Promise<string> {
  const s = currentSession();
  if (!s) throw new Error('not signed in');
  const res = await fetch(`${SITE_URL}/api/calendar-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.accessToken}` },
    body: JSON.stringify({ regenerate }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.token) throw new Error(json?.error || `HTTP ${res.status}`);
  return `${SITE_URL}/api/calendar/${json.token}.ics`;
}

/** webcal:// makes iOS offer to subscribe; Android falls back to the share sheet. */
export const toWebcal = (httpsUrl: string) => httpsUrl.replace(/^https?:/, 'webcal:');
