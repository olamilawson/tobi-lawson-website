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
      coverImageUrl: "assets/who-made-this-cover.jpg",
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

// Data Helper Functions
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
        parsed.settings.aboutProfileImage = "./assets/tobi-lawson.jpg";
      }
      if (parsed.settings.adminPasscode === "tobi2026" || !parsed.settings.adminPasscode) {
        parsed.settings.adminPasscode = "Enlive0801@#";
      }
      if (!parsed.courseSettings) {
        parsed.courseSettings = INITIAL_DATA.courseSettings;
      }
      if (!parsed.courseLessons) {
        parsed.courseLessons = INITIAL_DATA.courseLessons;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
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

// Master Fetch with Supabase Hydration (Timestamps & Local Priority)
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

    let mergedSettings = cloudSettings || local?.settings || INITIAL_DATA.settings;
    if (localSettingsTs > cloudSettingsTs && local?.settings) {
      mergedSettings = local.settings;
      saveSiteSettingsToSupabase(local.settings);
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

// UI State Controller
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

  // Tab Navigation Handler
  const tabBtns = document.querySelectorAll(".admin-tab");
  const tabPanels = document.querySelectorAll(".admin-panel");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = document.getElementById(`tab-${targetTab}`);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  // Render Console Data
  async function renderConsoleData() {
    const data = await getMasterSiteData();

    // 1. Populate Homepage Form
    const homeHeroTitle = document.getElementById("homeHeroTitle");
    const homeHeroScribble = document.getElementById("homeHeroScribble");
    const homeHeroSubtitle = document.getElementById("homeHeroSubtitle");
    const homeFooterTagline = document.getElementById("homeFooterTagline");
    const homeFooterCopyright = document.getElementById("homeFooterCopyright");
    const homeFooterLink1Name = document.getElementById("homeFooterLink1Name");
    const homeFooterLink1Url = document.getElementById("homeFooterLink1Url");
    const homeFooterLink2Name = document.getElementById("homeFooterLink2Name");
    const homeFooterLink2Url = document.getElementById("homeFooterLink2Url");

    if (homeHeroTitle) homeHeroTitle.value = data.settings.heroTitle || "";
    if (homeHeroScribble) homeHeroScribble.value = data.settings.heroScribbleWord || "purpose.";
    if (homeHeroSubtitle) homeHeroSubtitle.value = data.settings.heroSubtitle || "";
    if (homeFooterTagline) homeFooterTagline.value = data.settings.footerTagline || "Investor, builder, and writer based in Lagos.";
    if (homeFooterCopyright) homeFooterCopyright.value = data.settings.footerCopyright || "© 2026 Tobi Lawson. All rights reserved.";
    if (homeFooterLink1Name) homeFooterLink1Name.value = data.settings.footerLink1Name || "1914 Reader";
    if (homeFooterLink1Url) homeFooterLink1Url.value = data.settings.footerLink1Url || "https://www.1914reader.com/";
    if (homeFooterLink2Name) homeFooterLink2Name.value = data.settings.footerLink2Name || "Lagos Urban";
    if (homeFooterLink2Url) homeFooterLink2Url.value = data.settings.footerLink2Url || "http://lagosurban.com";

    // 2. Render Posts List
    renderPostsList(data.posts);

    // 3. Populate Now Page Form
    const nowLastUpdated = document.getElementById("nowLastUpdated");
    const nowIntroSubtitle = document.getElementById("nowIntroSubtitle");
    const nowOngoingProse = document.getElementById("nowOngoingProse");

    if (nowLastUpdated) nowLastUpdated.value = data.nowPage.lastUpdated || "";
    if (nowIntroSubtitle) nowIntroSubtitle.value = data.nowPage.introSubtitle || "";
    if (nowOngoingProse) nowOngoingProse.value = data.nowPage.ongoingProse || "";

    // 4. Render Books List
    renderBooksList(data.books);

    // 5. Populate About Form
    const aboutHeroTitle = document.getElementById("aboutHeroTitle");
    const aboutHeroSubtitle = document.getElementById("aboutHeroSubtitle");
    const aboutBodyProse = document.getElementById("aboutBodyProse");
    const aboutProfileImage = document.getElementById("aboutProfileImage");
    const aboutImgPreview = document.getElementById("aboutImgPreview");

    if (aboutHeroTitle) aboutHeroTitle.value = data.settings.aboutHeroTitle || "About Tobi Lawson";
    if (aboutHeroSubtitle) aboutHeroSubtitle.value = data.settings.aboutHeroSubtitle || "";
    if (aboutBodyProse) aboutBodyProse.value = data.settings.aboutBodyProse || "";
    if (aboutProfileImage) aboutProfileImage.value = data.settings.aboutProfileImage || "./assets/tobi-lawson.jpg";
    if (aboutImgPreview) aboutImgPreview.src = data.settings.aboutProfileImage || "./assets/tobi-lawson.jpg";

    // 6. Render Projects List
    renderProjectsList(data.projects);

    // 7. Populate Settings & Footer Form
    const settingSiteTitle = document.getElementById("settingSiteTitle");
    const settingContactEmail = document.getElementById("settingContactEmail");
    const settingAdminPasscode = document.getElementById("settingAdminPasscode");
    const settingFooterTagline = document.getElementById("settingFooterTagline");
    const settingFooterCopyright = document.getElementById("settingFooterCopyright");
    const settingFooterLink1Name = document.getElementById("settingFooterLink1Name");
    const settingFooterLink1Url = document.getElementById("settingFooterLink1Url");
    const settingFooterLink2Name = document.getElementById("settingFooterLink2Name");
    const settingFooterLink2Url = document.getElementById("settingFooterLink2Url");

    if (settingSiteTitle) settingSiteTitle.value = data.settings.siteTitle || "";
    if (settingContactEmail) settingContactEmail.value = data.settings.contactEmail || "olamilawson@gmail.com";
    if (settingAdminPasscode) settingAdminPasscode.value = data.settings.adminPasscode || "Enlive0801@#";
    if (settingFooterTagline) settingFooterTagline.value = data.settings.footerTagline || "Investor, builder, and writer based in Lagos.";
    if (settingFooterCopyright) settingFooterCopyright.value = data.settings.footerCopyright || "© 2026 Tobi Lawson. All rights reserved.";
    if (settingFooterLink1Name) settingFooterLink1Name.value = data.settings.footerLink1Name || "1914 Reader";
    if (settingFooterLink1Url) settingFooterLink1Url.value = data.settings.footerLink1Url || "https://www.1914reader.com/";
    if (settingFooterLink2Name) settingFooterLink2Name.value = data.settings.footerLink2Name || "Lagos Urban";
    if (settingFooterLink2Url) settingFooterLink2Url.value = data.settings.footerLink2Url || "http://lagosurban.com";

    // 8. Populate Course Settings & Render Lessons
    const cs = data.courseSettings || INITIAL_DATA.courseSettings;
    const courseStatusTagInput = document.getElementById("courseStatusTagInput");
    const courseTitleInput = document.getElementById("courseTitleInput");
    const courseSubtitleInput = document.getElementById("courseSubtitleInput");
    const courseOverviewProseInput = document.getElementById("courseOverviewProseInput");
    const courseCtaTextInput = document.getElementById("courseCtaTextInput");

    if (courseStatusTagInput) courseStatusTagInput.value = cs.statusTag || "FREE COURSE • COMING SOON";
    if (courseTitleInput) courseTitleInput.value = cs.title || "Artificial Intelligence in Frontier Markets";
    if (courseSubtitleInput) courseSubtitleInput.value = cs.subtitle || "";
    if (courseOverviewProseInput) courseOverviewProseInput.value = cs.overviewProse || "";
    if (courseCtaTextInput) courseCtaTextInput.value = cs.ctaText || "";

    renderCourseLessonsAdminList(data.courseLessons || INITIAL_DATA.courseLessons);
  }

  // Helper: Format Toast for Cloud Save Result
  function notifySaveResult(res, successMsg) {
    if (res && res.success === false) {
      showToast("Saved locally! Supabase Cloud notice: " + (res.error?.message || "Table check needed (Tab 8)"));
    } else {
      showToast(successMsg);
    }
  }

  // 1. Homepage Form Submission
  const homepageForm = document.getElementById("homepageForm");
  if (homepageForm) {
    homepageForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      data.settings.heroTitle = document.getElementById("homeHeroTitle").value.trim();
      data.settings.heroScribbleWord = document.getElementById("homeHeroScribble").value.trim();
      data.settings.heroSubtitle = document.getElementById("homeHeroSubtitle").value.trim();

      const ft = document.getElementById("homeFooterTagline");
      const fc = document.getElementById("homeFooterCopyright");
      const fl1n = document.getElementById("homeFooterLink1Name");
      const fl1u = document.getElementById("homeFooterLink1Url");
      const fl2n = document.getElementById("homeFooterLink2Name");
      const fl2u = document.getElementById("homeFooterLink2Url");

      if (ft) data.settings.footerTagline = ft.value.trim();
      if (fc) data.settings.footerCopyright = fc.value.trim();
      if (fl1n) data.settings.footerLink1Name = fl1n.value.trim();
      if (fl1u) data.settings.footerLink1Url = fl1u.value.trim();
      if (fl2n) data.settings.footerLink2Name = fl2n.value.trim();
      if (fl2u) data.settings.footerLink2Url = fl2u.value.trim();

      data.settings.updatedAt = new Date().toISOString();

      saveLocalSiteData(data);
      const res = await saveSiteSettingsToSupabase(data.settings);
      notifySaveResult(res, "Homepage hero & footer content updated!");
    });
  }

  // 2. Writing Posts Render & Listeners
  function renderPostsList(posts) {
    const postsList = document.getElementById("postsList");
    if (!postsList) return;

    if (!posts || posts.length === 0) {
      postsList.innerHTML = `<div class="meta" style="padding: 2rem 0; color: var(--text-muted);">No published articles found. Click "+ Create New Article" to add one.</div>`;
      return;
    }

    postsList.innerHTML = posts.map((post) => `
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

    postsList.querySelectorAll(".edit-post-btn").forEach((btn) => {
      btn.addEventListener("click", () => openPostModal(btn.getAttribute("data-id")));
    });

    postsList.querySelectorAll(".delete-post-btn").forEach((btn) => {
      btn.addEventListener("click", () => deletePost(btn.getAttribute("data-id")));
    });
  }

  // 3. Now Page Submission
  const nowPageForm = document.getElementById("nowPageForm");
  if (nowPageForm) {
    nowPageForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      data.nowPage.lastUpdated = document.getElementById("nowLastUpdated").value.trim();
      data.nowPage.introSubtitle = document.getElementById("nowIntroSubtitle").value.trim();
      data.nowPage.ongoingProse = document.getElementById("nowOngoingProse").value.trim();
      data.nowPage.updatedAt = new Date().toISOString();

      saveLocalSiteData(data);
      const res = await saveNowPageToSupabase(data.nowPage);
      notifySaveResult(res, '"Now" page updated!');
    });
  }

  // 4. Books Form & Chapters CMS Handler
  function renderBooksList(books) {
    if (!books || books.length === 0) return;
    const b = books[0];
    const bt = document.getElementById("bookTitleInput");
    const bs = document.getElementById("bookSubtitleInput");
    const bst = document.getElementById("bookStatusTagInput");
    const brd = document.getElementById("bookReleaseDateInput");
    const bimg = document.getElementById("bookCoverImageUrlInput");
    const bp1 = document.getElementById("bookSynopsisP1Input");
    const bp2 = document.getElementById("bookSynopsisP2Input");
    const bau = document.getElementById("bookAuthorInput");
    const bfmt = document.getElementById("bookFormatInput");
    const bprv = document.getElementById("bookPreviewUrlInput");

    if (bt) bt.value = b.title || "";
    if (bs) bs.value = b.subtitle || "";
    if (bst) bst.value = b.statusTag || "";
    if (brd) brd.value = b.releaseDate || "";
    if (bimg) bimg.value = b.coverImageUrl || "";
    if (bp1) bp1.value = b.synopsisP1 || "";
    if (bp2) bp2.value = b.synopsisP2 || "";
    if (bau) bau.value = b.author || "Tobi Lawson";
    if (bfmt) bfmt.value = b.format || "Hardcover & Digital";
    if (bprv) bprv.value = b.previewUrl || "";

    renderChaptersAdminList(b.chapters || []);
  }

  const booksForm = document.getElementById("booksForm");
  if (booksForm) {
    booksForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      if (!data.books || data.books.length === 0) {
        data.books = [{ id: "who-made-this", chapters: [] }];
      }
      const b = data.books[0];
      b.title = document.getElementById("bookTitleInput").value.trim();
      b.subtitle = document.getElementById("bookSubtitleInput").value.trim();
      b.statusTag = document.getElementById("bookStatusTagInput").value.trim();
      b.releaseDate = document.getElementById("bookReleaseDateInput").value.trim();
      b.coverImageUrl = document.getElementById("bookCoverImageUrlInput").value.trim();
      b.synopsisP1 = document.getElementById("bookSynopsisP1Input").value.trim();
      b.synopsisP2 = document.getElementById("bookSynopsisP2Input").value.trim();
      b.author = document.getElementById("bookAuthorInput").value.trim();
      b.format = document.getElementById("bookFormatInput").value.trim();
      b.previewUrl = document.getElementById("bookPreviewUrlInput").value.trim();

      data.settings.updatedAt = new Date().toISOString();
      saveLocalSiteData(data);
      const res = await saveBookToSupabase(b);
      notifySaveResult(res, "Book showcase details & cover updated!");
    });
  }

  const bookCoverFileInput = document.getElementById("bookCoverFileInput");
  if (bookCoverFileInput) {
    bookCoverFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const urlInput = document.getElementById("bookCoverImageUrlInput");
        if (urlInput) urlInput.value = evt.target.result;
        showToast("Book cover image attached!");
      };
      reader.readAsDataURL(file);
    });
  }

  function renderChaptersAdminList(chapters) {
    const listEl = document.getElementById("chaptersListAdmin");
    if (!listEl) return;

    if (!chapters || chapters.length === 0) {
      listEl.innerHTML = `<div class="meta" style="padding: 2rem 0; color: var(--text-muted);">No chapters added yet. Click "+ Add Chapter Entry" above.</div>`;
      return;
    }

    listEl.innerHTML = chapters.map((chap, idx) => `
      <div class="admin-grid-item">
        <div class="admin-grid-item-content">
          <span class="admin-badge meta" style="color: var(--accent);">${chap.status || 'Chapter Entry'}</span>
          <h4>${chap.title}</h4>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem;">${chap.desc}</p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-shrink: 0; align-items: center;">
          <button class="admin-btn admin-btn-secondary edit-chapter-btn" data-idx="${idx}">Edit</button>
          <button class="admin-btn admin-btn-danger delete-chapter-btn" data-idx="${idx}">Delete</button>
        </div>
      </div>
    `).join("");

    listEl.querySelectorAll(".edit-chapter-btn").forEach((btn) => {
      btn.addEventListener("click", () => openChapterModal(parseInt(btn.getAttribute("data-idx"))));
    });

    listEl.querySelectorAll(".delete-chapter-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteChapter(parseInt(btn.getAttribute("data-idx"))));
    });
  }

  const chapterModal = document.getElementById("chapterModal");
  const newChapterBtn = document.getElementById("newChapterBtn");
  const closeChapterModalBtn = document.getElementById("closeChapterModalBtn");
  const cancelChapterModalBtn = document.getElementById("cancelChapterModalBtn");
  const chapterForm = document.getElementById("chapterForm");

  if (newChapterBtn) newChapterBtn.addEventListener("click", () => openChapterModal());
  if (closeChapterModalBtn) closeChapterModalBtn.addEventListener("click", () => { if (chapterModal) chapterModal.style.display = "none"; });
  if (cancelChapterModalBtn) cancelChapterModalBtn.addEventListener("click", () => { if (chapterModal) chapterModal.style.display = "none"; });

  async function openChapterModal(idx = null) {
    const data = await getMasterSiteData();
    const chapters = data.books && data.books[0] ? (data.books[0].chapters || []) : [];
    const indexInput = document.getElementById("chapterIndex");
    const titleInput = document.getElementById("chapterTitle");
    const statusInput = document.getElementById("chapterStatus");
    const descInput = document.getElementById("chapterDesc");

    if (idx !== null && chapters[idx]) {
      const c = chapters[idx];
      if (indexInput) indexInput.value = idx;
      if (titleInput) titleInput.value = c.title;
      if (statusInput) statusInput.value = c.status;
      if (descInput) descInput.value = c.desc;
    } else {
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

      const idxVal = document.getElementById("chapterIndex").value;
      const title = document.getElementById("chapterTitle").value.trim();
      const status = document.getElementById("chapterStatus").value.trim();
      const desc = document.getElementById("chapterDesc").value.trim();

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

  // 5. About Form & Image File Upload Listeners
  const aboutImgFileInput = document.getElementById("aboutImgFileInput");
  if (aboutImgFileInput) {
    aboutImgFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        const aboutProfileImage = document.getElementById("aboutProfileImage");
        const aboutImgPreview = document.getElementById("aboutImgPreview");
        if (aboutProfileImage) aboutProfileImage.value = dataUrl;
        if (aboutImgPreview) aboutImgPreview.src = dataUrl;
        showToast("New image uploaded and previewed!");
      };
      reader.readAsDataURL(file);
    });
  }

  const aboutForm = document.getElementById("aboutForm");
  if (aboutForm) {
    aboutForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      data.settings.aboutHeroTitle = document.getElementById("aboutHeroTitle").value.trim();
      data.settings.aboutHeroSubtitle = document.getElementById("aboutHeroSubtitle").value.trim();
      data.settings.aboutBodyProse = document.getElementById("aboutBodyProse").value.trim();
      data.settings.aboutProfileImage = document.getElementById("aboutProfileImage").value.trim();
      data.settings.updatedAt = new Date().toISOString();

      saveLocalSiteData(data);
      const res = await saveSiteSettingsToSupabase(data.settings);
      notifySaveResult(res, "About page content & photo updated!");
    });
  }

  // 6. Projects Render & Modal Listeners
  function renderProjectsList(projects) {
    const projectsList = document.getElementById("projectsList");
    if (!projectsList) return;

    projectsList.innerHTML = (projects || []).map((proj) => `
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

    projectsList.querySelectorAll(".delete-project-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteProject(btn.getAttribute("data-id")));
    });
  }

  // Modal Handlers for Articles
  const postModal = document.getElementById("postModal");
  const newPostBtn = document.getElementById("newPostBtn");
  const closePostModalBtn = document.getElementById("closePostModalBtn");
  const cancelPostModalBtn = document.getElementById("cancelPostModalBtn");
  const postForm = document.getElementById("postForm");

  if (newPostBtn) newPostBtn.addEventListener("click", () => openPostModal());
  if (closePostModalBtn) closePostModalBtn.addEventListener("click", closePostModal);
  if (cancelPostModalBtn) cancelPostModalBtn.addEventListener("click", closePostModal);

  async function openPostModal(postId = null) {
    const data = await getMasterSiteData();
    const modalTitle = document.getElementById("postModalTitle");
    const idInput = document.getElementById("postId");
    const titleInput = document.getElementById("postTitle");
    const typeInput = document.getElementById("postType");
    const dateInput = document.getElementById("postDate");
    const summaryInput = document.getElementById("postSummary");
    const urlInput = document.getElementById("postUrl");

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
      const idInput = document.getElementById("postId").value;
      const title = document.getElementById("postTitle").value.trim();
      const category = document.getElementById("postType").value;
      const date = document.getElementById("postDate").value.trim();
      const summary = document.getElementById("postSummary").value.trim();
      const url = document.getElementById("postUrl").value.trim();

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
  const projectModal = document.getElementById("projectModal");
  const newProjectBtn = document.getElementById("newProjectBtn");
  const closeProjectModalBtn = document.getElementById("closeProjectModalBtn");
  const cancelProjectModalBtn = document.getElementById("cancelProjectModalBtn");
  const projectForm = document.getElementById("projectForm");

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
      const title = document.getElementById("projectTitle").value.trim();
      const roleTag = document.getElementById("projectRoleTag").value.trim();
      const status = document.getElementById("projectStatus").value.trim();
      const description = document.getElementById("projectDesc").value.trim();
      const link = document.getElementById("projectLink").value.trim();

      const newProj = {
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title,
        roleTag,
        status,
        description,
        link
      };

      if (!data.projects) data.projects = [];
      data.projects.push(newProj);
      data.settings.updatedAt = new Date().toISOString();
      saveLocalSiteData(data);
      const res = await saveProjectToSupabase(newProj);

      if (projectModal) projectModal.style.display = "none";
      await renderConsoleData();
      notifySaveResult(res, "New project added!");
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

  // 7. Global Settings & Footer Submission
  const settingsForm = document.getElementById("settingsForm");
  if (settingsForm) {
    settingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      data.settings.siteTitle = document.getElementById("settingSiteTitle").value.trim();
      data.settings.contactEmail = document.getElementById("settingContactEmail").value.trim();
      data.settings.adminPasscode = document.getElementById("settingAdminPasscode").value.trim();
      data.settings.footerTagline = document.getElementById("settingFooterTagline").value.trim();
      data.settings.footerCopyright = document.getElementById("settingFooterCopyright").value.trim();
      data.settings.footerLink1Name = document.getElementById("settingFooterLink1Name").value.trim();
      data.settings.footerLink1Url = document.getElementById("settingFooterLink1Url").value.trim();
      data.settings.footerLink2Name = document.getElementById("settingFooterLink2Name").value.trim();
      data.settings.footerLink2Url = document.getElementById("settingFooterLink2Url").value.trim();
      data.settings.updatedAt = new Date().toISOString();

      saveLocalSiteData(data);
      const res = await saveSiteSettingsToSupabase(data.settings);
      notifySaveResult(res, "Global site settings & footer updated!");
    });
  }

  // 8. Course CMS Settings Submission & Lesson Modal Handlers
  const courseSettingsForm = document.getElementById("courseSettingsForm");
  if (courseSettingsForm) {
    courseSettingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      if (!data.courseSettings) data.courseSettings = {};

      data.courseSettings.statusTag = document.getElementById("courseStatusTagInput").value.trim();
      data.courseSettings.title = document.getElementById("courseTitleInput").value.trim();
      data.courseSettings.subtitle = document.getElementById("courseSubtitleInput").value.trim();
      data.courseSettings.overviewProse = document.getElementById("courseOverviewProseInput").value.trim();
      data.courseSettings.ctaText = document.getElementById("courseCtaTextInput").value.trim();
      data.courseSettings.updatedAt = new Date().toISOString();

      saveLocalSiteData(data);
      const res = await saveCourseSettingsToSupabase(data.courseSettings);
      notifySaveResult(res, "Course settings updated!");
    });
  }

  function renderCourseLessonsAdminList(lessons) {
    const listEl = document.getElementById("courseLessonsAdminList");
    if (!listEl) return;

    if (!lessons || lessons.length === 0) {
      listEl.innerHTML = `<div class="meta" style="padding: 2rem 0; color: var(--text-muted);">No lessons or video modules created yet. Click "+ Add Lesson / Video Module" above to add one.</div>`;
      return;
    }

    listEl.innerHTML = lessons.map((l) => `
      <div class="admin-grid-item">
        <div class="admin-grid-item-content">
          <div>
            <span class="admin-badge meta">${l.moduleNumber || 'MODULE 01'}</span>
            <span class="meta" style="color: var(--text-muted);">${l.status || 'Published'}</span>
            <span class="meta" style="color: var(--accent); margin-left: 0.5rem;">${l.videoType === 'youtube' ? '▶ YouTube Video' : l.videoType === 'upload' ? '📹 Direct Video' : '📄 Text Lecture'}</span>
          </div>
          <h4>${l.title}</h4>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem;">${l.summary}</p>
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
  const lessonModal = document.getElementById("lessonModal");
  const newLessonBtn = document.getElementById("newLessonBtn");
  const closeLessonModalBtn = document.getElementById("closeLessonModalBtn");
  const cancelLessonModalBtn = document.getElementById("cancelLessonModalBtn");
  const lessonForm = document.getElementById("lessonForm");
  const lessonVideoType = document.getElementById("lessonVideoType");
  const youtubeGroup = document.getElementById("youtubeGroup");
  const uploadGroup = document.getElementById("uploadGroup");
  const lessonVideoFileInput = document.getElementById("lessonVideoFileInput");
  const lessonVideoFileName = document.getElementById("lessonVideoFileName");
  const lessonVideoPreview = document.getElementById("lessonVideoPreview");

  if (newLessonBtn) newLessonBtn.addEventListener("click", () => openLessonModal());
  if (closeLessonModalBtn) closeLessonModalBtn.addEventListener("click", closeLessonModal);
  if (cancelLessonModalBtn) cancelLessonModalBtn.addEventListener("click", closeLessonModal);

  if (lessonVideoType) {
    lessonVideoType.addEventListener("change", () => {
      const type = lessonVideoType.value;
      if (type === "youtube") {
        if (youtubeGroup) youtubeGroup.style.display = "block";
        if (uploadGroup) uploadGroup.style.display = "none";
      } else if (type === "upload") {
        if (youtubeGroup) youtubeGroup.style.display = "none";
        if (uploadGroup) uploadGroup.style.display = "block";
      } else {
        if (youtubeGroup) youtubeGroup.style.display = "none";
        if (uploadGroup) uploadGroup.style.display = "none";
      }
    });
  }

  if (lessonVideoFileInput) {
    lessonVideoFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (lessonVideoFileName) lessonVideoFileName.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const videoDataUrl = evt.target.result;
        const lessonVideoUrl = document.getElementById("lessonVideoUrl");
        if (lessonVideoUrl) lessonVideoUrl.value = videoDataUrl;
        if (lessonVideoPreview) {
          lessonVideoPreview.src = videoDataUrl;
          lessonVideoPreview.style.display = "block";
        }
        showToast("Video file attached and preview ready!");
      };
      reader.readAsDataURL(file);
    });
  }

  async function openLessonModal(lessonId = null) {
    const data = await getMasterSiteData();
    const modalTitle = document.getElementById("lessonModalTitle");
    const idInput = document.getElementById("lessonId");
    const moduleInput = document.getElementById("lessonModuleNumber");
    const statusInput = document.getElementById("lessonStatus");
    const titleInput = document.getElementById("lessonTitle");
    const summaryInput = document.getElementById("lessonSummary");
    const textInput = document.getElementById("lessonTextContent");
    const videoTypeSelect = document.getElementById("lessonVideoType");
    const videoUrlInput = document.getElementById("lessonVideoUrl");

    if (lessonId && data.courseLessons) {
      const existing = data.courseLessons.find((l) => l.id === lessonId);
      if (existing) {
        if (modalTitle) modalTitle.textContent = "Edit Lesson / Module";
        if (idInput) idInput.value = existing.id;
        if (moduleInput) moduleInput.value = existing.moduleNumber || "MODULE 01";
        if (statusInput) statusInput.value = existing.status || "Published";
        if (titleInput) titleInput.value = existing.title;
        if (summaryInput) summaryInput.value = existing.summary;
        if (textInput) textInput.value = existing.textContent || "";
        if (videoTypeSelect) videoTypeSelect.value = existing.videoType || "none";
        if (videoUrlInput) videoUrlInput.value = existing.videoUrl || "";

        if (existing.videoType === "upload" && existing.videoUrl && lessonVideoPreview) {
          lessonVideoPreview.src = existing.videoUrl;
          lessonVideoPreview.style.display = "block";
        } else if (lessonVideoPreview) {
          lessonVideoPreview.style.display = "none";
        }
      }
    } else {
      if (modalTitle) modalTitle.textContent = "Create Lesson / Module";
      if (lessonForm) lessonForm.reset();
      if (idInput) idInput.value = "";
      if (lessonVideoPreview) lessonVideoPreview.style.display = "none";
      if (lessonVideoFileName) lessonVideoFileName.textContent = "No file selected";
    }

    if (lessonVideoType) lessonVideoType.dispatchEvent(new Event("change"));
    if (lessonModal) lessonModal.style.display = "flex";
  }

  function closeLessonModal() {
    if (lessonModal) lessonModal.style.display = "none";
  }

  if (lessonForm) {
    lessonForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      const idInput = document.getElementById("lessonId").value;
      const moduleNumber = document.getElementById("lessonModuleNumber").value.trim();
      const status = document.getElementById("lessonStatus").value;
      const title = document.getElementById("lessonTitle").value.trim();
      const summary = document.getElementById("lessonSummary").value.trim();
      const textContent = document.getElementById("lessonTextContent").value.trim();
      const videoType = document.getElementById("lessonVideoType").value;
      const videoUrl = document.getElementById("lessonVideoUrl").value.trim();

      const lessonData = {
        id: idInput || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        moduleNumber,
        status,
        title,
        summary,
        textContent,
        videoType,
        videoUrl
      };

      if (!data.courseLessons) data.courseLessons = [];

      if (idInput) {
        const idx = data.courseLessons.findIndex((l) => l.id === idInput);
        if (idx !== -1) data.courseLessons[idx] = lessonData;
      } else {
        data.courseLessons.push(lessonData);
      }

      data.settings.updatedAt = new Date().toISOString();
      saveLocalSiteData(data);
      const res = await saveCourseLessonToSupabase(lessonData);
      closeLessonModal();
      await renderConsoleData();
      notifySaveResult(res, idInput ? "Lesson updated successfully." : "New lesson module added!");
    });
  }

  async function deleteLesson(lessonId) {
    if (!confirm("Are you sure you want to delete this lesson module?")) return;
    const data = await getMasterSiteData();
    data.courseLessons = (data.courseLessons || []).filter((l) => l.id !== lessonId);
    data.settings.updatedAt = new Date().toISOString();
    saveLocalSiteData(data);
    const res = await deleteCourseLessonFromSupabase(lessonId);
    await renderConsoleData();
    notifySaveResult(res, "Lesson deleted.");
  }

  // 9. Supabase Seeding & Backup Handlers
  const seedSupabaseBtn = document.getElementById("seedSupabaseBtn");
  const exportJsonBtn = document.getElementById("exportJsonBtn");
  const importJsonInput = document.getElementById("importJsonInput");
  const resetDefaultsBtn = document.getElementById("resetDefaultsBtn");

  if (seedSupabaseBtn) {
    seedSupabaseBtn.addEventListener("click", async () => {
      const data = getLocalSiteData();
      showToast("Pushing local data snapshot to Supabase Cloud...");
      const res = await seedInitialDataToSupabase(data);
      if (res && res.success === false) {
        showToast("Supabase Notice: " + (res.error?.message || "Failed to seed tables. Run SQL schema in Supabase."));
      } else {
        showToast("Supabase Cloud database seeded successfully!");
      }
    });
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", async () => {
      const data = await getMasterSiteData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tobi-lawson-site-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Database snapshot exported successfully.");
    });
  }

  if (importJsonInput) {
    importJsonInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const imported = JSON.parse(evt.target.result);
          if (imported && imported.settings && imported.posts) {
            saveLocalSiteData(imported);
            await seedInitialDataToSupabase(imported);
            await renderConsoleData();
            showToast("Database snapshot imported and pushed to Supabase Cloud.");
          } else {
            alert("Invalid backup file format.");
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
