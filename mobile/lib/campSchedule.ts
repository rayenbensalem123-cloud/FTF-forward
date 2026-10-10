import { insert, insertMany, remove, select, update } from '@/lib/supabase';
import type { CampActivity, CampSchedule } from '@/lib/campProgram';

/**
 * Persistence of the camp program: one `camp_schedules` row per upload, one
 * `camp_schedule_activities` row per line. What each account sees is decided
 * by the database's row-level security (see supabase-camp-schedule.sql):
 * staff read everything, a player only a published schedule's shared lines
 * plus the lines addressed to its own card.
 */

// Row shapes from PostgREST (snake_case).
interface ActivityRow {
  id: number;
  schedule_id: number;
  day_index: number;
  day_label: string;
  seq: number;
  time: string;
  activity: string;
  player_id: number | null;
  player_label: string;
}

interface ScheduleRow {
  id: number;
  title: string;
  status: 'draft' | 'published';
  source_file: string;
  version: number;
  author: string | null;
  updated_at: string;
  camp_schedule_activities?: ActivityRow[];
}

function activityFromRow(r: ActivityRow): CampActivity {
  return {
    id: r.id,
    dayIndex: r.day_index ?? 0,
    dayLabel: r.day_label ?? '',
    seq: r.seq ?? 0,
    time: r.time ?? '',
    activity: r.activity ?? '',
    playerId: r.player_id ?? null,
    playerLabel: r.player_label ?? '',
  };
}

function scheduleFromRow(r: ScheduleRow): CampSchedule {
  return {
    id: r.id,
    title: r.title || '',
    status: r.status,
    sourceFile: r.source_file || '',
    version: r.version ?? 1,
    author: r.author ?? null,
    updatedAt: r.updated_at || '',
    activities: (r.camp_schedule_activities ?? [])
      .map(activityFromRow)
      .sort((a, b) => a.dayIndex - b.dayIndex || a.seq - b.seq),
  };
}

const SCHEDULE_SELECT =
  '*,camp_schedule_activities(id,schedule_id,day_index,day_label,seq,time,activity,player_id,player_label)';

/**
 * Latest program. Staff get draft or published; a player's own RLS only ever
 * returns published rows, so asking for everything is safe.
 * Null when no program has been sent yet.
 */
export async function loadLatestSchedule(): Promise<CampSchedule | null> {
  const rows = await select<ScheduleRow>(
    'camp_schedules',
    `${SCHEDULE_SELECT}&order=updated_at.desc&limit=1`,
  );
  return rows.length > 0 ? scheduleFromRow(rows[0]) : null;
}

export interface ScheduleDraft {
  title: string;
  sourceFile: string;
  activities: CampActivity[];
  /** Publish immediately ("Send to Players"). */
  publish: boolean;
  author: string | null;
}

/**
 * Save the parsed program: one schedule row, one row per line.
 * On top of an existing schedule the lines are replaced and the version is
 * bumped, which is what tells players "this changed".
 */
export async function saveSchedule(draft: ScheduleDraft, existing?: CampSchedule): Promise<CampSchedule> {
  let scheduleId: number;
  if (existing) {
    const [row] = await update<ScheduleRow>(
      'camp_schedules',
      `id=eq.${existing.id}`,
      {
        title: draft.title,
        source_file: draft.sourceFile,
        status: draft.publish ? 'published' : existing.status,
        version: existing.version + 1,
        updated_at: new Date().toISOString(),
      },
    );
    scheduleId = row.id;
    // Replace the lines wholesale: the parse output is the source of truth.
    await remove('camp_schedule_activities', `schedule_id=eq.${scheduleId}`);
  } else {
    const row = await insert<ScheduleRow>('camp_schedules', {
      title: draft.title,
      source_file: draft.sourceFile,
      status: draft.publish ? 'published' : 'draft',
      version: 1,
      author: draft.author,
      updated_at: new Date().toISOString(),
    });
    scheduleId = row.id;
  }

  if (draft.activities.length > 0) {
    // PostgREST takes the whole array in one POST.
    await insertMany(
      'camp_schedule_activities',
      draft.activities.map((a, i) => ({
        schedule_id: scheduleId,
        day_index: a.dayIndex,
        day_label: a.dayLabel,
        seq: a.seq || i,
        time: a.time,
        activity: a.activity,
        player_id: a.playerId,
        player_label: a.playerLabel,
      })),
    );
  }

  const [fresh] = await select<ScheduleRow>('camp_schedules', `${SCHEDULE_SELECT}&id=eq.${scheduleId}&limit=1`);
  return scheduleFromRow(fresh);
}

/** Publish an already-saved draft without touching its lines. */
export async function publishSchedule(s: CampSchedule): Promise<void> {
  await update('camp_schedules', `id=eq.${s.id}`, {
    status: 'published',
    updated_at: new Date().toISOString(),
  });
}
