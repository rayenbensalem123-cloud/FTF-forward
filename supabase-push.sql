-- Push notifications when a player logs a club match.
-- Run once in the Supabase SQL Editor. Safe to re-run.
--
-- Why this is a database trigger: Expo Go cannot receive remote notifications
-- (expo-notifications is remote-disabled in Expo Go from SDK 53), and this
-- project has no server of its own. So the database calls Expo's push service
-- the moment a report is inserted. One request, at commit time, no deploy.
--
-- Outside this file, once: upload an FCM service account key (Android) and an
-- APNs key (iOS) to the EAS project. Without them getExpoPushTokenAsync() never
-- returns a token, so no phones register and nothing is sent - the app's 30
-- second in-app check keeps working either way.

-- pg_net always installs its functions in a schema called "net", wherever the
-- extension itself is registered.
create extension if not exists pg_net with schema extensions;

-- ------------------------------------------------------------
-- Where each phone's push token lives
-- ------------------------------------------------------------
-- One row per account (the phone they are using now). Keying on the profile
-- rather than the token means switching accounts on one phone just works.
create table if not exists public.push_tokens (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  token      text NOT NULL,
  platform   text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

create index if not exists push_tokens_token_idx ON public.push_tokens (token);

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens_select_own" on public.push_tokens;
drop policy if exists "push_tokens_insert_own" on public.push_tokens;
drop policy if exists "push_tokens_update_own" on public.push_tokens;
drop policy if exists "push_tokens_delete_own" on public.push_tokens;

-- A phone may only register, replace or forget its own token. Nobody can read
-- anyone else's: the sender below runs as the table owner and is not subject to it.
create policy "push_tokens_select_own" ON public.push_tokens
  FOR SELECT USING (profile_id = auth.uid());

create policy "push_tokens_insert_own" ON public.push_tokens
  FOR INSERT WITH CHECK (profile_id = auth.uid());

create policy "push_tokens_update_own" ON public.push_tokens
  FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

create policy "push_tokens_delete_own" ON public.push_tokens
  FOR DELETE USING (profile_id = auth.uid());

revoke all on public.push_tokens from anon;
grant select, insert, update, delete on public.push_tokens to authenticated;

-- ------------------------------------------------------------
-- Tell the staff when a player sends a report
-- ------------------------------------------------------------
create or replace function public.notify_staff_new_club_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  player_name text;
  messages    jsonb;
BEGIN
  -- A report that arrives already verified (staff entering one) needs no alert.
  IF coalesce(new.verified, false) THEN
    RETURN new;
  END IF;

  SELECT coalesce(nullif(btrim(m.name), ''), 'A player')
    INTO player_name
    FROM public.members m
   WHERE m.id = new.member_id;

  SELECT jsonb_agg(jsonb_build_object(
           'to',    s.token,
           'sound', 'default',
           'channelId', 'default',
           'title', 'New match report from ' || coalesce(player_name, 'a player'),
           'body',  concat_ws(' · ',
                      nullif(new.opponent, ''),
                      nullif(new.competition, ''),
                      CASE WHEN coalesce(new.did_not_play, false)
                           THEN 'did not feature'
                           ELSE coalesce(new.minutes_played, 0)::text || ' min' END),
           'data',  jsonb_build_object('reportId', new.id, 'memberId', new.member_id)
         ))
    INTO messages
    FROM (
      SELECT DISTINCT t.token
        FROM public.push_tokens t
        JOIN public.profiles p ON p.id = t.profile_id
       WHERE p.status = 'active'
         AND p.role IN ('staff', 'admin')
         -- Never notify the person who just sent it.
         AND t.profile_id::text IS DISTINCT FROM new.submitted_by::text
    ) s;

  IF messages IS NULL THEN
    RETURN new;  -- no staff phone registered yet
  END IF;

  -- Expo accepts a single message object or an array of them. Fire and forget:
  -- pg_net queues the request and sends it when this transaction commits.
  PERFORM net.http_post(
    url     := 'https://exp.host/--/api/v2/push/send',
    headers := '{"Content-Type": "application/json", "Accept": "application/json", "Accept-Encoding": "gzip, deflate"}'::jsonb,
    body    := messages
  );

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- A push that cannot be sent must never cost us the report.
  RAISE WARNING 'club report push failed: %', sqlerrm;
  RETURN new;
END;
$$;

drop trigger if exists trg_notify_staff_new_club_report on public.club_match_reports;
create trigger trg_notify_staff_new_club_report
  AFTER INSERT ON public.club_match_reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_staff_new_club_report();

-- ------------------------------------------------------------
-- Check it is wired up
-- ------------------------------------------------------------
-- Who has registered a phone:
--   select p.username, t.platform, t.updated_at
--     from public.push_tokens t join public.profiles p on p.id = t.profile_id;
--
-- Send yourself a test push (run on its own; it goes to every registered phone):
--   select net.http_post(
--     url  := 'https://exp.host/--/api/v2/push/send',
--     body := (select jsonb_agg(jsonb_build_object(
--                        'to', token,
--                        'title', 'Push is working',
--                        'body', 'This came from the database, not the app.'))
--                from public.push_tokens)
--   );
--
-- What Expo answered (any "error" row here names the problem):
--   select content::jsonb from net._http_response order by created desc limit 5;
