/**
 * Tobi Lawson — Supabase cloud adapter.
 *
 * The whole site is one JSONB document in one row: site_content(id='global').
 * Adding a new editable field therefore never requires a database migration —
 * that was the single biggest source of half-wired fields in the old design,
 * where every field needed its own snake_case column in seven separate tables.
 *
 * The legacy readers at the bottom exist only to migrate the old seven-table
 * layout across on first load. They can be deleted once you've saved once.
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.1/+esm";

export const SUPABASE_URL = "https://xifwswzqfqwfhihglubs.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Q71S8qzFcM80ikZ6bhPQgg_6HxUgzmI";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const DOC_TABLE = "site_content";
const DOC_ID = "global";

/**
 * Read the content document from the cloud.
 * Returns null when Supabase is unreachable or the table doesn't exist yet,
 * so callers can fall back to local content rather than blanking the page.
 */
export async function fetchCloudDoc() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(DOC_TABLE)
      .select("doc, updated_at")
      .eq("id", DOC_ID)
      .maybeSingle();

    if (error || !data || !data.doc) return null;

    const doc = data.doc;
    // The row's own updated_at is authoritative over anything inside the blob.
    if (data.updated_at) doc.updatedAt = data.updated_at;
    return doc;
  } catch (err) {
    console.warn("Supabase read failed, using local content:", err);
    return null;
  }
}

/** Write the content document to the cloud. */
export async function saveCloudDoc(doc) {
  if (!supabase) return { success: false, error: "Cloud sync is not configured." };
  try {
    const { data, error } = await supabase
      .from(DOC_TABLE)
      .upsert({ id: DOC_ID, doc, updated_at: doc.updatedAt || new Date().toISOString() })
      .select();

    if (error) {
      console.error("Supabase write failed:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Supabase write threw:", err);
    return { success: false, error: err };
  }
}

/** Fire `callback` whenever the document changes in the cloud. */
export function subscribeToCloud(callback) {
  if (!supabase) return null;
  return supabase
    .channel("tobi_site_content")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: DOC_TABLE },
      () => { if (callback) callback(); }
    )
    .subscribe();
}

// ---------------------------------------------------------------------------
// Legacy migration — reads the old seven-table layout exactly once.
// ---------------------------------------------------------------------------

/**
 * Compose a v3 document from the old per-table rows, so nothing you had in
 * Supabase before this rebuild is lost. Returns null if there's nothing there.
 */
export async function fetchLegacyDoc() {
  if (!supabase) return null;

  const table = async (name, query) => {
    try {
      const { data, error } = await query;
      if (error) return null;
      return data;
    } catch (err) {
      console.warn(`Legacy read of ${name} skipped:`, err);
      return null;
    }
  };

  try {
    const [settings, nowPage, courseSettings, posts, projects, books, lessons] = await Promise.all([
      table("site_settings", supabase.from("site_settings").select("*").eq("id", "global").maybeSingle()),
      table("now_page", supabase.from("now_page").select("*").eq("id", "global").maybeSingle()),
      table("course_settings", supabase.from("course_settings").select("*").eq("id", "global").maybeSingle()),
      table("posts", supabase.from("posts").select("*")),
      table("projects", supabase.from("projects").select("*")),
      table("books", supabase.from("books").select("*")),
      table("course_lessons", supabase.from("course_lessons").select("*"))
    ]);

    const nothing =
      !settings && !nowPage && !courseSettings &&
      !(posts && posts.length) && !(projects && projects.length) &&
      !(books && books.length) && !(lessons && lessons.length);

    if (nothing) return null;

    const s = settings || {};
    const n = nowPage || {};
    const c = courseSettings || {};

    // The old schema had no way to store line breaks in the headline, so the
    // hero was flattened to one line. Restore the three-line setting it was
    // designed around; any headline that has since been edited is left alone.
    const heroTitle = s.hero_title === "Building and investing with purpose."
      ? "Building\nand investing\nwith purpose."
      : s.hero_title;

    // Several old column defaults were written as plain SQL strings containing
    // a literal backslash-n rather than a real newline, so "\n\n" was rendering
    // visibly in the prose. Turn those back into paragraph breaks.
    const unescapeNewlines = (v) =>
      typeof v === "string" ? v.replace(/\\r\\n|\\n/g, "\n") : v;

    // Old keys on the left of each ?? pair; anything absent falls through to
    // the schema default later in the merge.
    const mapped = {
      siteTitle: s.site_title,
      contactEmail: s.contact_email,
      homeHeroTitle: heroTitle,
      homeHeroScribbleWord: s.hero_scribble_word,
      homeHeroSubtitle: s.hero_subtitle,
      aboutHeroTitle: s.about_hero_title,
      aboutHeroSubtitle: s.about_hero_subtitle,
      aboutBodyProse: unescapeNewlines(s.about_body_prose),
      aboutProfileImage: s.about_profile_image,
      footerTagline: s.footer_tagline,
      footerCopyright: s.footer_copyright,
      footerLink1Name: s.footer_link1_name,
      footerLink1Url: s.footer_link1_url,
      footerLink2Name: s.footer_link2_name,
      footerLink2Url: s.footer_link2_url,
      nowHeroTitle: n.hero_title,
      nowHeroSubtitle: n.intro_subtitle,
      nowOngoingProse: unescapeNewlines(n.ongoing_prose),
      courseStatusTag: c.status_tag,
      courseTitle: c.title,
      courseSubtitle: c.subtitle,
      courseOverviewProse: unescapeNewlines(c.overview_prose),
      courseCtaText: c.cta_text
    };

    const legacySettings = {};
    for (const [k, v] of Object.entries(mapped)) {
      if (v !== null && v !== undefined) legacySettings[k] = v;
    }

    return {
      version: 3,
      migratedFrom: "supabase-v2-tables",
      settings: legacySettings,
      collections: {
        projects: (projects || []).map((p) => ({
          id: p.id, title: p.title, roleTag: p.role_tag,
          description: p.description, link: p.link, status: p.status || "Active"
        })),
        posts: (posts || []).map((p) => ({
          id: p.id, title: p.title, category: p.category, date: p.date,
          summary: p.summary, url: p.url, bodyProse: p.content_html || ""
        })),
        books: (books || []).map((b) => ({
          id: b.id, title: b.title, subtitle: b.subtitle, statusTag: b.status_tag,
          coverImageUrl: b.cover_image_url, synopsisP1: b.synopsis_p1, synopsisP2: b.synopsis_p2,
          author: b.author, format: b.format, releaseDate: b.release_date,
          previewUrl: b.preview_url, chapters: b.chapters || []
        })),
        lessons: (lessons || []).map((l) => ({
          id: l.id, moduleNumber: l.module_number, title: l.title, status: l.status,
          summary: l.summary, textContent: unescapeNewlines(l.text_content) || "",
          videoType: l.video_type || "none", videoUrl: l.video_url || ""
        }))
      },
      updatedAt: s.updated_at || new Date(0).toISOString()
    };
  } catch (err) {
    console.warn("Legacy migration read skipped:", err);
    return null;
  }
}
