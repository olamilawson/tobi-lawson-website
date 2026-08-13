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

import { loadContent, onContentUpdated, esc, escUrl, renderProse, renderLines } from "/content-store.js";
import { subscribeToCloud } from "/supabase.js";
import { FIELD_BY_KEY } from "/content-schema.js";

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
function applyFields(settings) {
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

      const safe = attr === "href" || attr === "src" ? escUrl(value) : esc(value);
      if (safe) el.setAttribute(attr, safe);
    }
  });
}

/** The homepage headline circles one word with a hand-drawn SVG scribble. */
function applyScribbleHeadline(settings) {
  const el = document.querySelector("[data-cms-scribble]");
  if (!el) return;

  const title = String(settings.homeHeroTitle ?? "");
  const word = String(settings.homeHeroScribbleWord ?? "").trim();
  const scribble = `<svg class="scribble" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true"><path d="M 15,40 C 20,15 50,5 100,5 C 160,5 190,20 185,50 C 180,75 140,78 90,75 C 40,72 5,55 10,35 C 15,20 40,12 80,15"></path></svg>`;

  if (!word || !title.includes(word)) {
    el.innerHTML = renderLines(title);
    return;
  }

  const idx = title.indexOf(word);
  const before = renderLines(title.slice(0, idx));
  const after = renderLines(title.slice(idx + word.length));
  el.innerHTML = `${before}<span class="highlight-wrapper">${esc(word)} ${scribble}</span>${after}`;
}

// ---------------------------------------------------------------------------
// Repeating regions
// ---------------------------------------------------------------------------

const empty = (message) =>
  `<div class="meta" style="color: var(--text-muted); padding: 2rem 0;">${esc(message)}</div>`;

const hostLabel = (link) => esc(String(link || "").replace(/^https?:\/\//, "").replace(/\/$/, ""));

const RENDERERS = {
  /** Homepage project cards, with cover plates. */
  homeProjects(mount, doc) {
    const items = doc.collections.projects;
    if (!items.length) return empty("No active projects configured.");
    return items.map((p, i) => `
      <article class="grid-item fade-up delay-${(i % 3) + 1}">
        <a href="${escUrl(p.link)}" target="_blank" rel="noopener noreferrer">
          <div class="grid-item-header">
            <h3>${esc(p.title)}</h3>
            <div class="meta">${esc(p.roleTag)}</div>
          </div>
          <div class="grid-item-cover">
            <span class="meta" style="font-size:1.1rem; text-align:center;">${esc(String(p.title).toUpperCase())}</span>
          </div>
        </a>
        <p class="grid-item-desc">${esc(p.description)}</p>
        ${p.link ? `<a class="grid-item-link" href="${escUrl(p.link)}" target="_blank" rel="noopener noreferrer">Visit ${hostLabel(p.link)} ↗</a>` : ""}
      </article>`).join("");
  },

  /** Now-page project cards, which lead with status instead of a cover plate. */
  nowProjects(mount, doc) {
    const items = doc.collections.projects;
    if (!items.length) return empty("No active projects configured.");
    return items.map((p) => `
      <article class="grid-item">
        <div class="grid-item-header">
          <h3>${esc(p.title)}</h3>
          <div class="meta">${esc(p.status || "Active")} · ${esc(p.roleTag)}</div>
        </div>
        <p class="grid-item-desc">${esc(p.description)}</p>
        ${p.link ? `<a class="grid-item-link" href="${escUrl(p.link)}" target="_blank" rel="noopener noreferrer">Visit ${hostLabel(p.link)} ↗</a>` : ""}
      </article>`).join("");
  },

  /** Three most recent essays on the homepage. */
  homePosts(mount, doc) {
    return postCards(doc.collections.posts.slice(0, 3));
  },

  /** Full essay archive. */
  writingPosts(mount, doc) {
    return postCards(doc.collections.posts);
  },

  /**
   * Chapter cards on the books page. A chapter that has text of its own links
   * to the reader; one that doesn't falls back to the book's preview page.
   */
  bookChapters(mount, doc) {
    const book = doc.collections.books[0];
    if (!book || !book.chapters.length) return empty("No chapters added yet.");

    return book.chapters.map((c) => {
      const readable = String(c.bodyProse || "").trim();
      const href = readable ? chapterUrl(book, c) : book.previewUrl;
      const label = readable ? doc.settings.booksReadChapterCta : doc.settings.booksChapterCta;
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
      const safe = attr === "href" || attr === "src" ? escUrl(book[sourceKey]) : esc(book[sourceKey]);
      if (safe) el.setAttribute(attr, safe);
    }
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

  // Tab titles are deliberately just the site name across the whole site.
  // To show essay names instead, use: `${post.title} — ${doc.settings.siteTitle}`.
  if (doc.settings.siteTitle) document.title = doc.settings.siteTitle;
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

  applyFields(doc.settings);
  applyScribbleHeadline(doc.settings);
  applyFeaturedBook(doc);
  applyLists(doc);
  applyPostPage(doc);
  applyChapterPage(doc);
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
  hydrate();
  onContentUpdated(hydrate);
  subscribeToCloud(hydrate);
  // Moving between chapters only changes the fragment, so re-render on that.
  window.addEventListener("hashchange", hydrate);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
