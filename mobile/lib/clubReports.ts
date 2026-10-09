import { currentSession, insert, remove, select, update } from '@/lib/supabase';
import { reportFromDb, type ClubReport } from '@/lib/clubReportsLogic';

export * from '@/lib/clubReportsLogic';

/** Row-level security scopes this: staff get everyone's, a player only her own. */
export async function fetchReports(): Promise<ClubReport[]> {
  const rows = await select<any>('club_match_reports', 'select=*&order=match_date.desc.nullslast,id.desc&limit=1000');
  return rows.map(reportFromDb);
}

export async function addReport(memberId: number, payload: Record<string, unknown>): Promise<ClubReport> {
  const row = await insert('club_match_reports', { member_id: memberId, submitted_by: currentSession()?.userId ?? null, ...payload });
  return reportFromDb(row);
}

export const deleteReport = (id: number) => remove('club_match_reports', `id=eq.${id}`);

/** Only staff can change these columns: a database trigger refuses anyone else. */
export async function setVerified(id: number, verified: boolean, byUsername: string) {
  await update('club_match_reports', `id=eq.${id}`, {
    verified,
    verified_by_username: verified ? byUsername : null,
    verified_at: verified ? new Date().toISOString() : null,
  });
}
