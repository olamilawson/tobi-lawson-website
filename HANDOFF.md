# Project Handoff & Technical Documentation
**Tobi Lawson — Personal Website & Editorial Platform**  
**Repository**: [github.com/olamilawson/tobi-lawson-website](https://github.com/olamilawson/tobi-lawson-website)  
**Branch**: `main`  
**Domain**: [https://tobilawson.com](https://tobilawson.com)

---

## 1. Overview & Key Credentials

- **Admin Console URL**: `https://tobilawson.com/admin.html` or `https://tobilawson.com/admin/`
- **Admin Passcode**: `Enlive0801@#`
- **Local Storage Key**: `tobi_site_data_v2`
- **Supabase Cloud Project URL**: `https://xifwswzqfqwfhihglubs.supabase.co`
- **Supabase Public API Key**: `sb_publishable_Q71S8qzFcM80ikZ6bhPQgg_6HxUgzmI`

---

## 2. Architecture & Tech Stack

This website is engineered as a dependency-free, high-performance static editorial site powered by Vanilla JavaScript (ES Modules), Custom CSS Design Tokens, and two-way Supabase Cloud Sync with LocalStorage fallbacks.

### Core Files
- `index.html` — Homepage (Hero, Selected Ventures & Projects, Recent Essays & Notes, Footer)
- `about.html` / `about/index.html` — About Page (Hero, Lead Subtitle, Portrait Image, Bio Prose, Direct Contact)
- `books.html` / `books/index.html` — Books & Monographs Showcase (Book Cover, Synopsis, Table of Contents Grid)
- `now.html` / `now/index.html` — Now Page (Running account of active initiatives & portfolio)
- `course.html` / `course/index.html` — Free Course Platform (*Artificial Intelligence in Frontier Markets*)
- `admin.html` / `admin/index.html` — Editorial Admin Console (6-Tab CMS for full website content editing)
- `base.css` & `style.css` — Modern design system (Hallmark typography pairing: `Playfair Display` + `Inter`)
- `app.js` — Public site hydration engine & real-time sync listener
- `admin.js` — Admin Console controller, passcode authentication, form handlers, tab switcher
- `supabase.js` — Supabase client initialization, REST API fallback methods, real-time channels
- `supabase_schema.sql` — Idempotent SQL schema file for Supabase database tables

---

## 3. Editorial Admin Console Capabilities

The Admin Console contains 6 functional tabs:

1. **Tab 1: Site Settings & Bio**
   - Site Title & Brand Name
   - Homepage Hero Headline & Lead Subtitle
   - About Page Headline, Lead Subtitle, Bio Prose, and Portrait Photo (URL + File Upload)
   - Contact Email & Admin Passcode
   - Footer Tagline, Copyright, Custom Link 1 (Name & URL), Custom Link 2 (Name & URL)

2. **Tab 2: Now Page & Projects**
   - "Now" Page Headline, Intro Subtitle, and Ongoing Focus Prose
   - Projects List (Add, Edit, Delete active initiatives like *1914 Reader*, *Lagos Urban*, *Long Africa*)

3. **Tab 3: Writing & Essays**
   - Essay & Review Catalog (Add, Edit, Delete articles with custom dates, summaries, and URLs)

4. **Tab 4: Books & Monographs**
   - Book Showcase Details (Title, Subtitle, Status Tag, Cover Image, Synopsis, Preview URL)
   - Chapters CMS (Add, Edit, Delete Table of Contents entries)

5. **Tab 5: Free Course CMS**
   - Masterclass Syllabus Overview & Status Tag
   - Video Lesson Modules (Add, Edit, Delete modules with YouTube embeds or video uploads)

6. **Tab 6: Cloud & Backup**
   - Real-time Supabase Cloud Connection Status
   - Full JSON Export / Download Backup
   - Full JSON Import / Restore Backup
   - Factory Reset to Initial Defaults

---

## 7. Hostinger Deployment Instructions

To sync updates from GitHub to your Hostinger VPS, run this command in your Hostinger Web Terminal:

```bash
cd /var/www/tobilawson.com && git fetch origin main && git reset --hard origin/main
```

---

## 8. Optional Supabase Database Maintenance

If you wish to ensure all database columns exist in Supabase Cloud, run the following script in your **Supabase Dashboard** → **SQL Editor**:

```sql
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS footer_tagline TEXT DEFAULT 'Investor, builder, and writer based in Lagos.';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS footer_copyright TEXT DEFAULT '© 2026 Tobi Lawson. All rights reserved.';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS footer_link1_name TEXT DEFAULT '1914 Reader';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS footer_link1_url TEXT DEFAULT 'https://www.1914reader.com/';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS footer_link2_name TEXT DEFAULT 'Lagos Urban';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS footer_link2_url TEXT DEFAULT 'http://lagosurban.com';
```
