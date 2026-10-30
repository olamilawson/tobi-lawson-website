/**
 * Tobi Lawson — public site hydration.
 *
 * There is no per-page hydration code here. Every page marks its editable
 * elements with `data-cms="<schema key>"` and its repeating regions with
 * `data-cms-list="<renderer>"`, and this file wires them up generically.
 *
 *   <h2 data-cms="homeProjectsHeading">Selected Ventures</h2>
 *   <a  data-cms="footerLink1Name" data-cms-attr="href|footerLink1Url">…</a>
 *   <div data-cms-list="homeProjects"></div>
 *
 * All author-supplied text is escaped before it reaches innerHTML.
 */

import { loadContent, onContentUpdated, esc, escUrl, renderProse, renderLines } from "/content-store.js?v=3.19.0";
import { subscribeToCloud } from "/supabase.js?v=3.19.0";
import { FIELD_BY_KEY, PROJECT_GROUPS } from "/content-schema.js?v=3.19.0";

// ---------------------------------------------------------------------------
// Singleton fields
// ---------------------------------------------------------------------------

/**
 * `data-cms="key"`              sets the element's text (or HTML, for prose fields)
 * `data-cms-attr="href:key"`    sets an attribute from a field; several may be
 *                               separated by ";". The pseudo-attribute "mailto"
 *                               writes href="mailto:<value>".
 * The two are independent, so one element can use either or both.
 */
/**
 * The value to hand setAttribute. setAttribute takes plain text and does its
 * own escaping, so passing it HTML-escaped text stores "&amp;" literally and
 * breaks any link with "&" in it. URLs still go through escUrl's check, which
 * refuses javascript: and data:, but the original string is what gets set.
 */
function attrValue(attr, value) {
  const text = String(value ?? "").trim();
  if (attr === "href" || attr === "src") return escUrl(text) ? text : "";
  return String(value ?? "");
}

function applyFields(settings) {
  // data-cms-hide-empty="key" hides a block (the About photo) while its field is empty.
  document.querySelectorAll("[data-cms-hide-empty]").forEach((el) => {
    el.hidden = !String(settings[el.getAttribute("data-cms-hide-empty")] || "").trim();
  });

  document.querySelectorAll("[data-cms]").forEach((el) => {
    const key = el.getAttribute("data-cms");
    if (!(key in settings)) return;
    const value = settings[key];
    const type = FIELD_BY_KEY[key]?.type;

    if (type === "prose") el.innerHTML = renderProse(value);
    else if (type === "textarea") el.innerHTML = renderLines(value);
    else el.textContent = value;
  });

  document.querySelectorAll("[data-cms-attr]").forEach((el) => {
    for (const spec of el.getAttribute("data-cms-attr").split(";")) {
      const [attr, sourceKey] = spec.split(":").map((s) => s.trim());
      if (!attr || !sourceKey || !(sourceKey in settings)) continue;
      const value = settings[sourceKey];

      if (attr === "mailto") {
        const address = String(value || "").trim();
        if (address) el.setAttribute("href", `mailto:${encodeURI(address)}`);
        continue;
      }

      const raw = attrValue(attr, value);
      if (raw) el.setAttribute(attr, raw);
    }
  });
}

/** The homepage headline circles one word with a hand-drawn SVG scribble. */
function applyScribbleHeadline(settings) {
  const el = document.querySelector("[data-cms-scribble]");
  if (!el) return;

  const title = String(settings.homeHeroTitle ?? "");
  const word = String(settings.homeHeroScribbleWord ?? "").trim();
  const scribble = `<svg class="scribble" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true"><path d="M 10,40 C 9,14 50,5 102,5 C 158,5 193,12 192,40 C 191,68 152,76 100,76 C 46,76 8,68 7,42 C 6,22 28,9 72,8"></path></svg>`;

  if (!word || !title.includes(word)) {
    el.innerHTML = renderLines(title);
    return;
  }

  const idx = title.indexOf(word);
  const before = renderLines(title.slice(0, idx));
  const after = renderLines(title.slice(idx + word.length));
  el.innerHTML = `${before}<span class="highlight-wrapper">${esc(word)}${scribble}</span>${after}`;
}

