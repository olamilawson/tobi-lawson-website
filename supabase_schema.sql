-- ==============================================================================
-- TOBI LAWSON WEBSITE — SUPABASE DATABASE SCHEMA & REALTIME CONFIGURATION
-- Safe & Idempotent SQL Script
-- ==============================================================================

-- 1. GLOBAL SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  site_title TEXT DEFAULT 'Tobi Lawson',
  hero_title TEXT DEFAULT 'Building and investing with purpose.',
  hero_subtitle TEXT DEFAULT 'Notes on capital, cities, and the slow work of building things that last. Based in Lagos, working across fintech, SME services, and education technology.',
  hero_scribble_word TEXT DEFAULT 'purpose.',
  about_hero_title TEXT DEFAULT 'About Tobi Lawson',
  about_hero_subtitle TEXT DEFAULT 'Investor and builder based in Lagos. Background in investment analysis and development research, now running companies across fintech, SME services, and education technology.',
  about_body_prose TEXT DEFAULT 'I''m an investor and builder based in Lagos. My background is in investment analysis and development research, work that shaped how I think about capital, institutions, and the slow processes that move a country''s fortunes.\n\nToday I run and invest in companies across fintech, SME services technology, product development, and education technology. Alongside that, I co-founded 1914 Reader with Feyi Fawehinmi, where we read Nigeria and Africa''s biggest stories through the lens of global economic and political change.\n\nI also work on Lagos Urban Project, a platform reimagining Lagos as a more inclusive and livable city, and Long Africa, a new institution focused on the long-run foundations of African prosperity.',
  contact_email TEXT DEFAULT 'olamilawson@gmail.com',
  admin_passcode TEXT DEFAULT 'Enlive0801@#',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to site_settings" ON public.site_settings;
CREATE POLICY "Allow public access to site_settings" ON public.site_settings FOR ALL USING (true);

-- Insert Default Global Site Settings
INSERT INTO public.site_settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- 2. WRITING & ESSAYS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Essay',
  date TEXT NOT NULL,
  summary TEXT NOT NULL,
  url TEXT NOT NULL,
  content_html TEXT DEFAULT '',
  is_featured BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to posts" ON public.posts;
CREATE POLICY "Allow public access to posts" ON public.posts FOR ALL USING (true);

-- 3. PROJECTS & INITIATIVES TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  role_tag TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to projects" ON public.projects;
CREATE POLICY "Allow public access to projects" ON public.projects FOR ALL USING (true);

-- 4. NOW PAGE CMS TABLE
CREATE TABLE IF NOT EXISTS public.now_page (
  id TEXT PRIMARY KEY DEFAULT 'global',
  last_updated TEXT DEFAULT 'July 2026',
  hero_title TEXT DEFAULT 'What I''m spending time on',
  intro_subtitle TEXT DEFAULT 'A running account of the projects I''m building, updated as things move. Last updated July 2026.',
  ongoing_prose TEXT DEFAULT 'I run and invest in companies across fintech, SME services technology, product development, and education technology. Some are early-stage, some are further along. I share specifics and case studies here as each venture is ready to talk about publicly.',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.now_page ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to now_page" ON public.now_page;
CREATE POLICY "Allow public access to now_page" ON public.now_page FOR ALL USING (true);

INSERT INTO public.now_page (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- 5. BOOKS & MONOGRAPHS TABLE
CREATE TABLE IF NOT EXISTS public.books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  status_tag TEXT DEFAULT 'FORTHCOMING VOLUME • IN WRITING',
  cover_image_url TEXT DEFAULT 'assets/who-made-this-cover.jpg',
  synopsis_p1 TEXT DEFAULT '',
  synopsis_p2 TEXT DEFAULT '',
  author TEXT DEFAULT 'Tobi Lawson',
  format TEXT DEFAULT 'Hardcover & Digital',
  release_date TEXT DEFAULT 'Late 2026',
  preview_url TEXT DEFAULT 'books/who-made-this-preview.html',
  chapters JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to books" ON public.books;
CREATE POLICY "Allow public access to books" ON public.books FOR ALL USING (true);

-- 6. REALTIME SUBSCRIPTIONS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'site_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.now_page;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.books;
  END IF;
END $$;
