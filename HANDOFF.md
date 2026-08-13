# Tobi Lawson — Site & Editorial Console

**Live**: https://tobilawson.com · **Console**: https://tobilawson.com/admin
**Stack**: static HTML, vanilla ES modules, Supabase for storage. No build step.

> This file is documentation, not a password store. The console passcode is not
> written down here — it lives only as a SHA-256 hash inside the content
> document, and you change it from the console's **Access** tab.

---

## 1. Do this once, now

The rebuild moved storage from seven tables to a single document table. Until
you create it, the console will save your edits on the device you're using and
show a message saying the cloud rejected the write.

1. Open the Supabase dashboard → **SQL Editor** → **New query**.
2. Paste the contents of [`supabase_schema.sql`](supabase_schema.sql) and run it.
3. Open https://tobilawson.com/admin, sign in, and press **Save** on any tab.

Your existing content migrates automatically: on first load the app reads the
old `site_settings` / `posts` / `projects` / `now_page` / `books` /
`course_settings` / `course_lessons` tables and folds them into the new
document. The old tables are left untouched. Once you've confirmed the site
looks right and downloaded a backup, the commented-out `DROP TABLE` lines at the
bottom of the schema file will clean them up.

**Change the passcode.** The old one was committed to this repo in plaintext and
published at `tobilawson.com/HANDOFF.md`, so treat it as public. Console →
**Access** → new passcode → save.

---

## 2. How content works

One idea runs through the whole thing: **[`content-schema.js`](content-schema.js)
is the only definition of what is editable.** The console UI, the page
hydration, and the database payload are all derived from it.

Previously a field had to be hand-wired in four places — a form input in
`admin.html`, a save handler in `admin.js`, a hydrator in `app.js`, and a
snake_case column in `supabase.js` plus the SQL. Nothing checked that those four
agreed, so fields routinely existed in one or two and silently did nothing.

### Adding something editable

Two steps.

1. Add the field to the relevant group in `content-schema.js`:

   ```js
   { key: "homeProjectsHeading", label: "Projects Section — Heading", type: "text",
     default: "Selected Ventures & Projects" }
   ```

2. Point the page element at it:

   ```html
   <h2 data-cms="homeProjectsHeading">Selected Ventures &amp; Projects</h2>
   ```

The console form, the storage, and the cloud sync all follow automatically.
No database migration — the document is JSONB.

### Page attributes

| Attribute | Effect |
|---|---|
| `data-cms="key"` | Sets the element's text. `prose` fields render as paragraphs; `##` becomes a subheading and `>` a pull quote. |
| `data-cms-attr="href:key"` | Sets an attribute from a field. Several allowed, separated by `;`. `mailto:key` writes `href="mailto:…"`. |
| `data-cms-list="name"` | Marks a repeating region, rendered by a named renderer in `app.js`. |
| `data-cms-book="key"` | A field of the featured (first) book. |
| `data-cms-post` | Marks an essay page; the essay is matched by URL or `?id=`. |
| `data-cms-scribble` | The homepage headline, with one word circled. |

The static HTML inside a `data-cms-list` region stays as the pre-JavaScript
fallback and is replaced on hydration.

### Field types

`text`, `textarea` (line breaks preserved), `prose` (blank line = new
paragraph), `url`, `email`, `image` (URL box plus file picker that inlines the
image as a data URI), `select`.

---

## 3. Files

| File | Role |
|---|---|
| `content-schema.js` | Every editable field and list. Start here. |
| `content-store.js` | Local cache, cloud merge, escaping, passcode hashing. |
| `supabase.js` | Cloud read/write, realtime, legacy migration. |
| `app.js` | Public-site hydration. Generic — no per-page code. |
| `admin.js` | Console. Generates all forms from the schema. |
| `admin.html` | Console shell: auth screen, tab container, modal, toast. |
| `supabase_schema.sql` | Database setup. Idempotent. |
| `base.css`, `style.css` | Design system (Playfair Display + Inter). |

Public pages: `index`, `about`, `books`, `now`, `course`, `writing/index`, plus
`writing/post.html`, which renders any essay created in the console.

### The duplicated page files

`about.html` and `about/index.html` are byte-identical copies, as are `books`,
`now`, `course`, and `admin`. They exist so both `/about` and `/about/` resolve.
**If you edit one, copy it over the other**, or they will drift:

```bash
for p in about books now course admin; do cp $p.html $p/index.html; done
```

---

## 4. Sync behaviour

Content is one document. Whichever copy has the newer `updatedAt` wins —
the cloud copy or the local one. Editing on two devices at once means the last
save wins for the whole document, so avoid simultaneous edits on phone and
laptop.

The console subscribes to Supabase realtime and refreshes when another device
publishes, unless you have a modal open or unsaved changes in a form.

**Cloud & Backup tab**: download a JSON backup, restore one, force this device's
copy over the cloud, or reset to factory defaults.

---

## 5. Known limits

- **The database is writable by anyone.** The console gates on a passcode in the
  browser, so the Supabase anonymous key has to be able to write, and that key
  ships in the page source. Anyone who views source can rewrite your content.
  Closing this means switching to Supabase Auth; `supabase_schema.sql` has the
  replacement policy commented out and ready.
- **Uploaded images are stored as data URIs inside the document.** Fine for a
  portrait and a book cover; the console rejects files over 1.5 MB. For anything
  heavier, upload to `/assets/` and paste the path.
- **Essay bodies written in the console** render at `/writing/post#id=<slug>`.
  The three hand-built essays under `/writing/` keep their own URLs and their
  existing HTML unless you type a body for them in the console, which then
  takes over.
- **Deep links use the fragment, not a query string.** `.htaccess`
  301-redirects `/foo.html` to `/foo`, and a query string does not reliably
  survive that hop. A fragment never leaves the browser, so it always does.

---

## 5a. Writing full book chapters

Books tab → **Edit** a book → each chapter has a **Chapter Text** box. Write the
chapter there, using the same conventions as essays: blank line between
paragraphs, `##` for a subheading, `>` for a pull quote.

- A chapter **with** text gets its own page at
  `/books/chapter#book=<book-id>&chapter=<chapter-id>`, and its card on the
  books page links there with the "Read Chapter →" label.
- A chapter **without** text keeps the old behaviour: its card links to the
  book's preview page with "Read Chapter Preview →".

So you can publish chapters one at a time and the rest of the page keeps
working. Chapter pages carry previous/next links that skip any chapter you
haven't written yet.

Both link labels are editable in the Books tab. Chapter ids are minted from the
title the first time a chapter is saved and then held fixed, so renaming a
chapter does not break a link you have already shared.

---

## 6. Deploying

Hostinger VPS, from the web terminal:

```bash
cd /var/www/tobilawson.com && git fetch origin main && git reset --hard origin/main
```

Serving is static. `.htaccess` handles extensionless URLs, blocks `.md`/`.sql`
from being served, and marks the console `noindex`.
