// Pre-render: write the published content into the site's HTML, and build
// feed.xml and sitemap.xml, so search engines, link previews and first paint
// all see the real copy instead of the defaults written into the templates.
//
// It runs the same applyAll() the browser runs, against each page parsed with
// linkedom. Templates keep their data-cms attributes, so rendering an already
// rendered page gives the same result; a deploy that resets the files to the
// repository's versions is corrected on the next run.
//
//   node scripts/render.mjs              render in place (the server's web root)
//   node scripts/render.mjs --out DIR    write the rendered site into DIR instead
//
// Also draws a share image per essay into og/ (share-image.mjs), and writes
// llms.txt: a plain guide to the site for AI assistants and search agents.
// Needs Node 18.19 or newer (module.register) and `npm ci --omit=dev` for linkedom.
import { register } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

register("./loader.mjs", import.meta.url);
globalThis.__TL_PRERENDER__ = true;

const SITE = "https://tobilawson.com";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outArg = process.argv.indexOf("--out");
const out = outArg > -1 ? path.resolve(process.argv[outArg + 1]) : root;

const { parseHTML } = await import("linkedom");
const { normalize } = await import("/content-store.js");
const { fetchCloudDoc } = await import("/supabase.js");
const { applyAll } = await import("/app.js");
// Share images need resvg's compiled binary. If it will not load on this
// machine, log why and carry on: the pages matter more than the pictures.
let shareImage = null;
try {
  ({ shareImage } = await import("./share-image.mjs"));
} catch (err) {
  console.error(`${new Date().toISOString()} share images off: ${err.message}`);
}

// Pages that are not part of the public site, or not rendered from content.
const SKIP = new Set(["admin.html", "admin/index.html", "now.html", "now/index.html"]);
// agent/ is the personal agent (its own service); desk/ is its built page, not content.
const SKIP_DIRS = new Set(["node_modules", "scripts", "assets", "agent", "desk", "docs"]);

function pages(dir = root, rel = "") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith(".") || e.name.startsWith("._")) return [];
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : pages(path.join(dir, e.name), r);
    return e.name.endsWith(".html") && !SKIP.has(r) ? [r] : [];
  });
}

/** The path a visitor sees for a file: about.html -> /about, about/index.html -> /about/. */
const urlPath = (rel) => "/" + rel.replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, "");

