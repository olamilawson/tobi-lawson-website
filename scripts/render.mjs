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

// Pages that are not part of the public site, or not rendered from content.
const SKIP = new Set(["admin.html", "admin/index.html", "now.html", "now/index.html"]);
const SKIP_DIRS = new Set(["node_modules", "scripts", "assets"]);

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

function renderPage(rel, doc) {
  const file = path.join(root, rel);
  const before = fs.readFileSync(file, "utf8");
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

function sitemap(doc) {
  const day = String(doc.updatedAt || new Date().toISOString()).slice(0, 10);
  const fixed = ["/", "/writing/", "/projects/", "/books/", "/about/", "/course/"];
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

const changed = pages().filter((rel) => renderPage(rel, doc));
if (writeIfChanged("feed.xml", feed(doc))) changed.push("feed.xml");
if (writeIfChanged("sitemap.xml", sitemap(doc))) changed.push("sitemap.xml");

if (changed.length) console.log(`${new Date().toISOString()} rendered ${changed.length}: ${changed.join(", ")}`);
