# Tobi Lawson — Site & Editorial Console

**Live**: https://tobilawson.com · **Console**: https://tobilawson.com/admin
**Stack**: static HTML, vanilla ES modules, Supabase for storage. No build step.

> This file is documentation, not a password store. You sign in to the console
> with a Supabase Auth account; its password lives in Supabase and you change
> it from the console's **Access** tab.

---

## 1. Do this once, now

The console signs in with Supabase Auth, and the database only accepts saves
from accounts listed in `site_admins`. Until you do the steps below, nobody,
you included, can publish. The public site keeps rendering either way.

1. Supabase dashboard → **SQL Editor** → **New query**. Paste the contents of
   [`supabase_schema.sql`](supabase_schema.sql) and run it. It is safe to run
   again.
2. **Authentication → Users → Add user.** Use your own email and a strong
   password, and tick "Auto Confirm User". Copy the new user's UID.
3. Back in the SQL Editor, run:

   ```sql
   INSERT INTO public.site_admins (user_id) VALUES ('<the UID>');
   ```

4. **Authentication → Sign In / Providers →** turn off "Allow new users to
   sign up".
5. Open https://tobilawson.com/admin, sign in, and press **Save** on any tab.
   That save also removes the old passcode hash from the public document.

Step 1 also makes the seven old tables (`site_settings`, `posts`, `projects`,
`now_page`, `books`, `course_settings`, `course_lessons`) read-only and drops
the `admin_passcode` column, which exposed the old passcode to anyone. The app
still reads those tables once, to migrate them when `site_content` is empty.
Once you've confirmed the site looks right and downloaded a backup, the
commented-out `DROP TABLE` lines at the bottom of the schema file will clean
them up.

**The old passcode is public.** It appears in plaintext in this repo's commit
history. Nothing uses it any more, but if you reuse it anywhere else, change it
there.

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

`text`, `textarea` (line breaks preserved), `prose` (see below), `url`,
`email`, `image` (URL box plus file picker that inlines the image as a data
URI), `select`.

### Writing in a prose field

Prose fields are edited visually. You see headings, bold text, real links,
pictures and players as you type. There is no markup on screen.

**To link:** select the words, then either press **Link** and type the address,
or just paste a URL over them. Cmd/Ctrl+K does the same. **Unlink** removes one.

**Toolbar:** H2, H3, bold, italic, link, unlink, pull quote, margin note,
bulleted and numbered lists, picture, video, divider, and Clear to strip
formatting off a selection. Cmd/Ctrl+B and Cmd/Ctrl+I work as expected.

**Margin notes.** Put the cursor after a word and press **Note**. On screens
1400px and wider the note sits in the right margin beside its number; on
narrower screens the number opens it under the line. Notes number themselves
down the essay.

**Source** shows the plain text actually being stored, and you can edit there
directly. Press it again to go back.

**What gets stored is always plain text.** The editable surface is serialised
back to markup on every keystroke, and that markup is what goes into the
content document. This is not a detail to change casually. Only admins can
write the document now, but escaping everything is a second line of defence:
if an admin account were ever compromised, or the write policy loosened by
mistake, stored HTML would become a script injection into every page. Because
prose fields store text and the renderer escapes everything before building
markup, the worst a bad write can do is change the copy.

The stored form, should you ever need to read or write it by hand:

| Text | Renders as |
|---|---|
| blank line between blocks | a new paragraph |
| `## Heading` / `### Heading` | subheading, minor subheading |
| `> Quoted line` | pull quote |
| `- item` / `1. item` on consecutive lines | list |
| `---` alone on a line | divider |
| `[label](https://example.com)` | link, opening in a new tab |
| `[label](/about/)` | link, staying in the tab |
| `**bold**`, `*italic*` | bold, italic |
| backtick-wrapped text | inline code |
| a triple-backtick fence | code block, nothing inside interpreted |
| `![alt](/assets/pic.jpg "A caption")` | picture, caption optional |
| `@video(https://youtu.be/ID)` | embedded player |
| `word^[A margin note, links allowed.]` | numbered margin note |

**Pictures.** Prefer putting the file in `/assets/` and giving the Image button
that path. **Upload** inlines the picture as a data URI inside the content
document, which is fine once and wasteful repeatedly, since the whole document
loads on every page view. Anything over 1.5 MB is refused.

**Video.** Only YouTube and Vimeo are framed, and the embed URL is rebuilt from
an id extracted from what you gave it, so nothing from the document reaches the
`iframe` src directly. Any other host renders as a plain link.

