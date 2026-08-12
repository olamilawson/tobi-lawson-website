/**
 * Tobi Lawson — Personal Website & Editorial Admin Console
 * Full Site Management & Supabase Sync Engine
 */

import {
  isSupabaseConfigured,
  syncSiteSettingsFromSupabase,
  saveSiteSettingsToSupabase,
  syncPostsFromSupabase,
  savePostToSupabase,
  deletePostFromSupabase,
  syncProjectsFromSupabase,
  saveProjectToSupabase,
  deleteProjectFromSupabase,
  syncNowPageFromSupabase,
  saveNowPageToSupabase,
  syncBooksFromSupabase,
  saveBookToSupabase,
  deleteBookFromSupabase,
  syncCourseSettingsFromSupabase,
  saveCourseSettingsToSupabase,
  syncCourseLessonsFromSupabase,
  saveCourseLessonToSupabase,
  deleteCourseLessonFromSupabase,
  seedInitialDataToSupabase,
  subscribeToSupabaseRealtime
} from "/supabase.js";

const STORAGE_KEY = "tobi_site_data_v1";
const AUTH_KEY = "tobi_admin_authenticated";

// Factory Defaults (Hardcoded Credentials)
export const INITIAL_DATA = {
  settings: {
    siteTitle: "Tobi Lawson",
    heroTitle: "Building and investing with purpose.",
    heroScribbleWord: "purpose.",
    heroSubtitle: "Notes on capital, cities, and the slow work of building things that last. Based in Lagos, working across fintech, SME services, and education technology.",
    aboutHeroTitle: "About Tobi Lawson",
    aboutHeroSubtitle: "Investor and builder based in Lagos. Background in investment analysis and development research, now running companies across fintech, SME services, and education technology.",
    aboutBodyProse: "I'm an investor and builder based in Lagos. My background is in investment analysis and development research, work that shaped how I think about capital, institutions, and the slow processes that move a country's fortunes.\n\nToday I run and invest in companies across fintech, SME services technology, product development, and education technology. Alongside that, I co-founded 1914 Reader with Feyi Fawehinmi, where we read Nigeria and Africa's biggest stories through the lens of global economic and political change.\n\nI also work on Lagos Urban Project, a platform reimagining Lagos as a more inclusive and livable city, and Long Africa, a new institution focused on the long-run foundations of African prosperity.\n\nMy interests run wide: markets, cities, governance, technology, and the books that help make sense of them. This site is where I write about all of it, and keep a running account of what I'm building.",
    aboutProfileImage: "/assets/tobi-lawson.jpg",
    contactEmail: "olamilawson@gmail.com",
    adminPasscode: "Enlive0801@#",
    footerTagline: "Investor, builder, and writer based in Lagos.",
    footerCopyright: "© 2026 Tobi Lawson. All rights reserved.",
    footerLink1Name: "1914 Reader",
    footerLink1Url: "https://www.1914reader.com/",
    footerLink2Name: "Lagos Urban",
    footerLink2Url: "http://lagosurban.com",
    updatedAt: new Date().toISOString()
  },
  nowPage: {
    lastUpdated: "July 2026",
    heroTitle: "What I'm spending time on",
    introSubtitle: "A running account of the projects I'm building, updated as things move. Last updated July 2026.",
    ongoingProse: "I run and invest in companies across fintech, SME services technology, product development, and education technology. Some are early-stage, some are further along. I share specifics and case studies here as each venture is ready to talk about publicly.",
    updatedAt: new Date().toISOString()
  },
  courseSettings: {
    statusTag: "FREE COURSE • COMING SOON",
    title: "Artificial Intelligence in Frontier Markets",
    subtitle: "A free masterclass series exploring how compute, data pipelines, and foundation models are reshaped by the physical realities of emerging economies.",
    overviewProse: "Artificial Intelligence is often analyzed through the lens of Silicon Valley capital and hyperscaler data centers. But the real friction—and the highest-leverage opportunities—happen at the edges of global networks: in Lagos, Nairobi, Jakarta, and São Paulo.\n\nThis free course examines compute constraints, local dataset curation, offline-first inference architectures, and real-world deployment across fintech, SME logistics, and public institutions in frontier markets.",
    ctaText: "Enrollment is completely free. Leave your email to receive early lesson drops, video modules, and lecture notes as modules go live.",
    updatedAt: new Date().toISOString()
  },
  courseLessons: [
    {
      id: "module-01-compute-constraints",
      moduleNumber: "MODULE 01",
      title: "Compute Constraints & Edge Deployment",
      status: "Published",
      summary: "Designing low-latency model inference under intermittent power, bandwidth limits, and local infrastructure reality.",
      textContent: "In this lecture, we examine compute constraints across frontier market server environments. We analyze model quantization (4-bit / 8-bit), edge caching strategies, and local fallback routines.",
      videoType: "none",
      videoUrl: ""
    }
  ],
  projects: [
    {
      id: "1914-reader",
      title: "1914 Reader",
      roleTag: "Publication / Co-founder",
      description: "A publication co-founded with Feyi Fawehinmi reading African stories through the lens of global economic change.",
      link: "https://www.1914reader.com/",
      status: "Active"
    },
    {
      id: "lagos-urban",
      title: "Lagos Urban Project",
      roleTag: "Platform / Founder",
      description: "Reimagining Lagos as a more inclusive, livable, and productive city, built from how people live in it.",
      link: "http://lagosurban.com",
      status: "Active"
    },
    {
      id: "long-africa",
      title: "Long Africa",
      roleTag: "Institution / Launching Soon",
      description: "An institution dedicated to the civilisational foundations of African prosperity across multi-decade horizons.",
      link: "http://longafrica.org",
      status: "Launching Soon"
    }
  ],
  posts: [
    {
      id: "shape-lagos-takes",
      title: "The Shape Lagos Takes When No One Is Planning It",
      category: "Essay",
      date: "Jun 2026",
      summary: "On informal urbanism, and what the city's edges reveal about how Lagos works.",
      url: "writing/the-shape-lagos-takes.html"
    },
    {
      id: "patient-capital",
      title: "Patient Capital, Impatient Markets",
      category: "Essay",
      date: "May 2026",
      summary: "The timelines investors want and the timelines development requires rarely match. That mismatch has a cost.",
      url: "writing/patient-capital-impatient-markets.html"
    },
    {
      id: "how-asia-works-review",
      title: "How Asia Works, and What It Leaves Unanswered for Africa",
      category: "Book Review",
      date: "Apr 2026",
      summary: "Joe Studwell's case for land reform and export discipline holds up. The parts that don't translate say a lot about the starting point.",
      url: "writing/review-how-asia-works.html"
    }
  ],
  books: [
    {
      id: "who-made-this",
      title: "WHO MADE THIS?",
      subtitle: "A microhistory of everyday things",
      statusTag: "FORTHCOMING VOLUME • IN WRITING",
      coverImageUrl: "/assets/who-made-this-cover.jpg",
      synopsisP1: "Every morning, millions of people reach for an aluminum octagonal pot, twist a metallic tap, or click a ballpoint pen without considering the fierce industrial battles, accidental metallurgical discoveries, and human obsession engineered into those geometric forms.",
      synopsisP2: "Who Made This? traces the physical origins of modern domestic life. Moving object by object—from Alfonso Bialetti’s aluminum foundry in Piedmont to the early safety bicycle workshops of the 1890s—this volume recovers the sense of awe buried inside the ordinary objects surrounding us.",
      author: "Tobi Lawson",
      format: "Hardcover & Digital",
      releaseDate: "Late 2026",
      previewUrl: "books/who-made-this-preview.html",
      chapters: [
        { title: "The Eight Sides of Aluminum", status: "Chapter 01 • Available to Read", desc: "How Alfonso Bialetti observed laundry boilers in 1930s Crusinallo and engineered steam pressure to distill espresso inside an octagonal aluminum shell." },
        { title: "Light Without Smoke", status: "Chapter 02 • In Editing", desc: "The night Wabash, Indiana illuminated its public square with arc lamps, ending thousands of years of indoor fire, candle smoke, and oil fumes." },
        { title: "The Equal Wheels", status: "Chapter 03 • In Research", desc: "How the 1885 safety bicycle unlocked personal movement, dismantled social movement restrictions, and forced city engineers to pave muddy thoroughfares." }
      ]
    }
  ]
};

