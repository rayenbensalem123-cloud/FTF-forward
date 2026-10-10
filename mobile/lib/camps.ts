import { select } from '@/lib/supabase';
import { campFromDb, type Camp } from '@/lib/campsLogic';

export * from '@/lib/campsLogic';

/** The platform's national camps ("stages"), newest first. Read only here: staff edit them on the website. */
export async function fetchCamps(): Promise<Camp[]> {
  const rows = await select<any>('camps', 'select=*&order=start_date.desc.nullslast&limit=200');
  return rows.map(campFromDb);
}
