import { select } from '@/lib/supabase';

export type Meeting = {
  id: number; title: string; team: string | null; at: string;
  status: string; joinUrl: string | null; recordingUrl: string | null;
};

export const meetingFromDb = (r: any): Meeting => ({
  id: Number(r.id), title: String(r.title ?? ''), team: r.team_category ?? null, at: String(r.scheduled_at),
  status: String(r.status ?? 'scheduled'), joinUrl: r.join_url ?? null, recordingUrl: r.recording_url ?? null,
});

/** Anyone signed in can read these; the host-only start link is never requested. */
export async function fetchMeetings(): Promise<Meeting[]> {
  const rows = await select<any>('meetings', 'select=id,title,team_category,scheduled_at,status,join_url,recording_url&order=scheduled_at.asc&limit=500');
  return rows.map(meetingFromDb);
}
