-- ============================================================
-- CAMP SCHEDULE : the coach's program, parsed and pushed to the players.
-- Run once in Supabase Dashboard > SQL Editor > New query. Safe to re-run.
--
-- Depends on (same schema, see supabase-setup.sql / supabase-player-accounts.sql):
--   public.is_staff_account()   -- active staff/admin?
--   public.current_member_id()  -- the caller's own player card (NULL for staff)
--   public.current_active_user()
--
-- Who can do what:
--   staff : read everything, insert / update / delete (draft and published)
--   player: read a PUBLISHED schedule only, and only the rows that are
--           for everyone (player_id IS NULL) or addressed to their own card
--   anon  : nothing
-- ============================================================

-- ------------------------------------------------------------
-- 1. THE SCHEDULE (one row per upload / program version)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.camp_schedules (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title        text NOT NULL DEFAULT '',
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  -- File the program came from, for the coach's own reference ("programme.docx").
  source_file  text NOT NULL DEFAULT '',
  -- Bumped every time the coach edits or re-sends, so players can spot an update.
  version      integer NOT NULL DEFAULT 1,
  author       text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. THE ACTIVITIES (one row per line of the program)
--    player_id NULL  -> everybody sees it
--    player_id set   -> only that player (shown with a red border + the name)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.camp_schedule_activities (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  schedule_id  bigint NOT NULL REFERENCES public.camp_schedules(id) ON DELETE CASCADE,
  day_index    integer NOT NULL DEFAULT 0,
  -- Day header as the coach wrote it: "Day 1", "21 October", "Lundi 21"...
  day_label    text NOT NULL DEFAULT '',
  -- Sort order of the line inside its day.
  seq          integer NOT NULL DEFAULT 0,
  time         text NOT NULL DEFAULT '',
  activity     text NOT NULL DEFAULT '',
  -- Linked player card. ON DELETE SET NULL keeps the program if a card goes away.
  player_id    bigint REFERENCES public.members(id) ON DELETE SET NULL,
  -- Name exactly as the coach typed it ("S. Gharbi"), kept even when linked.
  player_label text NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS camp_schedule_activities_schedule_idx
  ON public.camp_schedule_activities(schedule_id, day_index, seq);

-- ------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE public.camp_schedules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camp_schedule_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "camp_schedules_select"        ON public.camp_schedules;
DROP POLICY IF EXISTS "camp_schedules_staff_write"   ON public.camp_schedules;
DROP POLICY IF EXISTS "camp_activities_select"       ON public.camp_schedule_activities;
DROP POLICY IF EXISTS "camp_activities_staff_write"  ON public.camp_schedule_activities;

-- Staff read every schedule; players only a published one.
CREATE POLICY "camp_schedules_select" ON public.camp_schedules
  FOR SELECT USING (
    public.current_active_user()
    AND ( public.is_staff_account() OR status = 'published' )
  );

CREATE POLICY "camp_schedules_staff_write" ON public.camp_schedules
  FOR ALL USING ( public.is_staff_account() )
  WITH CHECK ( public.is_staff_account() );

-- Staff read every line. A player reads a published schedule's lines when they
-- are for everyone or addressed to its own card -- never another player's.
CREATE POLICY "camp_activities_select" ON public.camp_schedule_activities
  FOR SELECT USING (
    public.current_active_user()
    AND (
      public.is_staff_account()
      OR (
        EXISTS (
          SELECT 1 FROM public.camp_schedules s
          WHERE s.id = schedule_id AND s.status = 'published'
        )
        AND ( player_id IS NULL OR player_id = public.current_member_id() )
      )
    )
  );

CREATE POLICY "camp_activities_staff_write" ON public.camp_schedule_activities
  FOR ALL USING ( public.is_staff_account() )
  WITH CHECK (
    public.is_staff_account()
    -- A staff write can never smuggle a row into somebody else's schedule.
    AND EXISTS (
      SELECT 1 FROM public.camp_schedules s
      WHERE s.id = schedule_id AND public.is_staff_account()
    )
  );

-- The anon key must not reach the program at all.
REVOKE ALL ON public.camp_schedules          FROM anon;
REVOKE ALL ON public.camp_schedule_activities FROM anon;
