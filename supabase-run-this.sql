-- RUN THIS ONCE in Supabase > SQL Editor > New query > paste all > Run. Safe to run again.
-- Contains: card suggestion + claim, linked-card summary, daily check-in.

-- ============================================================
-- TUNISIA WNT — SUGGEST + CONFIRM A PLAYER CARD DURING SIGN-UP
--
-- Run in Supabase Dashboard > SQL Editor, AFTER supabase-setup.sql and
-- supabase-player-accounts.sql. Safe to re-run.
--
-- supabase-player-accounts.sql section 6 already links a new player account
-- to its card when the typed name matches EXACTLY (accents/case ignored).
-- This adds the other half: when it does not match exactly (a spelling like
-- "Mariem" for "Maryem", or two cards share a name), the new player is shown
-- the closest cards and confirms "Yes, that's me", which links the account.
--
-- Safety:
--   * Only a PENDING, still-unlinked PLAYER account can ask or claim, and only
--     once. Staff, active and already-linked accounts get nothing.
--   * The candidates are computed from the first/last name stored on the
--     caller's own profile, never from client-supplied text on claim.
--   * Cards already linked to another account are never offered.
--   * Only name, number, position, category and club are shown: no photo,
--     birthdate, passport or medical data.
--   * The account stays pending, so an admin still approves it (and sees the
--     link) before it can read anything.
--   * No new client write path: the link is set inside a SECURITY DEFINER
--     function, and the privilege guard lets exactly that one change through.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Can this caller still pick a card? (pending player, no card yet)
CREATE OR REPLACE FUNCTION public.can_claim_player_card()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT coalesce((
    SELECT p.role = 'player' AND p.status = 'pending' AND p.member_id IS NULL
    FROM profiles p WHERE p.id = auth.uid()
  ), false);
$$;

-- The closest unlinked player cards for a name (internal helper).
CREATE OR REPLACE FUNCTION public._card_candidates(p_first text, p_last text)
RETURNS TABLE (member_id bigint, name text, jersey_number text, card_position text, category text, club text, dist int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH k AS (
    SELECT public.norm_person_name(coalesce(p_first, '') || coalesce(p_last, '')) AS a,
           public.norm_person_name(coalesce(p_last, '') || coalesce(p_first, '')) AS b
  )
  SELECT m.id, m.name, m.jersey_number::text, m."position"::text, m.team_category::text, m.club::text,
         least(levenshtein(k.a, public.norm_person_name(m.name)),
               levenshtein(k.b, public.norm_person_name(m.name))) AS dist
  FROM members m, k
  WHERE length(k.a) >= 5
    AND m.role = 'PLAYERS'
    AND length(public.norm_person_name(m.name)) BETWEEN 3 AND 80
    AND NOT EXISTS (SELECT 1 FROM profiles pr WHERE pr.member_id = m.id)
    AND least(levenshtein(k.a, public.norm_person_name(m.name)),
              levenshtein(k.b, public.norm_person_name(m.name)))
        <= least(3, greatest(1, length(public.norm_person_name(m.name)) / 5))
  ORDER BY dist, m.name
  LIMIT 3;
$$;
REVOKE ALL ON FUNCTION public._card_candidates(text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.suggest_player_cards()
RETURNS TABLE (member_id bigint, name text, jersey_number text, card_position text, category text, club text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE pr profiles%ROWTYPE;
BEGIN
  IF NOT public.can_claim_player_card() THEN RETURN; END IF;
  SELECT * INTO pr FROM profiles WHERE id = auth.uid();
  RETURN QUERY
    SELECT c.member_id, c.name, c.jersey_number, c.card_position, c.category, c.club
    FROM public._card_candidates(pr.first_name, pr.last_name) c
    ORDER BY c.dist, c.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_player_card(p_member_id bigint)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE pr profiles%ROWTYPE;
BEGIN
  IF NOT public.can_claim_player_card() THEN RETURN false; END IF;
  SELECT * INTO pr FROM profiles WHERE id = auth.uid();

  -- Serialise two people claiming the same card, then re-check it is free.
  PERFORM 1 FROM members WHERE id = p_member_id FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM public._card_candidates(pr.first_name, pr.last_name) c WHERE c.member_id = p_member_id) THEN
    RETURN false;
  END IF;

  PERFORM set_config('app.card_claim', 'on', true);
  UPDATE profiles SET member_id = p_member_id WHERE id = auth.uid() AND member_id IS NULL;
  PERFORM set_config('app.card_claim', 'off', true);
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.can_claim_player_card(), public.suggest_player_cards(), public.claim_player_card(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_claim_player_card(), public.suggest_player_cards(), public.claim_player_card(bigint) TO authenticated;

-- ------------------------------------------------------------
-- The privilege guard from supabase-player-accounts.sql, plus ONE clause:
-- the claim function above may set member_id while it is still empty, and
-- only that. Everything else is unchanged. If you have edited this function
-- directly in the database, merge that clause into your version instead.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_active_admin() OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- A confirmed card claim: member_id goes from empty to a card, nothing else moves.
  IF current_setting('app.card_claim', true) = 'on'
     AND OLD.member_id IS NULL
     AND NEW.role IS NOT DISTINCT FROM OLD.role
     AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.permissions IS NOT DISTINCT FROM OLD.permissions
     AND NEW.username IS NOT DISTINCT FROM OLD.username THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.permissions IS DISTINCT FROM OLD.permissions
     OR NEW.username IS DISTINCT FROM OLD.username
     OR NEW.member_id IS DISTINCT FROM OLD.member_id THEN
    RAISE EXCEPTION 'Only an active admin can change role, status, permissions, username or linked player'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- Lets a brand-new (still pending) player account see WHICH card it was linked to,
-- so the sign-up screen can say "Linked to your card: Maryem Houij".
-- Returns only that one card's name, number, position, category and club.
-- Run once in the Supabase SQL Editor. Safe to re-run.

CREATE OR REPLACE FUNCTION public.my_linked_card()
RETURNS TABLE (member_id bigint, name text, jersey_number text, card_position text, category text, club text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.id, m.name, m.jersey_number::text, m."position"::text, m.team_category::text, m.club::text
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