**Bad links.** A `javascript:` or `data:` URL is refused, and an address left
unfilled stays visible as text rather than becoming a link that goes nowhere.

---

## 3. Files

| File | Role |
|---|---|
| `content-schema.js` | Every editable field and list. Start here. |
| `content-store.js` | Local cache, cloud merge, escaping, prose rendering. |
| `supabase.js` | Cloud read/write, console sign-in, realtime, legacy migration. |
| `app.js` | Public-site hydration. Generic — no per-page code. |
| `admin.js` | Console. Generates all forms from the schema. |
| `admin.html` | Console shell: auth screen, tab container, modal, toast. |
| `supabase_schema.sql` | Database setup. Idempotent. |
| `scripts/render.mjs` | Server-side pre-render, RSS feed and sitemap. See section 6. |
| `deploy/nginx.conf` | nginx rules the server needs. See section 6. |
| `base.css`, `style.css` | Design system (Playfair Display + Inter). |

Public pages: `index`, `about`, `books`, `projects`, `course`, `writing/index`, plus
`writing/post.html`, which renders any essay created in the console.

### The duplicated page files

`about.html` and `about/index.html` are byte-identical copies, as are `books`,
`projects`, `course`, and `admin`. They exist so both `/about` and `/about/` resolve.
**If you edit one, copy it over the other**, or they will drift:

```bash
for p in about books projects course admin; do cp $p.html $p/index.html; done
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

- **Adding another editor** means adding them in Authentication → Users and
  inserting their UID into `site_admins`. Removing the row revokes their
  ability to publish immediately.
- **Uploaded images are stored as data URIs inside the document.** Fine for a
  portrait and a book cover; the console rejects files over 1.5 MB. For anything
  heavier, upload to `/assets/` and paste the path.
- **Each essay gets its own page** at `/writing/<slug>`. The render job builds
  it from `writing/post.html` within a minute of a save, with the essay's own
  title, description and share tags, and removes the page if you delete the
  essay. Locally there is no such file until you run `npm run render:preview`;
  `/writing/post#id=<slug>` still shows any essay in the browser.
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

Hostinger VPS (Ubuntu, nginx), from the web terminal. The web root is the git
checkout itself.

### One-time setup

1. **Close the public repository.** nginx ignores `.htaccess`, so the server
   currently serves `/.git/` (the whole history), the `.md` and `.sql` files
   and `package.json`. Paste the rules in [`deploy/nginx.conf`](deploy/nginx.conf)
   inside the site's `server { }` block, above its other `location` blocks,
   then run `sudo nginx -t && sudo systemctl reload nginx`. The same file adds
   the permanent `/now` → `/projects/` redirect. Until then, `now.html` sends
   visitors on with a meta refresh.
2. **Install Node** if `node --version` fails or shows a version below 18.19:
   `sudo apt install nodejs npm`.
3. **Schedule the pre-render.** Run `crontab -e` and add:

   ```
   * * * * * cd /var/www/tobilawson.com && node scripts/render.mjs >> $HOME/tobilawson-render.log 2>&1
   ```

### Every deploy

```bash
cd /var/www/tobilawson.com && git fetch origin main && git reset --hard origin/main && npm ci --omit=dev && node scripts/render.mjs
```

### Pre-rendering

[`scripts/render.mjs`](scripts/render.mjs) reads the published document from
Supabase and runs the same `applyAll()` the browser runs, against every page,
then writes the result over the HTML in place. It also writes `feed.xml` (RSS)
and `sitemap.xml`. Search engines and link previews therefore see the real
copy, and readers no longer see the template text flash before the content
arrives. A console save reaches the HTML within a minute.

The templates keep their `data-cms` attributes, so rendering a rendered page
changes nothing, and a deploy that resets the files is corrected on the next
run. Console essays and book chapters choose their content from the URL
fragment, which a server never sees, so those two pages still fill in the
browser.

To see the output locally without touching the working tree:
`npm run render:preview` writes the rendered site to `.render-preview/`.

### Newsletter

Each essay ends with a signup box, and the course page has a waitlist. Both
post straight to Buttondown (account `tobilaw`); the course form tags its
signups `course-waitlist` so you can write to them alone. Clearing the
username in the console (Writing tab) hides both.

### Share images

The render job draws a 1200 × 630 picture for each essay at `/og/<slug>.png`
(`scripts/share-image.mjs`): title, date, summary and your name on the site's
background. The essay page names it as its link-preview image, so a shared
link shows the essay rather than a generic photo. It is redrawn when the
title or summary changes.

