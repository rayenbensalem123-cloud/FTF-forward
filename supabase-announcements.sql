-- Team announcements, shown on the mobile app's Home screen.
-- Run once in the Supabase SQL Editor. Safe to re-run.
--
-- Who can do what:
--   read   : every active account (staff and players)
--   write  : active admins only
-- Same helpers as the rest of the schema (see supabase-setup.sql).

CREATE TABLE IF NOT EXISTS public.announcements (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title           text NOT NULL,
  body            text NOT NULL DEFAULT '',
  pinned          boolean NOT NULL DEFAULT false,
  author_username text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_select_active" ON public.announcements;
DROP POLICY IF EXISTS "announcements_write_admin"   ON public.announcements;

CREATE POLICY "announcements_select_active" ON public.announcements
  FOR SELECT USING (public.current_active_user());

CREATE POLICY "announcements_write_admin" ON public.announcements
  FOR ALL USING (public.current_active_admin()) WITH CHECK (public.current_active_admin());

-- The anon key must not be able to read announcements.
REVOKE ALL ON public.announcements FROM anon;
