/**
 * Tobi Lawson — Content store.
 *
 * Shared by the public site (app.js) and the admin console (admin.js).
 * Owns: local cache, cloud merge, defaults, escaping, and passcode hashing.
 */

import { GROUPS, COLLECTIONS, SEED_COLLECTIONS, SCHEMA_VERSION, BOOTSTRAP_PASSCODE_HASH, defaultSettings } from "/content-schema.js";
import { fetchCloudDoc, saveCloudDoc, fetchLegacyDoc, isSupabaseConfigured } from "/supabase.js";

const STORAGE_KEY = "tobi_site_content_v3";
const LEGACY_KEYS = ["tobi_site_data_v2", "tobi_site_data_v1", "tobi_site_data"];
const UPDATE_EVENT = "tobi_content_updated";

// ---------------------------------------------------------------------------
// Escaping and text rendering
// ---------------------------------------------------------------------------

/** Escape text for interpolation into HTML. Everything author-supplied goes through this. */
export function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape a URL, and refuse anything that isn't a safe scheme. */
export function escUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^(https?:|mailto:|\/|#|\.\/|\.\.\/)/i.test(raw)) return esc(raw);
  return ""; // blocks javascript: and data: in href position
}

/**
 * Escape a run of prose text, turning `[label](url)` into a link on the way.
 * The URL goes through escUrl, so javascript: and data: are dropped; an
 * unsafe or empty URL leaves the label as plain text rather than a dead link.
 * External links get target/rel; internal ones (/, #, ./) stay in the tab.
 */
