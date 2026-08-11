import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.1/+esm";

export const SUPABASE_URL = "https://xifwswzqfqwfhihglubs.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Q71S8qzFcM80ikZ6bhPQgg_6HxUgzmI";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// SITE SETTINGS SYNC
export async function syncSiteSettingsFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", "global").maybeSingle();
    if (error || !data) return null;
    return {
      siteTitle: data.site_title || "Tobi Lawson",
      heroTitle: data.hero_title || "Building and investing with purpose.",
      heroSubtitle: data.hero_subtitle || "",
      heroScribbleWord: data.hero_scribble_word || "purpose.",
      aboutHeroTitle: data.about_hero_title || "About Tobi Lawson",
      aboutHeroSubtitle: data.about_hero_subtitle || "",
      aboutBodyProse: data.about_body_prose || "",
      aboutProfileImage: data.about_profile_image || "./assets/tobi-lawson.jpg",
      contactEmail: data.contact_email || "olamilawson@gmail.com",
      adminPasscode: (data.admin_passcode && data.admin_passcode !== "tobi2026") ? data.admin_passcode : "Enlive0801@#",
      updatedAt: data.updated_at || null
    };
  } catch (err) {
    console.warn("Supabase site_settings fetch error:", err);
    return null;
  }
}

export async function saveSiteSettingsToSupabase(settings) {
  if (!supabase) return { success: false, error: "Supabase client not initialized" };
  try {
    const payload = {
      id: "global",
      site_title: settings.siteTitle,
      hero_title: settings.heroTitle,
      hero_subtitle: settings.heroSubtitle,
      hero_scribble_word: settings.heroScribbleWord || "purpose.",
      about_hero_title: settings.aboutHeroTitle,
      about_hero_subtitle: settings.aboutHeroSubtitle,
      about_body_prose: settings.aboutBodyProse,
      about_profile_image: settings.aboutProfileImage || "./assets/tobi-lawson.jpg",
      contact_email: settings.contactEmail,
      admin_passcode: settings.adminPasscode,
      updated_at: settings.updatedAt || new Date().toISOString()
    };
    const { data, error } = await supabase.from("site_settings").upsert(payload);
    if (error) {
      if (error.message && error.message.includes("about_profile_image")) {
        delete payload.about_profile_image;
        const retry = await supabase.from("site_settings").upsert(payload);
        if (!retry.error) return { success: true, data: retry.data };
      }
      console.error("Error saving site settings to Supabase:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Supabase site_settings upsert error:", err);
    return { success: false, error: err };
  }
}

// POSTS / WRITING SYNC
export async function syncPostsFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return null;
    return data.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      date: p.date,
      summary: p.summary,
      url: p.url,
      contentHtml: p.content_html || ""
    }));
  } catch (err) {
    console.warn("Supabase posts fetch error:", err);
    return null;
  }
}

export async function savePostToSupabase(post) {
  if (!supabase) return { success: false, error: "Supabase client not initialized" };
  try {
    const payload = {
      id: post.id,
      title: post.title,
      category: post.category,
      date: post.date,
      summary: post.summary,
      url: post.url,
      content_html: post.contentHtml || ""
    };
    const { data, error } = await supabase.from("posts").upsert(payload);
    if (error) {
      console.error("Error saving post to Supabase:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Supabase post upsert error:", err);
    return { success: false, error: err };
  }
}

export async function deletePostFromSupabase(postId) {
  if (!supabase) return { success: false, error: "Supabase client not initialized" };
  try {
    const { data, error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      console.error("Error deleting post from Supabase:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Supabase post delete error:", err);
    return { success: false, error: err };
  }
}

// PROJECTS SYNC
export async function syncProjectsFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: true });
    if (error || !data || data.length === 0) return null;
    return data.map((pr) => ({
      id: pr.id,
      title: pr.title,
      roleTag: pr.role_tag,
      description: pr.description,
      link: pr.link,
      status: pr.status || "Active"
    }));
  } catch (err) {
    console.warn("Supabase projects fetch error:", err);
    return null;
  }
}

