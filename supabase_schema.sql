-- Tobi Lawson — site content schema (v3)
--
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> Run.
-- It is idempotent, so running it again is harmless.
--
-- The entire site is one JSONB document in one row. That is deliberate: under
-- the old design every new editable field needed its own snake_case column
-- across seven tables, and fields that were added in the app but not in the
-- database silently failed to save. With a document there is nothing to keep
-- in sync — content-schema.js is the only definition of what exists.

CREATE TABLE IF NOT EXISTS public.site_content (
  id          TEXT PRIMARY KEY,
  doc         JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.site_content (id) VALUES ('global')
  ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Access policy
-- ---------------------------------------------------------------------------
-- Everyone can read. Only Supabase Auth users listed in site_admins can write.
--
-- "Any signed-in user" would not be enough: Supabase allows sign-ups by
-- default, and the public key in the page source is all a stranger needs to
-- create an account. Writes are therefore checked against an explicit list.
--
-- After running this file:
--   1. Authentication -> Users -> Add user. Use your own email and a strong
--      password. Copy the user's UID.
--   2. Run:  INSERT INTO public.site_admins (user_id) VALUES ('<that UID>');
--   3. Authentication -> Sign In / Providers -> turn off "Allow new users to
--      sign up". Not required for safety, but there is no reason to leave it on.

CREATE TABLE IF NOT EXISTS public.site_admins (
  user_id  UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE
);

-- No policies on site_admins: with RLS on, the API cannot read or change it at
-- all. You manage it from the SQL Editor, which bypasses RLS.
ALTER TABLE public.site_admins ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER so the write policy can consult site_admins even though the
-- caller has no access to that table.
CREATE OR REPLACE FUNCTION public.is_site_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.site_admins WHERE user_id = auth.uid());
$$;

DROP POLICY IF EXISTS "site_content public read/write" ON public.site_content;
DROP POLICY IF EXISTS "site_content read" ON public.site_content;
DROP POLICY IF EXISTS "site_content write" ON public.site_content;
DROP POLICY IF EXISTS "site_content admin insert" ON public.site_content;
DROP POLICY IF EXISTS "site_content admin update" ON public.site_content;

CREATE POLICY "site_content read" ON public.site_content
  FOR SELECT USING (true);
CREATE POLICY "site_content admin insert" ON public.site_content
  FOR INSERT TO authenticated WITH CHECK (public.is_site_admin());
CREATE POLICY "site_content admin update" ON public.site_content
  FOR UPDATE TO authenticated
  USING (public.is_site_admin()) WITH CHECK (public.is_site_admin());
-- No DELETE policy: nothing in the app deletes the row, so nobody can.

-- ---------------------------------------------------------------------------
-- Old seven-table layout — make it read-only
-- ---------------------------------------------------------------------------
-- These tables were writable by anyone with the public key, and the app still
-- reads them once to migrate. Replace whatever policies they have with a
-- read-only one, and drop the column that held the old passcode in plaintext,
-- readable by any anonymous API caller.

DO $$
DECLARE
  t   TEXT;
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY['site_settings', 'posts', 'projects', 'now_page',
                           'books', 'course_settings', 'course_lessons']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      FOR pol IN SELECT policyname FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = t
      LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
      END LOOP;
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('CREATE POLICY "legacy read only" ON public.%I FOR SELECT USING (true)', t);
    END IF;
  END LOOP;
END $$;

ALTER TABLE IF EXISTS public.site_settings DROP COLUMN IF EXISTS admin_passcode;

-- ---------------------------------------------------------------------------
-- Realtime — so an edit on one device appears on the others without a reload
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'site_content'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Cleanup of the old layout — OPTIONAL, and only after you have confirmed the
-- site renders correctly and you have downloaded a JSON backup from the
-- console's Cloud & Backup tab. The app migrates these tables into
-- site_content automatically on first load, so do not drop them before that.
-- ---------------------------------------------------------------------------

-- DROP TABLE IF EXISTS public.site_settings;
-- DROP TABLE IF EXISTS public.posts;
-- DROP TABLE IF EXISTS public.projects;
-- DROP TABLE IF EXISTS public.now_page;
-- DROP TABLE IF EXISTS public.books;
-- DROP TABLE IF EXISTS public.course_settings;
-- DROP TABLE IF EXISTS public.course_lessons;
