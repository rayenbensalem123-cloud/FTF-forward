-- RUN THIS ONCE in Supabase > SQL Editor > New query > paste all > Run. Safe to run again.
-- Contains: my_linked_card() (sign-up card linking) + player_checkins (daily check-in).

-- Lets a brand-new (still pending) player account see WHICH card it was linked to,
-- so the sign-up screen can say "Linked to your card: Maryem Houij".
-- Returns only that one card's name, number, position, category and club.
-- Run once in the Supabase SQL Editor. Safe to re-run.

CREATE OR REPLACE FUNCTION public.my_linked_card()
RETURNS TABLE (member_id bigint, name text, jersey_number text, card_position text, category text, club text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.id, m.name, m.jersey_number::text, m."position"::text, m.category::text, m.club::text
  FROM profiles p JOIN members m ON m.id = p.member_id
  WHERE p.id = auth.uid() AND m.role = 'PLAYERS';
$$;

REVOKE ALL ON FUNCTION public.my_linked_card() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_linked_card() TO authenticated;


-- ============================================================
-- DAILY CHECK-IN : each player says how she feels today; staff see it at a glance.
-- Run once in Supabase Dashboard > SQL Editor > New query. Safe to re-run.
--
-- Depends on (same schema, see supabase-camp-schedule.sql):
--   public.is_staff_account(), public.current_member_id(), public.current_active_user()
--
-- Who can do what:
--   player: read, add and change ONLY her own row for today (member_id = her own card)
--   staff : read every row, change nothing (a check-in is the player's own word)
--   anon  : nothing
-- ============================================================

CREATE TABLE IF NOT EXISTS public.player_checkins (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id  bigint NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  day        date   NOT NULL DEFAULT current_date,
  state      text   NOT NULL CHECK (state IN ('fit', 'tired', 'sore', 'unwell')),
  note       text   NOT NULL DEFAULT '' CHECK (char_length(note) <= 280),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, day)
);

CREATE INDEX IF NOT EXISTS player_checkins_day_idx ON public.player_checkins(day DESC);

ALTER TABLE public.player_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkins_select"        ON public.player_checkins;
DROP POLICY IF EXISTS "checkins_player_insert" ON public.player_checkins;
DROP POLICY IF EXISTS "checkins_player_update" ON public.player_checkins;

CREATE POLICY "checkins_select" ON public.player_checkins
  FOR SELECT USING (
    public.current_active_user()
    AND ( public.is_staff_account() OR member_id = public.current_member_id() )
  );

-- Only today's row can be written, so history cannot be rewritten afterwards.
CREATE POLICY "checkins_player_insert" ON public.player_checkins
  FOR INSERT WITH CHECK (
    public.current_active_user()
    AND member_id = public.current_member_id()
    AND day = current_date
  );

CREATE POLICY "checkins_player_update" ON public.player_checkins
  FOR UPDATE USING (
    public.current_active_user() AND member_id = public.current_member_id() AND day = current_date
  ) WITH CHECK (
    member_id = public.current_member_id() AND day = current_date
  );

REVOKE ALL ON public.player_checkins FROM anon;