export async function saveProjectToSupabase(project) {
  if (!supabase) return { success: false, error: "Supabase client not initialized" };
  try {
    const payload = {
      id: project.id,
      title: project.title,
      role_tag: project.roleTag,
      description: project.description,
      link: project.link,
      status: project.status || "Active"
    };
    const { data, error } = await supabase.from("projects").upsert(payload);
    if (error) {
      console.error("Error saving project to Supabase:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Supabase project upsert error:", err);
    return { success: false, error: err };
  }
}

export async function deleteProjectFromSupabase(projectId) {
  if (!supabase) return { success: false, error: "Supabase client not initialized" };
  try {
    const { data, error } = await supabase.from("projects").delete().eq("id", projectId);
    if (error) {
      console.error("Error deleting project from Supabase:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Supabase project delete error:", err);
    return { success: false, error: err };
  }
}

// NOW PAGE SYNC
export async function syncNowPageFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("now_page").select("*").eq("id", "global").maybeSingle();
    if (error || !data) return null;
    return {
      lastUpdated: data.last_updated || "July 2026",
      heroTitle: data.hero_title || "What I'm spending time on",
      introSubtitle: data.intro_subtitle || "",
      ongoingProse: data.ongoing_prose || "",
      updatedAt: data.updated_at || null
    };
  } catch (err) {
    console.warn("Supabase now_page fetch error:", err);
    return null;
  }
}

export async function saveNowPageToSupabase(nowData) {
  if (!supabase) return { success: false, error: "Supabase client not initialized" };
  try {
    const payload = {
      id: "global",
      last_updated: nowData.lastUpdated,
      hero_title: nowData.heroTitle || "What I'm spending time on",
      intro_subtitle: nowData.introSubtitle,
      ongoing_prose: nowData.ongoingProse,
      updated_at: nowData.updatedAt || new Date().toISOString()
    };
    const { data, error } = await supabase.from("now_page").upsert(payload);
    if (error) {
      console.error("Error saving now_page to Supabase:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Supabase now_page upsert error:", err);
    return { success: false, error: err };
  }
}

// BOOKS SYNC
export async function syncBooksFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: true });
    if (error || !data || data.length === 0) return null;
    return data.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      statusTag: b.status_tag,
      coverImageUrl: b.cover_image_url,
      synopsisP1: b.synopsis_p1,
      synopsisP2: b.synopsis_p2,
      author: b.author,
      format: b.format,
      releaseDate: b.release_date,
      previewUrl: b.preview_url,
      chapters: b.chapters || []
    }));
  } catch (err) {
    console.warn("Supabase books fetch error:", err);
    return null;
  }
}

export async function saveBookToSupabase(book) {
  if (!supabase) return { success: false, error: "Supabase client not initialized" };
  try {
    const payload = {
      id: book.id,
      title: book.title,
      subtitle: book.subtitle || "",
      status_tag: book.statusTag || "FORTHCOMING VOLUME • IN WRITING",
      cover_image_url: book.coverImageUrl || "assets/who-made-this-cover.jpg",
      synopsis_p1: book.synopsisP1 || "",
      synopsis_p2: book.synopsisP2 || "",
      author: book.author || "Tobi Lawson",
      format: book.format || "Hardcover & Digital",
      release_date: book.releaseDate || "Late 2026",
      preview_url: book.previewUrl || "books/who-made-this-preview.html",
      chapters: book.chapters || []
    };
    const { data, error } = await supabase.from("books").upsert(payload);
    if (error) {
      console.error("Error saving book to Supabase:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Supabase book upsert error:", err);
    return { success: false, error: err };
  }
}

export async function deleteBookFromSupabase(bookId) {
  if (!supabase) return { success: false, error: "Supabase client not initialized" };
  try {
    const { data, error } = await supabase.from("books").delete().eq("id", bookId);
    if (error) {
      console.error("Error deleting book from Supabase:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Supabase book delete error:", err);
    return { success: false, error: err };
  }
}

// REALTIME SUBSCRIPTION
export function subscribeToSupabaseRealtime(callback) {
  if (!supabase) return null;
  const channel = supabase
    .channel("tobi_site_changes")
    .on("postgres_changes", { event: "*", schema: "public" }, () => {
      if (callback) callback();
    })
    .subscribe();
  return channel;
}

// INITIAL SEEDING HELPER
export async function seedInitialDataToSupabase(data) {
  if (!supabase) return { success: false, error: "Supabase client not initialized" };
  try {
    let res = { success: true };
    if (data.settings) res = await saveSiteSettingsToSupabase(data.settings);
    if (data.nowPage) await saveNowPageToSupabase(data.nowPage);
    if (data.posts) {
      for (const p of data.posts) await savePostToSupabase(p);
    }
    if (data.projects) {
      for (const pr of data.projects) await saveProjectToSupabase(pr);
    }
    if (data.books) {
      for (const b of data.books) await saveBookToSupabase(b);
    }
    return res;
  } catch (err) {
    console.warn("Auto-seed to Supabase skipped or failed:", err);
    return { success: false, error: err };
  }
}
