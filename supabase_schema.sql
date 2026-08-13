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
-- The console authenticates with a passcode in the browser, not with Supabase
-- Auth, so the anonymous key must be able to write. That means anyone who
-- reads the page source can also write to this table. This is a deliberate
-- trade-off for passcode-only access, not an oversight.
--
-- To close it later: create a user in Authentication -> Users, switch the
-- console to supabase.auth.signInWithPassword, then replace the policy below
-- with the two commented-out policies underneath it.

DROP POLICY IF EXISTS "site_content public read/write" ON public.site_content;
CREATE POLICY "site_content public read/write"
  ON public.site_content FOR ALL
  USING (true) WITH CHECK (true);

-- -- Locked-down replacement, for when you move to Supabase Auth:
-- DROP POLICY IF EXISTS "site_content public read/write" ON public.site_content;
-- CREATE POLICY "site_content read" ON public.site_content
--   FOR SELECT USING (true);
-- CREATE POLICY "site_content write" ON public.site_content
--   FOR ALL TO authenticated USING (true) WITH CHECK (true);

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

-- The old site_settings table stored the admin passcode in a column that any
-- anonymous API caller could SELECT. Nothing reads it any more; the console now
-- keeps only a SHA-256 hash inside the document. Drop the column when ready:
--
-- ALTER TABLE public.site_settings DROP COLUMN IF EXISTS admin_passcode;
--
-- DROP TABLE IF EXISTS public.site_settings;
-- DROP TABLE IF EXISTS public.posts;
-- DROP TABLE IF EXISTS public.projects;
-- DROP TABLE IF EXISTS public.now_page;
-- DROP TABLE IF EXISTS public.books;
-- DROP TABLE IF EXISTS public.course_settings;
-- DROP TABLE IF EXISTS public.course_lessons;