const xml = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const absolute = (url) => new URL(String(url).replace(/\.html(?=$|#)/, ""), SITE).href;

// Each essay gets its own page, built from writing/post.html, so it has a
// real address (/writing/<slug>) instead of a fragment a crawler never sees.
// The marker lets a later run tell its own pages from hand-built ones.
const GENERATED = '<meta name="generator" content="scripts/render.mjs">';
const ESSAY_URL = /^\/writing\/([a-z0-9-]+)\.html$/;

function essayPages(doc) {
  return doc.collections.posts
    .map((p) => (String(p.url || "").match(ESSAY_URL) || [])[1])
    .filter(Boolean)
    .map((slug) => `writing/${slug}.html`)
    .filter((rel) => {
      const file = path.join(root, rel);
      return !fs.existsSync(file) || fs.readFileSync(file, "utf8").includes(GENERATED);
    });
}

/** Remove pages this script generated for essays that no longer exist. */
function removeStaleEssays(keep) {
  const dir = path.join(out, "writing");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map((name) => `writing/${name}`)
    .filter((rel) => rel.endsWith(".html") && !keep.includes(rel))
    .filter((rel) => fs.readFileSync(path.join(out, rel), "utf8").includes(GENERATED))
    .map((rel) => { fs.unlinkSync(path.join(out, rel)); return `-${rel}`; });
}

function renderPage(rel, doc, { essay = false } = {}) {
  let before = fs.readFileSync(path.join(root, essay ? "writing/post.html" : rel), "utf8");
  if (essay) {
    before = before
      .replace(" data-cms-post-dynamic", "")
      .replace("<head>", `<head>\n  ${GENERATED}`);
  }
  const { document } = parseHTML(before);
  const location = new URL(urlPath(rel), SITE);

  globalThis.document = document;
  globalThis.window = { location, addEventListener() {} };
  applyAll(doc, { prerender: true });

  const after = "<!doctype html>\n" + document.documentElement.outerHTML + "\n";
  const target = path.join(out, rel);
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
  if (current === after) return false;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, after);
  return true;
}

function feed(doc) {
  const s = doc.settings;
  const items = doc.collections.posts.map((p) => {
    const when = Date.parse(`1 ${p.date} UTC`);
    return `    <item>
      <title>${xml(p.title)}</title>
      <link>${xml(absolute(p.url))}</link>
      <guid isPermaLink="true">${xml(absolute(p.url))}</guid>
      <description>${xml(p.summary)}</description>${Number.isNaN(when) ? "" : `
      <pubDate>${new Date(when).toUTCString()}</pubDate>`}
    </item>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(s.siteTitle)}</title>
    <link>${SITE}/</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${xml(s.writingHeroSubtitle)}</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
}

/**
 * llms.txt (llmstxt.org): who this is, what is here, and where, in plain
 * Markdown, built from the same content as the pages so it never goes stale.
 */
function llms(doc) {
  const s = doc.settings;
  const one = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
  const line = (title, url, text) => `- [${one(title)}](${absolute(url)})${one(text) ? ": " + one(text) : ""}`;
  const c = doc.collections;
  const out = [
    `# ${one(s.siteTitle) || "Tobi Lawson"}`,
    "",
    `> ${one(s.seoHomeDescription)}`,
    "",
    "Every page is plain HTML with the full text in it, so fetching a URL is enough to read it. The main pages (home, about, writing, books, projects, course) also carry schema.org data in a JSON-LD script tag.",
    "",
    "## Pages",
    "",
    line("Home", "/", ""),
    line("About", "/about/", s.seoAboutDescription),
    line("Writing", "/writing/", s.seoWritingDescription),
    line("Books", "/books/", s.seoBooksDescription),
    line("Projects", "/projects/", s.seoProjectsDescription),
    line("Course", "/course/", s.seoCourseDescription),
    line("Ola", "/ola/", s.seoOlaDescription),
  ];
  if (c.posts.length) {
    out.push("", "## Essays", "");
    for (const p of c.posts) out.push(line(p.title, p.url, [p.date, p.summary].filter(Boolean).join(". ")));
  }
  if (c.books.length) {
    out.push("", "## Books", "");
    for (const b of c.books) {
      out.push(line([b.title, b.subtitle].filter(Boolean).join(": "), "/books/", [b.statusTag, b.synopsisP1].filter(Boolean).join(". ")));
      if (b.previewUrl) out.push(line("Read the first chapter free", b.previewUrl, ""));
    }
  }
  if (c.projects.length) {
    out.push("", "## Projects", "");
    for (const p of c.projects) out.push(line(p.title, p.link || "/projects/", [p.roleTag, p.description].filter(Boolean).join(". ")));
  }
  const lessons = c.lessons.filter((l) => one(l.title));
  if (lessons.length) {
    out.push("", "## Course", "");
    for (const l of lessons) out.push(`- ${one(l.title)}${one(l.status) ? " (" + one(l.status) + ")" : ""}${one(l.summary) ? ": " + one(l.summary) : ""}`);
  }
  out.push(
    "", "## Feeds", "",
    line("Essays as RSS", "/feed.xml", ""),
    line("Every public page", "/sitemap.xml", ""),
    "", "## Private", "",
    "/desk/ and /admin are private working pages for Tobi. There is nothing public to read there; /ola/ describes the agent.",
    ""
  );
  return out.join("\n");
}

function sitemap(doc) {
  const day = String(doc.updatedAt || new Date().toISOString()).slice(0, 10);
  const fixed = ["/", "/writing/", "/projects/", "/books/", "/about/", "/course/", "/ola/"];
  // Fragment URLs (console essays, chapters) are one page to a crawler, so
  // only essays with a path of their own get an entry.
  const essays = doc.collections.posts.map((p) => String(p.url || "")).filter((u) => u && !u.includes("#"));
  const urls = [...fixed, ...essays].map((u) => absolute(u));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(urls)].map((u) => `  <url>
    <loc>${xml(u)}</loc>
    <lastmod>${day}</lastmod>
  </url>`).join("\n")}
</urlset>
`;
}

/**
 * A share image per essay at /og/<slug>.png (see share-image.mjs), written
 * only when the picture changes, and removed when its essay is deleted.
 * The slug matches the one app.js puts in the essay's og:image tag.
 */
function shareImages(doc) {
  if (!shareImage) return [];
  const dir = path.join(out, "og");
  fs.mkdirSync(dir, { recursive: true });
  const slugOf = (p) => (String(p.url || "").match(ESSAY_URL) || [])[1] || p.id;
  const keep = new Set();
  const changed = [];
  for (const post of doc.collections.posts) {
    const name = `${slugOf(post)}.png`;
    keep.add(name);
    const png = shareImage(post, doc.settings);
    const target = path.join(dir, name);
    if (fs.existsSync(target) && Buffer.compare(fs.readFileSync(target), png) === 0) continue;
    fs.writeFileSync(target, png);
    changed.push(`og/${name}`);
  }
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith(".png") && !keep.has(name)) {
      fs.unlinkSync(path.join(dir, name));
      changed.push(`-og/${name}`);
    }
  }
  return changed;
}

function writeIfChanged(name, text) {
  const target = path.join(out, name);
  if (fs.existsSync(target) && fs.readFileSync(target, "utf8") === text) return false;
  fs.writeFileSync(target, text);
  return true;
}

const cloud = await fetchCloudDoc();
if (!cloud) {
  console.error(`${new Date().toISOString()} no content document in Supabase; nothing rendered`);
  process.exit(1);
}
const doc = normalize(cloud);

const essays = essayPages(doc);
const changed = [
  ...pages().filter((rel) => !essays.includes(rel)).filter((rel) => renderPage(rel, doc)),
  ...essays.filter((rel) => renderPage(rel, doc, { essay: true })),
  ...removeStaleEssays(essays),
  ...shareImages(doc)
];
if (writeIfChanged("feed.xml", feed(doc))) changed.push("feed.xml");
if (writeIfChanged("sitemap.xml", sitemap(doc))) changed.push("sitemap.xml");
if (writeIfChanged("llms.txt", llms(doc))) changed.push("llms.txt");

if (changed.length) console.log(`${new Date().toISOString()} rendered ${changed.length}: ${changed.join(", ")}`);