// Helper: Safely query element by multiple possible ID candidates
function getEl(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

// Local Storage Helper
export function getLocalSiteData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.settings) {
      if (!parsed.settings.aboutProfileImage) {
        parsed.settings.aboutProfileImage = "/assets/tobi-lawson.jpg";
      }
      if (parsed.settings.adminPasscode !== "Enlive0801@#") {
        parsed.settings.adminPasscode = "Enlive0801@#";
      }
    }
    return parsed;
  } catch (e) {
    console.error("Error reading site data from LocalStorage:", e);
    return INITIAL_DATA;
  }
}

export function saveLocalSiteData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("tobi_site_data_updated"));
  } catch (e) {
    console.error("Error saving site data to LocalStorage:", e);
  }
}

// Master Fetch with Supabase Hydration
export async function getMasterSiteData() {
  const local = getLocalSiteData();
  if (!isSupabaseConfigured) return local;

  try {
    const [cloudSettings, cloudNow, cloudPosts, cloudProjects, cloudBooks, cloudCourseSettings, cloudCourseLessons] = await Promise.all([
      syncSiteSettingsFromSupabase(),
      syncNowPageFromSupabase(),
      syncPostsFromSupabase(),
      syncProjectsFromSupabase(),
      syncBooksFromSupabase(),
      syncCourseSettingsFromSupabase(),
      syncCourseLessonsFromSupabase()
    ]);

    const localSettingsTs = local?.settings?.updatedAt ? new Date(local.settings.updatedAt).getTime() : 0;
    const cloudSettingsTs = cloudSettings?.updatedAt ? new Date(cloudSettings.updatedAt).getTime() : 0;

    let mergedSettings = { ...INITIAL_DATA.settings };

    if (cloudSettings) {
      for (const [key, val] of Object.entries(cloudSettings)) {
        if (val !== null && val !== undefined && val !== "") {
          mergedSettings[key] = val;
        }
      }
    }

    if (local && local.settings) {
      for (const [key, val] of Object.entries(local.settings)) {
        if (val !== null && val !== undefined && val !== "") {
          mergedSettings[key] = val;
        }
      }
    }

    const mergedPosts = (Array.isArray(cloudPosts) && cloudPosts.length > 0)
      ? cloudPosts
      : ((local && Array.isArray(local.posts) && local.posts.length > 0) ? local.posts : INITIAL_DATA.posts);

    const mergedProjects = (Array.isArray(cloudProjects) && cloudProjects.length > 0)
      ? cloudProjects
      : ((local && Array.isArray(local.projects) && local.projects.length > 0) ? local.projects : INITIAL_DATA.projects);

    const mergedBooks = (Array.isArray(cloudBooks) && cloudBooks.length > 0)
      ? cloudBooks
      : ((local && Array.isArray(local.books) && local.books.length > 0) ? local.books : INITIAL_DATA.books);

    const mergedCourseLessons = (Array.isArray(cloudCourseLessons) && cloudCourseLessons.length > 0)
      ? cloudCourseLessons
      : ((local && Array.isArray(local.courseLessons) && local.courseLessons.length > 0) ? local.courseLessons : INITIAL_DATA.courseLessons);

    const merged = {
      settings: mergedSettings,
      nowPage: cloudNow || local?.nowPage || INITIAL_DATA.nowPage,
      courseSettings: cloudCourseSettings || local?.courseSettings || INITIAL_DATA.courseSettings,
      courseLessons: mergedCourseLessons,
      posts: mergedPosts,
      projects: mergedProjects,
      books: mergedBooks
    };

    saveLocalSiteData(merged);
    return merged;
  } catch (e) {
    console.warn("Falling back to local site data:", e);
    return local;
  }
}