// ---------------------------------------------------------------------------
// Repeating regions
// ---------------------------------------------------------------------------

const empty = (message) =>
  `<div class="meta" style="color: var(--text-muted); padding: 2rem 0;">${esc(message)}</div>`;

const hostLabel = (link) => esc(String(link || "").replace(/^https?:\/\//, "").replace(/\/$/, ""));

const RENDERERS = {
  /** Homepage ventures: only the projects switched on for the homepage. */
  homeProjects(mount, doc) {
    const items = doc.collections.projects.filter((p) => p.featured === "yes");
    if (!items.length) return empty("No projects set to show on the homepage.");
    return items.map((p, i) => ventureRow(p, i)).join("");
  },

  /**
   * Every project on the Projects page, under its group heading. Groups with
   * nothing in them are skipped, and a project whose group no longer exists
   * falls into the first group rather than disappearing.
   */
  projectGroups(mount, doc) {
    const items = doc.collections.projects;
    if (!items.length) return empty("No projects added yet.");
    const known = new Set(PROJECT_GROUPS.map((g) => g.id));
    const groupOf = (p) => (known.has(p.group) ? p.group : PROJECT_GROUPS[0].id);

    return PROJECT_GROUPS.map((g) => {
      const members = items.filter((p) => groupOf(p) === g.id);
      if (!members.length) return "";
      return `
      <section class="project-group">
        <div class="section-header">
          <h2>${esc(g.label)}</h2>
          <span class="meta">${String(members.length).padStart(2, "0")}</span>
        </div>
        <div class="venture-list">${members.map((p, i) => ventureRow(p, i, { status: true })).join("")}</div>
      </section>`;
    }).join("");
  },

  /** Homepage: the newest essay as the lead, the next two beside it. */
  homePosts(mount, doc) {
    const [lead, ...rest] = doc.collections.posts.slice(0, 3);
    if (!lead) return empty("No articles published yet.");
    const meta = (p) => `${esc(p.category)}${p.date ? ` / ${esc(p.date)}` : ""}`;
    return `
      <a class="essay-lead" href="${escUrl(lead.url)}">
        <div class="meta">${meta(lead)}</div>
        <h3>${esc(lead.title)}</h3>
        <p class="essay-lead-dek">${esc(lead.summary)}</p>
        <span class="grid-item-link">Read ${esc(lead.category || "Essay")} →</span>
      </a>
      ${rest.length ? `<div class="essay-list">${rest.map((p) => `
        <a class="essay-item" href="${escUrl(p.url)}">
          <div class="meta">${meta(p)}</div>
          <h3>${esc(p.title)}</h3>
        </a>`).join("")}
      </div>` : ""}`;
  },

  /** Full essay archive. */
  writingPosts(mount, doc) {
    return postCards(doc.collections.posts);
  },

  /**
   * Chapter cards on the books page. A chapter that has text of its own links
   * to the reader; one that doesn't is listed without a link.
   */
  bookChapters(mount, doc) {
    const book = doc.collections.books[0];
    if (!book || !book.chapters.length) return empty("No chapters added yet.");

    return book.chapters.map((c) => {
      // Only chapters with text link anywhere; the rest are the outline.
      const readable = String(c.bodyProse || "").trim();
      const href = readable ? chapterUrl(book, c) : "";
      const label = doc.settings.booksReadChapterCta;
      return `
      <article class="grid-item">
        <div class="grid-item-header">
          <span class="meta" style="color: var(--accent);">${esc(c.status)}</span>
          <h3>${esc(c.title)}</h3>
        </div>
        <p class="grid-item-desc">${esc(c.desc)}</p>
        ${href ? `<a href="${escUrl(href)}" class="grid-item-link">${esc(label)}</a>` : ""}
      </article>`;
    }).join("");
  },

  /** Course modules, with YouTube embeds or uploaded video. */
  courseLessons(mount, doc) {
    const items = doc.collections.lessons;
    if (!items.length) return empty("No lesson modules published yet.");
    return items.map((l) => `
      <article class="grid-item" style="border-top: 1px solid var(--line); padding-top: 1.5rem;">
        <div class="grid-item-header" style="border-top: none; padding-top: 0; margin-bottom: 1rem;">
          <span class="meta" style="color: var(--accent);">${esc(l.moduleNumber)} • ${esc(l.status)}</span>
          <h3 style="margin-top: 0.5rem; font-size: 1.35rem;">${esc(l.title)}</h3>
        </div>
        <p class="grid-item-desc" style="font-size: 1.05rem; line-height: 1.6;">${esc(l.summary)}</p>
        ${lessonMedia(l)}
        ${l.textContent ? `<div class="article-body" style="margin-top: 1rem; font-size: 1rem;">${renderProse(l.textContent)}</div>` : ""}
      </article>`).join("");
  },

  /** Sibling links at the foot of an essay. */
  relatedPosts(mount, doc) {
    const current = currentPost(doc);
    const others = doc.collections.posts.filter((p) => p.id !== current?.id).slice(0, 2);
    if (!others.length) return "";
    return others.map((p) => `
      <a class="grid-item" href="${escUrl(p.url)}" style="text-decoration:none;">
        <div class="grid-item-header">
          <h3>${esc(p.title)}</h3>
          <div class="meta">${esc(p.category)} / ${esc(p.date)}</div>
        </div>
      </a>`).join("");
  }
};

/**
 * One venture as an editorial index row. The row itself is the only link, so
 * there is exactly one tab stop per destination. A venture with no link
 * renders as a plain row instead of an anchor pointing nowhere.
 */
function ventureRow(p, i, { status = false } = {}) {
  const index = String(i + 1).padStart(2, "0");
  // Skip the status when the role tag already says it ("Institution / Launching Soon").
  const repeats = String(p.roleTag || "").toLowerCase().includes(String(p.status || "").toLowerCase());
  const role = status && p.status && !repeats ? `${p.status} · ${p.roleTag}` : p.roleTag;
  const body = `
    <span class="venture-index" aria-hidden="true">${index}</span>
    <div class="venture-head">
      <h3>${esc(p.title)}</h3>
      <div class="meta venture-role">${esc(role)}</div>
    </div>
    <div class="venture-body">
      <p class="venture-desc">${esc(p.description)}</p>
      ${p.link
        ? `<span class="meta venture-host">${hostLabel(p.link)}</span>`
        : `<span class="meta venture-host venture-host--pending">Not yet public</span>`}
    </div>
    ${p.link ? `<span class="venture-arrow" aria-hidden="true">↗</span>` : ""}`;

  const anim = `fade-up delay-${(i % 3) + 1}`;
  return p.link
    ? `<a class="venture-row ${anim}" href="${escUrl(p.link)}" target="_blank" rel="noopener noreferrer">${body}</a>`
    : `<div class="venture-row venture-row--pending ${anim}">${body}</div>`;
}

function postCards(posts) {
  if (!posts.length) return empty("No articles published yet.");
  return posts.map((p, i) => `
    <article class="grid-item fade-up delay-${(i % 3) + 1}">
      <a href="${escUrl(p.url)}">
        <div class="grid-item-header">
          <h3>${esc(p.title)}</h3>
          <div class="meta">${esc(p.category)}${p.date ? ` / ${esc(p.date)}` : ""}</div>
        </div>
        <p class="grid-item-desc">${esc(p.summary)}</p>
        <span class="grid-item-link">Read ${esc(p.category || "Essay")} →</span>
      </a>
    </article>`).join("");
}

function lessonMedia(lesson) {
  const url = String(lesson.videoUrl || "").trim();
  if (!url || lesson.videoType === "none") return "";

  if (lesson.videoType === "youtube") {
    const id = youtubeId(url);
    if (!id) return "";
    return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.5rem 0; border: 1px solid var(--line);">
      <iframe src="https://www.youtube.com/embed/${esc(id)}" title="${esc(lesson.title)}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen loading="lazy"></iframe>
    </div>`;
  }

  const safe = escUrl(url);
  if (!safe) return "";
  return `<div style="margin: 1.5rem 0; border: 1px solid var(--line);">
    <video controls preload="metadata" src="${safe}" style="width: 100%; max-height: 400px; display: block;"></video>
  </div>`;
}

function youtubeId(url) {
  const m =
    url.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

function applyLists(doc) {
  document.querySelectorAll("[data-cms-list]").forEach((mount) => {
    const name = mount.getAttribute("data-cms-list");
    const renderer = RENDERERS[name];
    if (!renderer) return;
    const html = renderer(mount, doc);
    if (html !== null && html !== undefined) mount.innerHTML = html;
  });
}

// ---------------------------------------------------------------------------
// Books page — the featured volume
// ---------------------------------------------------------------------------

function applyFeaturedBook(doc) {
  const book = doc.collections.books[0];
  if (!book) return;

  document.querySelectorAll("[data-cms-book]").forEach((el) => {
    const key = el.getAttribute("data-cms-book");
    if (key in book) el.textContent = book[key];
  });

  document.querySelectorAll("[data-cms-book-attr]").forEach((el) => {
    for (const spec of el.getAttribute("data-cms-book-attr").split(";")) {
      const [attr, sourceKey] = spec.split(":").map((s) => s.trim());
      if (!attr || !sourceKey || !(sourceKey in book)) continue;
      const raw = attrValue(attr, book[sourceKey]);
      if (raw) el.setAttribute(attr, raw);
    }
  });

  // A detail with no value (no format or release date yet) drops its row, and
  // the preview button goes when there is no preview to read.
  document.querySelectorAll(".book-detail-item [data-cms-book]").forEach((el) => {
    el.closest(".book-detail-item").hidden = !String(book[el.getAttribute("data-cms-book")] || "").trim();
  });
  document.querySelectorAll(".book-cta-wrapper").forEach((el) => {
    el.hidden = !String(book.previewUrl || "").trim();
  });
}

// ---------------------------------------------------------------------------
// Book chapters
// ---------------------------------------------------------------------------

/**
 * Deep links use the hash, not a query string. `.htaccess` 301-redirects
 * `/foo.html` to `/foo`, and a query string does not reliably survive that
 * hop; a fragment never leaves the browser, so it always does.
 */
export function readParams() {
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if ([...fromHash.keys()].length) return fromHash;
  return new URLSearchParams(window.location.search);
}

const chapterUrl = (book, chapter) =>
  `/books/chapter#book=${encodeURIComponent(book.id)}&chapter=${encodeURIComponent(chapter.id)}`;

/** Locate the chapter this page is for. */
function currentChapter(doc) {
  const params = readParams();
  const bookId = params.get("book");
  const chapterId = params.get("chapter");
  if (!chapterId) return null;

  const books = bookId
    ? doc.collections.books.filter((b) => b.id === bookId)
    : doc.collections.books;

  for (const book of books) {
    const index = (book.chapters || []).findIndex((c) => c.id === chapterId);
    if (index !== -1) return { book, chapter: book.chapters[index], index };
  }
  return null;
}

function applyChapterPage(doc) {
  const mount = document.querySelector("[data-cms-chapter]");
  if (!mount) return;

  const found = currentChapter(doc);
  if (!found || !String(found.chapter.bodyProse || "").trim()) {
    mount.innerHTML = `
      <h1>Chapter not available</h1>
      <p class="hero-subtitle">This chapter may not be published yet. <a href="/books/">Back to the book →</a></p>`;
    return;
  }

  const { book, chapter } = found;

  const set = (sel, value) => {
    const el = mount.querySelector(sel);
    if (el) el.textContent = value;
  };
  set("[data-cms-chapter-booktitle]", book.title);
  set("[data-cms-chapter-status]", chapter.status);
  set("[data-cms-chapter-title]", chapter.title);
  set("[data-cms-chapter-desc]", chapter.desc);

  const body = mount.querySelector("[data-cms-chapter-body]");
  if (body) body.innerHTML = renderProse(chapter.bodyProse);
  const bookTitle = String(book.title || "").replace(/\b([A-Z])([A-Z]+)\b/g, (_, a, b) => a + b.toLowerCase());
  document.title = `${chapter.title} · ${bookTitle}`;

  const backLink = mount.querySelector("[data-cms-chapter-back]");
  if (backLink) backLink.setAttribute("href", "/books/");

  // Previous / next, skipping chapters that have no text yet.
  const readable = book.chapters.filter((c) => String(c.bodyProse || "").trim());
  const position = readable.findIndex((c) => c.id === chapter.id);
  const nav = mount.querySelector("[data-cms-chapter-nav]");
  if (nav) {
    const link = (target, label) =>
      target
        ? `<a class="grid-item" href="${escUrl(chapterUrl(book, target))}" style="text-decoration:none;">
             <div class="grid-item-header">
               <div class="meta">${esc(label)}</div>
               <h3>${esc(target.title)}</h3>
             </div>
           </a>`
        : "";
    nav.innerHTML =
      link(readable[position - 1], "Previous chapter") +
      link(readable[position + 1], "Next chapter");
  }
}

// ---------------------------------------------------------------------------
// Essay pages
// ---------------------------------------------------------------------------

/** Match this page to a post by ?id=, or by its own path. */
function currentPost(doc) {
  const byId = readParams().get("id");
  if (byId) {
    const found = doc.collections.posts.find((p) => p.id === byId);
    if (found) return found;
  }

  // URLs are served extensionless (see .htaccess), so compare on the bare
  // filename with any .html suffix and trailing slash removed.
  const bare = (value) =>
    String(value || "")
      .split("?")[0]
      .replace(/\/+$/, "")
      .split("/")
      .pop()
      .replace(/\.html$/i, "");

  const file = bare(window.location.pathname);
  if (!file || file === "index") return null;

  return doc.collections.posts.find((p) => p.url && bare(p.url) === file) || null;
}

/**
 * The signup box at the foot of each essay posts straight to Buttondown, so
 * no address passes through this site. It stays hidden until a username is
 * set, and only a plain username can reach the form's action.
 */
/** The Currently line shows only when the author has written one. */
function applyCurrently(settings) {
  const has = Boolean(String(settings.currentlyNote || "").trim());
  document.querySelectorAll("[data-currently]").forEach((el) => { el.hidden = !has; });
}

function applyNewsletter(settings) {
  const user = String(settings.newsletterUsername || "").trim();
  const ok = /^[A-Za-z0-9_-]{1,64}$/.test(user);
  // [data-newsletter] is the form itself (essays) or a block around it (the
  // course waitlist), so the heading and copy hide with the form.
  document.querySelectorAll("[data-newsletter]").forEach((el) => {
    el.hidden = !ok;
    const form = el.matches("form") ? el : el.querySelector("form");
    // setAttribute, not the .action property, so the pre-rendered HTML carries it too.
    if (ok && form) form.setAttribute("action", `https://buttondown.com/api/emails/embed-subscribe/${encodeURIComponent(user)}`);
  });
}

/** "N min read" from the words actually on the page, at 230 words a minute. */
function applyReadingTime(scope, body) {
  const slots = scope.querySelectorAll("[data-cms-reading-time]");
  if (!slots.length) return;
  const words = body.textContent.split(/\s+/).filter(Boolean).length;
  const label = `${Math.max(1, Math.ceil(words / 230))} min read`;
  slots.forEach((el) => { el.textContent = label; });
}

function applyPostPage(doc) {
  const mount = document.querySelector("[data-cms-post]");
  if (!mount) return;

  const post = currentPost(doc);
  if (!post) {
    // A generated /writing/post.html reached with an unknown id.
    if (mount.hasAttribute("data-cms-post-dynamic")) {
      mount.innerHTML = `<h1>Essay not found</h1><p class="hero-subtitle">This piece may have been unpublished. <a href="/writing/">Browse all writing →</a></p>`;
    }
    return;
  }

  const set = (sel, value) => {
    const el = mount.querySelector(sel);
    if (el) el.textContent = value;
  };
  set("[data-cms-post-title]", post.title);
  set("[data-cms-post-meta]", `${post.category}${post.date ? ` / ${post.date}` : ""}`);
  set("[data-cms-post-summary]", post.summary);

  const body = mount.querySelector("[data-cms-post-body]");
  // Hand-built essays keep their existing HTML unless the console has a body for them.
  if (body && String(post.bodyProse || "").trim()) {
    body.innerHTML = renderProse(post.bodyProse);
  }
  if (body) applyReadingTime(mount, body);

  // An essay's tab, search result and shared link carry its own title and
  // summary. Hand-built pages without these tags are left as they are.
  const site = doc.settings.siteTitle || "";
  document.title = site ? `${post.title} · ${site}` : post.title;
  const setAttr = (sel, attr, value) => document.querySelectorAll(sel).forEach((el) => el.setAttribute(attr, value));
  const url = new URL(String(post.url || "").replace(/\.html$/, ""), "https://tobilawson.com").href;
  setAttr('meta[name="description"], [data-post-og-description]', "content", post.summary || "");
  setAttr("[data-post-og-title]", "content", post.title);
  setAttr("[data-post-og-url]", "content", url);
  setAttr("[data-post-canonical]", "href", url);
  // The share image the server's render job draws for this essay.
  const slug = (String(post.url || "").match(/^\/writing\/([a-z0-9-]+)\.html$/) || [])[1] || post.id;
  setAttr("[data-post-og-image]", "content", `https://tobilawson.com/og/${slug}.png`);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function hydrate() {
  let doc;
  try {
    doc = await loadContent();
  } catch (err) {
    console.warn("Content load failed; leaving the page as authored.", err);
    return;
  }
  if (!doc) return;
  applyAll(doc);
}

/**
 * Write the content document into the current page. The browser runs this on
 * every load; scripts/render.mjs runs it on the server so the HTML already
 * holds the published content. Pages that choose their content from the URL
 * fragment (console essays, book chapters) are left for the browser, since the
 * server never sees the fragment.
 */
export function applyAll(doc, { prerender = false } = {}) {
  applyFields(doc.settings);
  applyScribbleHeadline(doc.settings);
  applyFeaturedBook(doc);
  applyLists(doc);
  if (!prerender || !document.querySelector("[data-cms-post-dynamic]")) applyPostPage(doc);
  if (!prerender) applyChapterPage(doc);
  applyNewsletter(doc.settings);
  applyCurrently(doc.settings);
}

/** On narrow screens a margin note opens under its line when its number is pressed. */
function initSidenotes() {
  document.addEventListener("click", (e) => {
    const mark = e.target.closest(".sidenote-mark");
    if (!mark) return;
    const note = document.getElementById(mark.getAttribute("aria-controls"));
    if (!note) return;
    const open = !note.classList.contains("is-open");
    note.classList.toggle("is-open", open);
    mark.setAttribute("aria-expanded", String(open));
  });
}

function initSmoothScroll() {
  // Deep-link fragments (#book=…&chapter=…) are data, not scroll targets.
  document.querySelectorAll('a[href^="#"]:not([href*="="])').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function init() {
  initSmoothScroll();
  initSidenotes();
  hydrate();
  onContentUpdated(hydrate);
  subscribeToCloud(hydrate);
  // Moving between chapters only changes the fragment, so re-render on that.
  window.addEventListener("hashchange", hydrate);
}

// The pre-renderer imports this module for applyAll and must not boot it.
if (!globalThis.__TL_PRERENDER__) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}
