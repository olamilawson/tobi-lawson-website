# Tobi Lawson — Personal Website

The personal site of Tobi Lawson, an investor and builder based in Lagos:
essays, book reviews, books in progress, a course, and a page of projects.

**Live**: https://tobilawson.com · **Console**: https://tobilawson.com/admin

Static HTML and vanilla ES modules, with no build step. Every piece of copy is
editable from a browser console at `/admin`, which stores the whole site as one
JSON document in Supabase. The pages render with their built-in HTML first,
then `app.js` fills them from that document.

For how the content system works, how to add an editable field, the prose
format, sync behaviour and deployment, read **[HANDOFF.md](HANDOFF.md)**.

## Run it locally

```bash
npm run dev
```

Open http://localhost:3000. The local copy reads the live Supabase document,
so you see real content. Publishing from the local console needs a signed-in
admin account, the same as production.

## Layout

```
index.html, about.html, books.html,     Public pages. about, books, projects,
projects.html, course.html              course and admin each also exist as x/index.html
                                        so /x and /x/ both resolve. Keep each
                                        pair identical.
writing/                                Essay archive, three hand-built essays,
                                        and post.html for essays written in the
                                        console.
books/                                  Book landing page, chapter reader, and
                                        the "Who Made This?" preview.
admin.html, admin.js                    Editorial console.
prose-editor.js                         Visual editor for long-form fields.
content-schema.js                       Every editable field. Start here.
content-store.js                        Local cache, cloud merge, escaping,
                                        prose rendering.
supabase.js                             Cloud read/write and console sign-in.
supabase_schema.sql                     Database table and access policies.
base.css, style.css                     Reset and design system.
assets/                                 Portraits, book cover, favicons.
.htaccess                               Extensionless URLs, blocks docs and
                                        config files, security headers.
```

## Design system

Tokens live in `:root` in `style.css`.

- **Type**: Playfair Display for headlines and prose, bold uppercase Inter for
  labels and metadata (`.meta`).
- **Colour**: warm bone background `#f4f4f2`, off-black text `#111111`, hairline
  rules `#d0d0ce`, and one accent, electric orange `#ff3d00`, kept to a small
  share of any page.
- **Motion**: ease-out `cubic-bezier(0.16, 1, 0.3, 1)`, and every animation
  respects `prefers-reduced-motion`.

The full design and copywriting rules are in
[.agents/AGENTS.md](.agents/AGENTS.md).

## Deploying

The site is served by nginx from a Hostinger VPS, with a cron job that pre-renders the published content into the HTML every minute (HANDOFF.md, section 6). From its web terminal:

```bash
cd /var/www/tobilawson.com && git fetch origin main && git reset --hard origin/main && npm ci --omit=dev && node scripts/render.mjs
```

When you change a CSS or JS file, bump the `?v=` query on every reference to
it (all pages and the module imports use the same version), or browsers keep
the old copy for up to a month.
