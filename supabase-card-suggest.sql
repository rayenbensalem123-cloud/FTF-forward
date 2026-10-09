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
  SELECT m.id, m.name, m.jersey_number::text, m."position"::text, m.category::text, m.club::text,
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