export function renderInline(value) {
  const text = String(value ?? "");
  let out = "";
  let last = 0;
  const pattern = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
  let m;
  while ((m = pattern.exec(text)) !== null) {
    out += esc(text.slice(last, m.index));
    const href = escUrl(m[2]);
    const label = esc(m[1]);
    if (!href) {
      out += esc(m[0]); // unsafe scheme: leave the source visible rather than a mangled link
    } else if (/^https?:/i.test(m[2])) {
      out += `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    } else {
      out += `<a href="${href}">${label}</a>`;
    }
    last = m.index + m[0].length;
  }
  out += esc(text.slice(last));
  return out;
}

/**
 * Render a `prose` field to HTML.
 *   blank line       -> new paragraph
 *   ## text          -> subheading
 *   > text           -> pull quote
 *   [label](url)     -> link, inside paragraphs and pull quotes
 */
export function renderProse(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text
    .split(/\n\s*\n/)
    .map((block) => {
      const b = block.trim();
      if (!b) return "";
      if (b.startsWith("##")) return `<h2>${esc(b.replace(/^##\s*/, ""))}</h2>`;
      if (b.startsWith(">")) {
        const quote = b.split("\n").map((l) => l.replace(/^>\s?/, "")).join(" ");
        return `<blockquote>${renderInline(quote)}</blockquote>`;
      }
      return `<p>${renderInline(b).replace(/\n/g, "<br>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

/** Render a `textarea` field as inline text with line breaks preserved. */
export function renderLines(value) {
  return esc(value).replace(/\n/g, "<br>");
}

/** Turn a title into a URL-safe id. */
export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `item-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Document shape
// ---------------------------------------------------------------------------

export function emptyDoc() {
  return {
    version: SCHEMA_VERSION,
    settings: defaultSettings(),
    collections: { projects: [], posts: [], books: [], lessons: [] },
    security: { passcodeHash: BOOTSTRAP_PASSCODE_HASH },
    updatedAt: new Date(0).toISOString()
  };
}

export function seedDoc() {
  const doc = emptyDoc();
  doc.collections = JSON.parse(JSON.stringify(SEED_COLLECTIONS));
  return doc;
}

/**
 * Fill in anything the document is missing, without overwriting values the
 * author has deliberately set — including deliberately empty strings.
 */
export function normalize(doc) {
  const base = emptyDoc();
  const out = {
    version: SCHEMA_VERSION,
    settings: { ...base.settings },
    collections: { ...base.collections },
    security: { ...base.security },
    updatedAt: doc?.updatedAt || base.updatedAt
  };

  if (doc?.settings) {
    for (const [key, val] of Object.entries(doc.settings)) {
      // An empty string is a real, savable value. Only undefined/null defer to the default.
      if (val !== null && val !== undefined) out.settings[key] = val;
    }
  }

  if (doc?.security?.passcodeHash) out.security.passcodeHash = doc.security.passcodeHash;

  for (const col of COLLECTIONS) {
    const items = doc?.collections?.[col.id];
    // An empty array is a real state ("I deleted them all") and is preserved.
    out.collections[col.id] = Array.isArray(items) ? items.map((item) => normalizeItem(col, item)) : [];
  }

  return out;
}

function normalizeItem(col, item) {
  const out = { ...item };
  if (!out.id) out.id = slugify(out[col.titleField] || col.singular);
  for (const f of col.fields) {
    if (out[f.key] === null || out[f.key] === undefined) out[f.key] = f.default ?? "";
  }

  // Fields marked `path: true` are site paths. Legacy values were stored
  // relative ("writing/foo.html"), which resolves to /writing/writing/foo.html
  // when linked from the archive page, and is rejected outright by escUrl.
  for (const f of col.fields) {
    if (!f.path) continue;
    const value = String(out[f.key] || "").trim();
    if (value && !/^(https?:|\/|#)/i.test(value)) {
      out[f.key] = `/${value.replace(/^\.?\//, "")}`;
    }
  }
  if (col.subCollection) {
    const sub = col.subCollection;
    const items = Array.isArray(out[sub.id]) ? out[sub.id] : [];
    out[sub.id] = items.map((item, i) => {
      const child = { ...item };
      // Sub-items need stable ids too, so chapters can have their own URLs.
      if (!child.id) child.id = slugify(child[sub.titleField] || `${sub.singular}-${i + 1}`);
      for (const f of sub.fields) {
        if (child[f.key] === null || child[f.key] === undefined) child[f.key] = f.default ?? "";
      }
      return child;
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Local cache
// ---------------------------------------------------------------------------

export function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw));
    const migrated = migrateLocalLegacy();
    if (migrated) return migrated;
    return null;
  } catch (err) {
    console.warn("Local content unreadable:", err);
    return null;
  }
}

export function saveLocal(doc) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    window.dispatchEvent(new Event(UPDATE_EVENT));
  } catch (err) {
    console.error("Could not write local content:", err);
  }
}

/** Pull anything saved under the old v0/v1/v2 localStorage keys into v3 shape. */
function migrateLocalLegacy() {
  for (const key of LEGACY_KEYS) {
    let parsed;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    if (!parsed || !parsed.settings) continue;

    const s = parsed.settings;
    const n = parsed.nowPage || {};
    const c = parsed.courseSettings || {};

    const mapped = {
      siteTitle: s.siteTitle,
      contactEmail: s.contactEmail,
      homeHeroTitle: s.heroTitle === "Building and investing with purpose."
        ? "Building\nand investing\nwith purpose."
        : s.heroTitle,
      homeHeroScribbleWord: s.heroScribbleWord,
      homeHeroSubtitle: s.heroSubtitle,
      aboutHeroTitle: s.aboutHeroTitle,
      aboutHeroSubtitle: s.aboutHeroSubtitle,
      aboutBodyProse: s.aboutBodyProse,
      aboutProfileImage: s.aboutProfileImage,
      footerTagline: s.footerTagline,
      footerCopyright: s.footerCopyright,
      footerLink1Name: s.footerLink1Name,
      footerLink1Url: s.footerLink1Url,
      footerLink2Name: s.footerLink2Name,
      footerLink2Url: s.footerLink2Url,
      nowHeroTitle: n.heroTitle,
      nowHeroSubtitle: n.introSubtitle,
      nowOngoingProse: n.ongoingProse,
      courseStatusTag: c.statusTag,
      courseTitle: c.title,
      courseSubtitle: c.subtitle,
      courseOverviewProse: c.overviewProse,
      courseCtaText: c.ctaText
    };

    const settings = {};
    for (const [k, v] of Object.entries(mapped)) {
      if (v !== null && v !== undefined) settings[k] = v;
    }

    const doc = normalize({
      settings,
      collections: {
        projects: parsed.projects || [],
        posts: (parsed.posts || []).map((p) => ({ ...p, bodyProse: p.bodyProse || p.contentHtml || "" })),
        books: parsed.books || [],
        lessons: parsed.courseLessons || []
      },
      updatedAt: s.updatedAt || new Date(0).toISOString()
    });
    doc.migratedFrom = key;
    return doc;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Load & publish
// ---------------------------------------------------------------------------

const ts = (doc) => {
  const t = Date.parse(doc?.updatedAt || "");
  return Number.isNaN(t) ? 0 : t;
};

/**
 * Resolve the content to render.
 *
 * Whole-document last-write-wins on `updatedAt`. The old code applied the local
 * copy on top of the cloud copy unconditionally, which meant a device that had
 * ever saved could never again see an edit made anywhere else.
 */
export async function loadContent() {
  const local = loadLocal();

  if (!isSupabaseConfigured) return local || seedDoc();

  let cloud = await fetchCloudDoc();

  // Nothing in the cloud yet — try the old seven-table layout before giving up.
  if (!cloud) {
    const legacy = await fetchLegacyDoc();
    if (legacy) cloud = normalize(legacy);
  }

  if (!cloud) return local || seedDoc();
  if (!local) return normalize(cloud);

  return ts(local) > ts(cloud) ? local : normalize(cloud);
}

/** Save edits locally and push them to the cloud. */
export async function publish(doc) {
  doc.version = SCHEMA_VERSION;
  doc.updatedAt = new Date().toISOString();
  saveLocal(doc);

  if (!isSupabaseConfigured) {
    return { success: false, offline: true, error: "Cloud sync is not configured — saved on this device only." };
  }
  return saveCloudDoc(doc);
}

export function onContentUpdated(handler) {
  window.addEventListener(UPDATE_EVENT, handler);
}

// ---------------------------------------------------------------------------
// Passcode
// ---------------------------------------------------------------------------

/** sha256("tobi-cms:" + passcode), hex. The plaintext is never stored anywhere. */
export async function hashPasscode(passcode) {
  const bytes = new TextEncoder().encode(`tobi-cms:${passcode}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPasscode(entered, doc) {
  const expected = doc?.security?.passcodeHash || BOOTSTRAP_PASSCODE_HASH;
  const actual = await hashPasscode(entered);
  // Length-constant compare; both are fixed-length hex digests.
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export { GROUPS, COLLECTIONS, isSupabaseConfigured };