// UI State Controller & Event Listener Bindings
async function initAdminApp() {
  const authOverlay = document.getElementById("authOverlay");
  const authForm = document.getElementById("authForm");
  const passcodeInput = document.getElementById("passcodeInput");
  const authError = document.getElementById("authError");
  const adminConsole = document.getElementById("adminConsole");
  const logoutBtn = document.getElementById("logoutBtn");
  const cloudStatusIndicator = document.getElementById("cloudStatusIndicator");

  // Check Session Auth
  const isAuth = sessionStorage.getItem(AUTH_KEY) === "true";
  if (isAuth) {
    await showConsole();
  }

  // Handle Authentication Submission
  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const enteredPasscode = passcodeInput.value.trim();
      const currentData = await getMasterSiteData();
      const configuredPasscode = currentData?.settings?.adminPasscode;

      const isValid = (
        enteredPasscode === "Enlive0801@#" ||
        (configuredPasscode && enteredPasscode === configuredPasscode)
      );

      if (isValid) {
        sessionStorage.setItem(AUTH_KEY, "true");
        if (authError) authError.style.display = "none";
        await showConsole();
        showToast("Authenticated successfully. Welcome to your site editor!");
      } else {
        if (authError) authError.style.display = "block";
        passcodeInput.value = "";
        passcodeInput.focus();
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem(AUTH_KEY);
      adminConsole.style.display = "none";
      authOverlay.style.display = "flex";
      passcodeInput.value = "";
    });
  }

  async function showConsole() {
    if (authOverlay) authOverlay.style.display = "none";
    if (adminConsole) adminConsole.style.display = "block";

    if (cloudStatusIndicator) {
      if (isSupabaseConfigured) {
        cloudStatusIndicator.className = "cloud-status-pill meta";
        cloudStatusIndicator.innerHTML = "☁️ Supabase Cloud Active";
      } else {
        cloudStatusIndicator.className = "cloud-status-pill offline meta";
        cloudStatusIndicator.innerHTML = "💾 LocalStorage Mode";
      }
    }

    await renderConsoleData();
    subscribeToSupabaseRealtime(async () => {
      await renderConsoleData();
      showToast("Live updates synced from Supabase Cloud!");
    });
  }

  // Tab Navigation Handler — Handles both .admin-tab-btn and .admin-tab selectors
  const tabBtns = document.querySelectorAll(".admin-tab-btn, .admin-tab");
  const tabPanels = document.querySelectorAll(".admin-tab-content, .admin-panel");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      let targetTab = btn.getAttribute("data-tab");
      
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      
      let targetPanel = document.getElementById(targetTab);
      if (!targetPanel && targetTab) {
        targetPanel = document.getElementById(targetTab.startsWith("tab-") ? targetTab : "tab-" + targetTab);
      }
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  // Render Console Data
  async function renderConsoleData() {
    const data = await getMasterSiteData();

    // 1. Populate Site Settings & Bio Form
    const siteTitleEl = getEl("siteTitle", "settingSiteTitle");
    const heroTitleEl = getEl("heroTitle", "homeHeroTitle");
    const heroScribbleEl = getEl("heroScribbleWord", "homeHeroScribble");
    const heroSubtitleEl = getEl("heroSubtitle", "homeHeroSubtitle");
    const contactEmailEl = getEl("contactEmail", "settingContactEmail");
    const adminPasscodeEl = getEl("adminPasscode", "settingAdminPasscode");
    const footerTaglineEl = getEl("footerTagline", "homeFooterTagline", "settingFooterTagline");
    const footerCopyrightEl = getEl("footerCopyright", "homeFooterCopyright", "settingFooterCopyright");
    const footerLink1NameEl = getEl("footerLink1Name", "homeFooterLink1Name", "settingFooterLink1Name");
    const footerLink1UrlEl = getEl("footerLink1Url", "homeFooterLink1Url", "settingFooterLink1Url");
    const footerLink2NameEl = getEl("footerLink2Name", "homeFooterLink2Name", "settingFooterLink2Name");
    const footerLink2UrlEl = getEl("footerLink2Url", "homeFooterLink2Url", "settingFooterLink2Url");

    if (siteTitleEl) siteTitleEl.value = data.settings.siteTitle || "Tobi Lawson";
    if (heroTitleEl) heroTitleEl.value = data.settings.heroTitle || "";
    if (heroScribbleEl) heroScribbleEl.value = data.settings.heroScribbleWord || "purpose.";
    if (heroSubtitleEl) heroSubtitleEl.value = data.settings.heroSubtitle || "";
    if (contactEmailEl) contactEmailEl.value = data.settings.contactEmail || "olamilawson@gmail.com";
    if (adminPasscodeEl) adminPasscodeEl.value = data.settings.adminPasscode || "Enlive0801@#";
    if (footerTaglineEl) footerTaglineEl.value = data.settings.footerTagline || "Investor, builder, and writer based in Lagos.";
    if (footerCopyrightEl) footerCopyrightEl.value = data.settings.footerCopyright || "© 2026 Tobi Lawson. All rights reserved.";
    if (footerLink1NameEl) footerLink1NameEl.value = data.settings.footerLink1Name || "1914 Reader";
    if (footerLink1UrlEl) footerLink1UrlEl.value = data.settings.footerLink1Url || "https://www.1914reader.com/";
    if (footerLink2NameEl) footerLink2NameEl.value = data.settings.footerLink2Name || "Lagos Urban";
    if (footerLink2UrlEl) footerLink2UrlEl.value = data.settings.footerLink2Url || "http://lagosurban.com";

    // Populate About Page Section
    const aboutHeroTitleEl = getEl("aboutHeroTitle");
    const aboutHeroSubtitleEl = getEl("aboutHeroSubtitle");
    const aboutBodyProseEl = getEl("aboutBodyProse");
    const aboutProfileImageEl = getEl("aboutProfileImage");
    const aboutImgPreviewEl = getEl("aboutImgPreview");

    if (aboutHeroTitleEl) aboutHeroTitleEl.value = data.settings.aboutHeroTitle || "About Tobi Lawson";
    if (aboutHeroSubtitleEl) aboutHeroSubtitleEl.value = data.settings.aboutHeroSubtitle || "";
    if (aboutBodyProseEl) aboutBodyProseEl.value = data.settings.aboutBodyProse || "";
    if (aboutProfileImageEl) aboutProfileImageEl.value = data.settings.aboutProfileImage || "/assets/tobi-lawson.jpg";
    if (aboutImgPreviewEl) aboutImgPreviewEl.src = data.settings.aboutProfileImage || "/assets/tobi-lawson.jpg";

    // 2. Render Posts List / Table
    renderPostsList(data.posts);

    // 3. Populate Now Page Form
    const nowHeroTitleEl = getEl("nowHeroTitle", "nowLastUpdated");
    const nowSubtitleEl = getEl("nowSubtitle", "nowIntroSubtitle");
    const nowProseEl = getEl("nowProse", "nowOngoingProse");

    if (nowHeroTitleEl) nowHeroTitleEl.value = data.nowPage.heroTitle || data.nowPage.lastUpdated || "What I'm spending time on";
    if (nowSubtitleEl) nowSubtitleEl.value = data.nowPage.introSubtitle || "";
    if (nowProseEl) nowProseEl.value = data.nowPage.ongoingProse || "";

    // 4. Render Projects List / Table
    renderProjectsList(data.projects);

    // 5. Render Books Showcase & Chapters
    renderBooksList(data.books);

    // 6. Populate Course Settings & Render Lessons
    const cs = data.courseSettings || INITIAL_DATA.courseSettings;
    const courseStatusTagEl = getEl("courseStatusTag", "courseStatusTagInput");
    const courseTitleEl = getEl("courseTitle", "courseTitleInput");
    const courseSubtitleEl = getEl("courseSubtitle", "courseSubtitleInput");
    const courseOverviewProseEl = getEl("courseOverviewProse", "courseOverviewProseInput");
    const courseCtaTextEl = getEl("courseCtaText", "courseCtaTextInput");

    if (courseStatusTagEl) courseStatusTagEl.value = cs.statusTag || "FREE COURSE • COMING SOON";
    if (courseTitleEl) courseTitleEl.value = cs.title || "Artificial Intelligence in Frontier Markets";
    if (courseSubtitleEl) courseSubtitleEl.value = cs.subtitle || "";
    if (courseOverviewProseEl) courseOverviewProseEl.value = cs.overviewProse || "";
    if (courseCtaTextEl) courseCtaTextEl.value = cs.ctaText || "";

    renderCourseLessonsAdminList(data.courseLessons || INITIAL_DATA.courseLessons);
  }

  // Helper: Format Toast for Cloud Save Result
  function notifySaveResult(res, successMsg) {
    if (res && res.success === false) {
      showToast("Saved locally! Supabase Cloud notice: " + (res.error?.message || "Table check needed"));
    } else {
      showToast(successMsg);
    }
  }

  // Settings & Bio Form Submission (Supports #settingsForm and #homepageForm)
  const settingsForm = getEl("settingsForm", "homepageForm");
  if (settingsForm) {
    settingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      const siteTitleEl = getEl("siteTitle", "settingSiteTitle");
      const heroTitleEl = getEl("heroTitle", "homeHeroTitle");
      const heroScribbleEl = getEl("heroScribbleWord", "homeHeroScribble");
      const heroSubtitleEl = getEl("heroSubtitle", "homeHeroSubtitle");
      const contactEmailEl = getEl("contactEmail", "settingContactEmail");
      const adminPasscodeEl = getEl("adminPasscode", "settingAdminPasscode");
      const footerTaglineEl = getEl("footerTagline", "homeFooterTagline", "settingFooterTagline");
      const footerCopyrightEl = getEl("footerCopyright", "homeFooterCopyright", "settingFooterCopyright");
      const footerLink1NameEl = getEl("footerLink1Name", "homeFooterLink1Name", "settingFooterLink1Name");
      const footerLink1UrlEl = getEl("footerLink1Url", "homeFooterLink1Url", "settingFooterLink1Url");
      const footerLink2NameEl = getEl("footerLink2Name", "homeFooterLink2Name", "settingFooterLink2Name");
      const footerLink2UrlEl = getEl("footerLink2Url", "homeFooterLink2Url", "settingFooterLink2Url");

      const aboutHeroTitleEl = getEl("aboutHeroTitle");
      const aboutHeroSubtitleEl = getEl("aboutHeroSubtitle");
      const aboutBodyProseEl = getEl("aboutBodyProse");
      const aboutProfileImageEl = getEl("aboutProfileImage");

      if (siteTitleEl) data.settings.siteTitle = siteTitleEl.value.trim();
      if (heroTitleEl) data.settings.heroTitle = heroTitleEl.value.trim();
      if (heroScribbleEl) data.settings.heroScribbleWord = heroScribbleEl.value.trim();
      if (heroSubtitleEl) data.settings.heroSubtitle = heroSubtitleEl.value.trim();
      if (contactEmailEl) data.settings.contactEmail = contactEmailEl.value.trim();
      if (adminPasscodeEl) data.settings.adminPasscode = adminPasscodeEl.value.trim();
      if (footerTaglineEl) data.settings.footerTagline = footerTaglineEl.value.trim();
      if (footerCopyrightEl) data.settings.footerCopyright = footerCopyrightEl.value.trim();
      if (footerLink1NameEl) data.settings.footerLink1Name = footerLink1NameEl.value.trim();
      if (footerLink1UrlEl) data.settings.footerLink1Url = footerLink1UrlEl.value.trim();
      if (footerLink2NameEl) data.settings.footerLink2Name = footerLink2NameEl.value.trim();
      if (footerLink2UrlEl) data.settings.footerLink2Url = footerLink2UrlEl.value.trim();

      if (aboutHeroTitleEl) data.settings.aboutHeroTitle = aboutHeroTitleEl.value.trim();
      if (aboutHeroSubtitleEl) data.settings.aboutHeroSubtitle = aboutHeroSubtitleEl.value.trim();
      if (aboutBodyProseEl) data.settings.aboutBodyProse = aboutBodyProseEl.value.trim();
      if (aboutProfileImageEl) data.settings.aboutProfileImage = aboutProfileImageEl.value.trim();

      data.settings.updatedAt = new Date().toISOString();

      saveLocalSiteData(data);
      const res = await saveSiteSettingsToSupabase(data.settings);
      notifySaveResult(res, "Site settings & About page content updated!");
    });
  }

  // Portrait Photo Upload Handler
  const aboutImgFileInput = getEl("aboutImgFileInput");
  if (aboutImgFileInput) {
    aboutImgFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const urlInput = getEl("aboutProfileImage");
        const previewImg = getEl("aboutImgPreview");
        if (urlInput) urlInput.value = evt.target.result;
        if (previewImg) previewImg.src = evt.target.result;
        showToast("New portrait photo attached! Click Save Site Settings to apply.");
      };
      reader.readAsDataURL(file);
    });
  }

  // Writing Posts Render (Supports Table & Div Grid layouts)
  function renderPostsList(posts) {
    const listEl = getEl("postsTableBody", "postsList");
    if (!listEl) return;

    if (!posts || posts.length === 0) {
      if (listEl.tagName === "TBODY") {
        listEl.innerHTML = `<tr><td colspan="5" class="meta" style="text-align: center; padding: 2rem; color: var(--text-muted);">No published articles found. Click "+ Write New Essay" to add one.</td></tr>`;
      } else {
        listEl.innerHTML = `<div class="meta" style="padding: 2rem 0; color: var(--text-muted);">No published articles found. Click "+ Write New Essay" to add one.</div>`;
      }
      return;
    }

    if (listEl.tagName === "TBODY") {
      listEl.innerHTML = posts.map((post) => `
        <tr>
          <td style="font-weight: 700;">${post.title}</td>
          <td><span class="meta">${post.category || 'Essay'}</span></td>
          <td><span class="meta">${post.date || ''}</span></td>
          <td><span class="meta" style="color: var(--text-muted);">${post.url}</span></td>
          <td>
            <div style="display: flex; gap: 0.5rem;">
              <button class="admin-btn admin-btn-secondary edit-post-btn" data-id="${post.id}">Edit</button>
              <button class="admin-btn admin-btn-danger delete-post-btn" data-id="${post.id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join("");
    } else {
      listEl.innerHTML = posts.map((post) => `
        <div class="admin-grid-item">
          <div class="admin-grid-item-content">
            <div>
              <span class="admin-badge meta">${post.category || 'Essay'}</span>
              <span class="meta" style="color: var(--text-muted);">${post.date || ''}</span>
            </div>
            <h4>${post.title}</h4>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem;">${post.summary}</p>
            <div class="meta" style="margin-top: 0.5rem; color: var(--text-muted);">${post.url}</div>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
            <button class="admin-btn admin-btn-secondary edit-post-btn" data-id="${post.id}">Edit</button>
            <button class="admin-btn admin-btn-danger delete-post-btn" data-id="${post.id}">Delete</button>
          </div>
        </div>
      `).join("");
    }

    listEl.querySelectorAll(".edit-post-btn").forEach((btn) => {
      btn.addEventListener("click", () => openPostModal(btn.getAttribute("data-id")));
    });

    listEl.querySelectorAll(".delete-post-btn").forEach((btn) => {
      btn.addEventListener("click", () => deletePost(btn.getAttribute("data-id")));
    });
  }

  // Now Page Form Submission (Supports #nowForm and #nowPageForm)
  const nowFormEl = getEl("nowForm", "nowPageForm");
  if (nowFormEl) {
    nowFormEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      const nowHeroTitleEl = getEl("nowHeroTitle", "nowLastUpdated");
      const nowSubtitleEl = getEl("nowSubtitle", "nowIntroSubtitle");
      const nowProseEl = getEl("nowProse", "nowOngoingProse");

      if (nowHeroTitleEl) data.nowPage.heroTitle = nowHeroTitleEl.value.trim();
      if (nowSubtitleEl) data.nowPage.introSubtitle = nowSubtitleEl.value.trim();
      if (nowProseEl) data.nowPage.ongoingProse = nowProseEl.value.trim();
      data.nowPage.updatedAt = new Date().toISOString();

      saveLocalSiteData(data);
      const res = await saveNowPageToSupabase(data.nowPage);
      notifySaveResult(res, '"Now" page content updated!');
    });
  }

  // Books Form & Chapters CMS Handler
  function renderBooksList(books) {
    if (!books || books.length === 0) return;
    const b = books[0];
    const bt = getEl("bookTitleInput");
    const bs = getEl("bookSubtitleInput");
    const bst = getEl("bookStatusTagInput");
    const brd = getEl("bookReleaseDateInput");
    const bci = getEl("bookCoverImageUrlInput");
    const bp1 = getEl("bookSynopsisP1Input");
    const bp2 = getEl("bookSynopsisP2Input");
    const bau = getEl("bookAuthorInput");
    const bfmt = getEl("bookFormatInput");
    const bprv = getEl("bookPreviewUrlInput");

    if (bt) bt.value = b.title || "";
    if (bs) bs.value = b.subtitle || "";
    if (bst) bst.value = b.statusTag || "FORTHCOMING VOLUME • IN WRITING";
    if (brd) brd.value = b.releaseDate || "Late 2026";
    if (bci) bci.value = b.coverImageUrl || "/assets/who-made-this-cover.jpg";
    if (bp1) bp1.value = b.synopsisP1 || "";
    if (bp2) bp2.value = b.synopsisP2 || "";
    if (bau) bau.value = b.author || "Tobi Lawson";
    if (bfmt) bfmt.value = b.format || "Hardcover & Digital";
    if (bprv) bprv.value = b.previewUrl || "";

    renderChaptersAdminList(b.chapters || []);
  }

  const booksForm = getEl("booksForm");
  if (booksForm) {
    booksForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      if (!data.books || data.books.length === 0) {
        data.books = [{ id: "who-made-this", chapters: [] }];
      }
      const b = data.books[0];
      const bt = getEl("bookTitleInput");
      const bs = getEl("bookSubtitleInput");
      const bst = getEl("bookStatusTagInput");
      const brd = getEl("bookReleaseDateInput");
      const bci = getEl("bookCoverImageUrlInput");
      const bp1 = getEl("bookSynopsisP1Input");
      const bp2 = getEl("bookSynopsisP2Input");
      const bau = getEl("bookAuthorInput");
      const bfmt = getEl("bookFormatInput");
      const bprv = getEl("bookPreviewUrlInput");

      if (bt) b.title = bt.value.trim();
      if (bs) b.subtitle = bs.value.trim();
      if (bst) b.statusTag = bst.value.trim();
      if (brd) b.releaseDate = brd.value.trim();
      if (bci) b.coverImageUrl = bci.value.trim();
      if (bp1) b.synopsisP1 = bp1.value.trim();
      if (bp2) b.synopsisP2 = bp2.value.trim();
      if (bau) b.author = bau.value.trim();
      if (bfmt) b.format = bfmt.value.trim();
      if (bprv) b.previewUrl = bprv.value.trim();

      data.settings.updatedAt = new Date().toISOString();
      saveLocalSiteData(data);
      const res = await saveBookToSupabase(b);
      notifySaveResult(res, "Book showcase details & cover updated!");
    });
  }

  const bookCoverFileInput = getEl("bookCoverFileInput");
  if (bookCoverFileInput) {
    bookCoverFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const urlInput = getEl("bookCoverImageUrlInput");
        if (urlInput) urlInput.value = evt.target.result;
        showToast("Book cover image attached!");
      };
      reader.readAsDataURL(file);
    });
  }

  function renderChaptersAdminList(chapters) {
    const listEl = getEl("chaptersListAdmin", "chaptersList");
    if (!listEl) return;

    if (!chapters || chapters.length === 0) {
      listEl.innerHTML = `<div class="meta" style="color: var(--text-muted); padding: 1.5rem 0;">No chapters added yet. Click "+ Add Chapter" above.</div>`;
      return;
    }

    listEl.innerHTML = chapters.map((c, idx) => `
      <div style="background: var(--bg); border: 1px solid var(--line); padding: 1.25rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
        <div>
          <span class="meta" style="color: var(--accent); display: block; margin-bottom: 0.25rem;">${c.status || 'Chapter'}</span>
          <h4 style="font-size: 1.15rem; margin-bottom: 0.5rem;">${c.title}</h4>
          <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.5;">${c.desc}</p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
          <button class="admin-btn admin-btn-secondary edit-chap-btn" data-idx="${idx}">Edit</button>
          <button class="admin-btn admin-btn-danger delete-chap-btn" data-idx="${idx}">Delete</button>
        </div>
      </div>
    `).join("");

    listEl.querySelectorAll(".edit-chap-btn").forEach((btn) => {
      btn.addEventListener("click", () => openChapterModal(parseInt(btn.getAttribute("data-idx"))));
    });

    listEl.querySelectorAll(".delete-chap-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteChapter(parseInt(btn.getAttribute("data-idx"))));
    });
  }

  // Chapter Modal Controls
  const chapterModal = getEl("chapterModal");
  const addChapterBtn = getEl("addChapterBtn");
  const closeChapterModalBtn = getEl("closeChapterModalBtn");
  const cancelChapterModalBtn = getEl("cancelChapterModalBtn");
  const chapterForm = getEl("chapterForm");

  if (addChapterBtn) addChapterBtn.addEventListener("click", () => openChapterModal());
  if (closeChapterModalBtn) closeChapterModalBtn.addEventListener("click", () => { if (chapterModal) chapterModal.style.display = "none"; });
  if (cancelChapterModalBtn) cancelChapterModalBtn.addEventListener("click", () => { if (chapterModal) chapterModal.style.display = "none"; });

  async function openChapterModal(idx = null) {
    const data = await getMasterSiteData();
    const b = (data.books && data.books[0]) ? data.books[0] : { chapters: [] };
    const modalTitle = getEl("chapterModalTitle");
    const indexInput = getEl("chapterIndex");
    const titleInput = getEl("chapterTitle");
    const statusInput = getEl("chapterStatus");
    const descInput = getEl("chapterDesc");

    if (idx !== null && b.chapters && b.chapters[idx]) {
      const c = b.chapters[idx];
      if (modalTitle) modalTitle.textContent = "Edit Chapter Entry";
      if (indexInput) indexInput.value = idx;
      if (titleInput) titleInput.value = c.title;
      if (statusInput) statusInput.value = c.status;
      if (descInput) descInput.value = c.desc;
    } else {
      if (modalTitle) modalTitle.textContent = "Add Chapter Entry";
      if (chapterForm) chapterForm.reset();
      if (indexInput) indexInput.value = "";
    }

    if (chapterModal) chapterModal.style.display = "flex";
  }

  if (chapterForm) {
    chapterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      if (!data.books || data.books.length === 0) {
        data.books = [{ id: "who-made-this", chapters: [] }];
      }
      const b = data.books[0];
      if (!b.chapters) b.chapters = [];

      const idxVal = getEl("chapterIndex").value;
      const title = getEl("chapterTitle").value.trim();
      const status = getEl("chapterStatus").value.trim();
      const desc = getEl("chapterDesc").value.trim();

      const chapObj = { title, status, desc };

      if (idxVal !== "") {
        b.chapters[parseInt(idxVal)] = chapObj;
      } else {
        b.chapters.push(chapObj);
      }

      data.settings.updatedAt = new Date().toISOString();
      saveLocalSiteData(data);
      const res = await saveBookToSupabase(b);
      if (chapterModal) chapterModal.style.display = "none";
      await renderConsoleData();
      notifySaveResult(res, "Chapter entry saved!");
    });
  }

  async function deleteChapter(idx) {
    if (!confirm("Delete this chapter entry?")) return;
    const data = await getMasterSiteData();
    if (data.books && data.books[0] && data.books[0].chapters) {
      data.books[0].chapters.splice(idx, 1);
      data.settings.updatedAt = new Date().toISOString();
      saveLocalSiteData(data);
      const res = await saveBookToSupabase(data.books[0]);
      await renderConsoleData();
      notifySaveResult(res, "Chapter removed.");
    }
  }

  // 6. Projects Render (Table & List formats)
  function renderProjectsList(projects) {
    const listEl = getEl("projectsTableBody", "projectsList");
    if (!listEl) return;

    if (!projects || projects.length === 0) {
      if (listEl.tagName === "TBODY") {
        listEl.innerHTML = `<tr><td colspan="4" class="meta" style="text-align: center; padding: 2rem; color: var(--text-muted);">No active projects found. Click "+ Add Project" to add one.</td></tr>`;
      } else {
        listEl.innerHTML = `<div class="meta" style="padding: 2rem 0; color: var(--text-muted);">No active projects found. Click "+ Add Project" to add one.</div>`;
      }
      return;
    }

    if (listEl.tagName === "TBODY") {
      listEl.innerHTML = projects.map((proj) => `
        <tr>
          <td style="font-weight: 700;">${proj.title}</td>
          <td><span class="meta">${proj.roleTag || 'Project'}</span></td>
          <td><span class="meta" style="color: var(--accent);">${proj.status || 'Active'}</span></td>
          <td>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <a href="${proj.link}" target="_blank" class="meta" style="color: var(--text-muted); margin-right: 0.5rem;">Visit ↗</a>
              <button class="admin-btn admin-btn-danger delete-project-btn" data-id="${proj.id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join("");
    } else {
      listEl.innerHTML = projects.map((proj) => `
        <div class="admin-grid-item">
          <div class="admin-grid-item-content">
            <span class="admin-badge meta">${proj.roleTag || 'Project'}</span>
            <h4>${proj.title}</h4>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem;">${proj.description}</p>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-shrink: 0; align-items: center;">
            <a href="${proj.link}" target="_blank" class="meta" style="color: var(--text-muted); margin-right: 0.5rem;">${proj.link} ↗</a>
            <button class="admin-btn admin-btn-danger delete-project-btn" data-id="${proj.id}">Delete</button>
          </div>
        </div>
      `).join("");
    }

    listEl.querySelectorAll(".delete-project-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteProject(btn.getAttribute("data-id")));
    });
  }

  // Modal Handlers for Articles
  const postModal = getEl("postModal");
  const newPostBtn = getEl("newPostBtn");
  const closePostModalBtn = getEl("closePostModalBtn");
  const cancelPostModalBtn = getEl("cancelPostModalBtn");
  const postForm = getEl("postForm");

  if (newPostBtn) newPostBtn.addEventListener("click", () => openPostModal());
  if (closePostModalBtn) closePostModalBtn.addEventListener("click", closePostModal);
  if (cancelPostModalBtn) cancelPostModalBtn.addEventListener("click", closePostModal);

  async function openPostModal(postId = null) {
    const data = await getMasterSiteData();
    const modalTitle = getEl("postModalTitle");
    const idInput = getEl("postId");
    const titleInput = getEl("postTitleInput", "postTitle");
    const typeInput = getEl("postCategoryInput", "postType");
    const dateInput = getEl("postDateInput", "postDate");
    const summaryInput = getEl("postSummaryInput", "postSummary");
    const urlInput = getEl("postUrlInput", "postUrl");

    if (postId) {
      const existing = data.posts.find((p) => p.id === postId);
      if (existing) {
        if (modalTitle) modalTitle.textContent = "Edit Article";
        if (idInput) idInput.value = existing.id;
        if (titleInput) titleInput.value = existing.title;
        if (typeInput) typeInput.value = existing.category;
        if (dateInput) dateInput.value = existing.date;
        if (summaryInput) summaryInput.value = existing.summary;
        if (urlInput) urlInput.value = existing.url;
      }
    } else {
      if (modalTitle) modalTitle.textContent = "Create New Article";
      if (postForm) postForm.reset();
      if (idInput) idInput.value = "";
    }

    if (postModal) postModal.style.display = "flex";
  }

  function closePostModal() {
    if (postModal) postModal.style.display = "none";
  }

  if (postForm) {
    postForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      const idInput = getEl("postId").value;
      const title = getEl("postTitleInput", "postTitle").value.trim();
      const category = getEl("postCategoryInput", "postType").value.trim();
      const date = getEl("postDateInput", "postDate").value.trim();
      const summary = getEl("postSummaryInput", "postSummary").value.trim();
      const url = getEl("postUrlInput", "postUrl").value.trim();

      const newPost = {
        id: idInput || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title,
        category,
        date,
        summary,
        url
      };

      if (!data.posts) data.posts = [];

      if (idInput) {
        const idx = data.posts.findIndex((p) => p.id === idInput);
        if (idx !== -1) data.posts[idx] = newPost;
      } else {
        data.posts.unshift(newPost);
      }

      data.settings.updatedAt = new Date().toISOString();
      saveLocalSiteData(data);
      const res = await savePostToSupabase(newPost);
      closePostModal();
      await renderConsoleData();
      notifySaveResult(res, idInput ? "Article updated successfully." : "New article published successfully.");
    });
  }

  async function deletePost(postId) {
    if (!confirm("Are you sure you want to delete this article?")) return;
    const data = await getMasterSiteData();
    data.posts = (data.posts || []).filter((p) => p.id !== postId);
    data.settings.updatedAt = new Date().toISOString();
    saveLocalSiteData(data);
    const res = await deletePostFromSupabase(postId);
    await renderConsoleData();
    notifySaveResult(res, "Article deleted.");
  }

  // Modal Handlers for Projects
  const projectModal = getEl("projectModal");
  const newProjectBtn = getEl("newProjectBtn");
  const closeProjectModalBtn = getEl("closeProjectModalBtn");
  const cancelProjectModalBtn = getEl("cancelProjectModalBtn");
  const projectForm = getEl("projectForm");

  if (newProjectBtn) newProjectBtn.addEventListener("click", () => {
    if (projectForm) projectForm.reset();
    if (projectModal) projectModal.style.display = "flex";
  });

  if (closeProjectModalBtn) closeProjectModalBtn.addEventListener("click", () => { if (projectModal) projectModal.style.display = "none"; });
  if (cancelProjectModalBtn) cancelProjectModalBtn.addEventListener("click", () => { if (projectModal) projectModal.style.display = "none"; });

  if (projectForm) {
    projectForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      const idInput = getEl("projectId").value;
      const title = getEl("projectTitleInput", "projectTitle").value.trim();
      const roleTag = getEl("projectRoleInput", "projectRole").value.trim();
      const status = getEl("projectStatusInput", "projectStatus").value.trim();
      const description = getEl("projectDescInput", "projectDesc").value.trim();
      const link = getEl("projectLinkInput", "projectLink").value.trim();

      const newProj = {
        id: idInput || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title,
        roleTag,
        status,
        description,
        link
      };

      if (!data.projects) data.projects = [];

      if (idInput) {
        const idx = data.projects.findIndex((p) => p.id === idInput);
        if (idx !== -1) data.projects[idx] = newProj;
      } else {
        data.projects.unshift(newProj);
      }

      data.settings.updatedAt = new Date().toISOString();
      saveLocalSiteData(data);
      const res = await saveProjectToSupabase(newProj);
      if (projectModal) projectModal.style.display = "none";
      await renderConsoleData();
      notifySaveResult(res, idInput ? "Project updated." : "New project added.");
    });
  }

  async function deleteProject(projId) {
    if (!confirm("Delete this project?")) return;
    const data = await getMasterSiteData();
    data.projects = (data.projects || []).filter((p) => p.id !== projId);
    data.settings.updatedAt = new Date().toISOString();
    saveLocalSiteData(data);
    const res = await deleteProjectFromSupabase(projId);
    await renderConsoleData();
    notifySaveResult(res, "Project removed.");
  }

  // Course Settings Form Handler (Supports #courseSettingsForm)
  const courseSettingsForm = getEl("courseSettingsForm");
  if (courseSettingsForm) {
    courseSettingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      if (!data.courseSettings) data.courseSettings = {};

      const st = getEl("courseStatusTag", "courseStatusTagInput");
      const ct = getEl("courseTitle", "courseTitleInput");
      const cs = getEl("courseSubtitle", "courseSubtitleInput");
      const co = getEl("courseOverviewProse", "courseOverviewProseInput");
      const cta = getEl("courseCtaText", "courseCtaTextInput");

      if (st) data.courseSettings.statusTag = st.value.trim();
      if (ct) data.courseSettings.title = ct.value.trim();
      if (cs) data.courseSettings.subtitle = cs.value.trim();
      if (co) data.courseSettings.overviewProse = co.value.trim();
      if (cta) data.courseSettings.ctaText = cta.value.trim();

      data.courseSettings.updatedAt = new Date().toISOString();
      saveLocalSiteData(data);
      const res = await saveCourseSettingsToSupabase(data.courseSettings);
      notifySaveResult(res, "Course syllabus & overview updated!");
    });
  }

  // Course Lessons Render
  function renderCourseLessonsAdminList(lessons) {
    const listEl = getEl("courseLessonsAdminList", "courseLessonsList");
    if (!listEl) return;

    if (!lessons || lessons.length === 0) {
      listEl.innerHTML = `<div class="meta" style="color: var(--text-muted); padding: 1.5rem 0;">No lesson modules published yet. Click "+ Add Lesson Module" above.</div>`;
      return;
    }

    listEl.innerHTML = lessons.map((l) => `
      <div style="background: var(--bg); border: 1px solid var(--line); padding: 1.25rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
        <div>
          <span class="meta" style="color: var(--accent); display: block; margin-bottom: 0.25rem;">${l.moduleNumber || 'MODULE'} • ${l.status || 'Published'}</span>
          <h4 style="font-size: 1.15rem; margin-bottom: 0.5rem;">${l.title}</h4>
          <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.5;">${l.summary}</p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-shrink: 0; align-items: center;">
          <button class="admin-btn admin-btn-secondary edit-lesson-btn" data-id="${l.id}">Edit</button>
          <button class="admin-btn admin-btn-danger delete-lesson-btn" data-id="${l.id}">Delete</button>
        </div>
      </div>
    `).join("");

    listEl.querySelectorAll(".edit-lesson-btn").forEach((btn) => {
      btn.addEventListener("click", () => openLessonModal(btn.getAttribute("data-id")));
    });

    listEl.querySelectorAll(".delete-lesson-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteLesson(btn.getAttribute("data-id")));
    });
  }

  // Lesson Modal Handlers
  const lessonModal = getEl("lessonModal");
  const newLessonBtn = getEl("newLessonBtn");
  const closeLessonModalBtn = getEl("closeLessonModalBtn");
  const cancelLessonModalBtn = getEl("cancelLessonModalBtn");
  const lessonForm = getEl("lessonForm");

  if (newLessonBtn) newLessonBtn.addEventListener("click", () => openLessonModal());
  if (closeLessonModalBtn) closeLessonModalBtn.addEventListener("click", () => { if (lessonModal) lessonModal.style.display = "none"; });
  if (cancelLessonModalBtn) cancelLessonModalBtn.addEventListener("click", () => { if (lessonModal) lessonModal.style.display = "none"; });

  async function openLessonModal(lessonId = null) {
    const data = await getMasterSiteData();
    const modalTitle = getEl("lessonModalTitle");
    const idInput = getEl("lessonId");
    const numInput = getEl("lessonModuleNumber");
    const titleInput = getEl("lessonTitle");
    const statusInput = getEl("lessonStatus");
    const summaryInput = getEl("lessonSummary");
    const textInput = getEl("lessonTextContent");

    if (lessonId && data.courseLessons) {
      const existing = data.courseLessons.find((l) => l.id === lessonId);
      if (existing) {
        if (modalTitle) modalTitle.textContent = "Edit Lesson Module";
        if (idInput) idInput.value = existing.id;
        if (numInput) numInput.value = existing.moduleNumber || "MODULE 01";
        if (titleInput) titleInput.value = existing.title;
        if (statusInput) statusInput.value = existing.status || "Published";
        if (summaryInput) summaryInput.value = existing.summary || "";
        if (textInput) textInput.value = existing.textContent || "";
      }
    } else {
      if (modalTitle) modalTitle.textContent = "Add Lesson Module";
      if (lessonForm) lessonForm.reset();
      if (idInput) idInput.value = "";
    }

    if (lessonModal) lessonModal.style.display = "flex";
  }

  if (lessonForm) {
    lessonForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      const idInput = getEl("lessonId").value;
      const moduleNumber = getEl("lessonModuleNumber").value.trim();
      const title = getEl("lessonTitle").value.trim();
      const status = getEl("lessonStatus").value.trim();
      const summary = getEl("lessonSummary").value.trim();
      const textContent = getEl("lessonTextContent").value.trim();

      const lessonObj = {
        id: idInput || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        moduleNumber,
        title,
        status,
        summary,
        textContent,
        videoType: "none",
        videoUrl: ""
      };

      if (!data.courseLessons) data.courseLessons = [];

      if (idInput) {
        const idx = data.courseLessons.findIndex((l) => l.id === idInput);
        if (idx !== -1) data.courseLessons[idx] = lessonObj;
      } else {
        data.courseLessons.push(lessonObj);
      }

      data.settings.updatedAt = new Date().toISOString();
      saveLocalSiteData(data);
      const res = await saveCourseLessonToSupabase(lessonObj);
      if (lessonModal) lessonModal.style.display = "none";
      await renderConsoleData();
      notifySaveResult(res, "Lesson module saved!");
    });
  }

  async function deleteLesson(lessonId) {
    if (!confirm("Delete this lesson module?")) return;
    const data = await getMasterSiteData();
    data.courseLessons = (data.courseLessons || []).filter((l) => l.id !== lessonId);
    data.settings.updatedAt = new Date().toISOString();
    saveLocalSiteData(data);
    const res = await deleteCourseLessonFromSupabase(lessonId);
    await renderConsoleData();
    notifySaveResult(res, "Lesson module deleted.");
  }

  // Backup & Restore Buttons
  const exportJsonBtn = getEl("exportJsonBtn");
  const importJsonInput = getEl("importJsonInput");
  const resetDefaultsBtn = getEl("resetDefaultsBtn");

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", async () => {
      const data = await getMasterSiteData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tobi-lawson-site-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("JSON backup downloaded!");
    });
  }

  if (importJsonInput) {
    importJsonInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (parsed && parsed.settings) {
            saveLocalSiteData(parsed);
            await seedInitialDataToSupabase(parsed);
            await renderConsoleData();
            showToast("Backup restored successfully!");
          }
        } catch (err) {
          alert("Error parsing backup JSON file.");
        }
      };
      reader.readAsText(file);
    });
  }

  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener("click", async () => {
      if (confirm("Reset all content to factory defaults?")) {
        saveLocalSiteData(INITIAL_DATA);
        await seedInitialDataToSupabase(INITIAL_DATA);
        await renderConsoleData();
        showToast("Site data reset to factory defaults.");
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdminApp);
} else {
  initAdminApp();
}

// Toast Helper
function showToast(message) {
  const toast = document.getElementById("toastNotification");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}
