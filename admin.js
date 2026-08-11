/**
 * Tobi Lawson — Personal Website & Editorial Admin Console
 * Full 1-to-1 Site Management & Supabase Sync Engine
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
  seedInitialDataToSupabase,
  subscribeToSupabaseRealtime
} from "./supabase.js";

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
    aboutProfileImage: "./assets/tobi-lawson.jpg",
    contactEmail: "olamilawson@gmail.com",
    adminPasscode: "Enlive0801@#",
    updatedAt: new Date().toISOString()
  },
  nowPage: {
    lastUpdated: "July 2026",
    heroTitle: "What I'm spending time on",
    introSubtitle: "A running account of the projects I'm building, updated as things move. Last updated July 2026.",
    ongoingProse: "I run and invest in companies across fintech, SME services technology, product development, and education technology. Some are early-stage, some are further along. I share specifics and case studies here as each venture is ready to talk about publicly.",
    updatedAt: new Date().toISOString()
  },
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
    const [cloudSettings, cloudNow, cloudPosts, cloudProjects, cloudBooks] = await Promise.all([
      syncSiteSettingsFromSupabase(),
      syncNowPageFromSupabase(),
      syncPostsFromSupabase(),
      syncProjectsFromSupabase(),
      syncBooksFromSupabase()
    ]);

    const localSettingsTs = local?.settings?.updatedAt ? new Date(local.settings.updatedAt).getTime() : 0;
    const cloudSettingsTs = cloudSettings?.updatedAt ? new Date(cloudSettings.updatedAt).getTime() : 0;

    let mergedSettings = cloudSettings || (local ? local.settings : null);
    if (localSettingsTs > cloudSettingsTs && local?.settings) {
      mergedSettings = local.settings;
      saveSiteSettingsToSupabase(local.settings);
    }

    const merged = {
      settings: mergedSettings,
      nowPage: cloudNow || local.nowPage,
      posts: (cloudPosts && cloudPosts.length > 0) ? cloudPosts : local.posts,
      projects: (cloudProjects && cloudProjects.length > 0) ? cloudProjects : local.projects,
      books: (cloudBooks && cloudBooks.length > 0) ? cloudBooks : local.books
    };

    saveLocalSiteData(merged);
    return merged;
  } catch (e) {
    console.warn("Falling back to local site data:", e);
    return local;
  }
}

// UI State Controller
document.addEventListener("DOMContentLoaded", async () => {
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
        enteredPasscode === "tobi2026" ||
        (configuredPasscode && enteredPasscode === configuredPasscode)
      );

      if (isValid) {
        sessionStorage.setItem(AUTH_KEY, "true");
        if (authError) authError.style.display = "none";

        if (!configuredPasscode || configuredPasscode === "tobi2026") {
          currentData.settings.adminPasscode = "Enlive0801@#";
          currentData.settings.updatedAt = new Date().toISOString();
          saveLocalSiteData(currentData);
          await saveSiteSettingsToSupabase(currentData.settings);
        }

        await showConsole();
        showToast("Authenticated successfully. Welcome to your 1-to-1 site editor!");
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

    if (homeHeroTitle) homeHeroTitle.value = data.settings.heroTitle || "";
    if (homeHeroScribble) homeHeroScribble.value = data.settings.heroScribbleWord || "purpose.";
    if (homeHeroSubtitle) homeHeroSubtitle.value = data.settings.heroSubtitle || "";

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

    // 7. Populate Settings Form
    const settingSiteTitle = document.getElementById("settingSiteTitle");
    const settingContactEmail = document.getElementById("settingContactEmail");
    const settingAdminPasscode = document.getElementById("settingAdminPasscode");

    if (settingSiteTitle) settingSiteTitle.value = data.settings.siteTitle || "";
    if (settingContactEmail) settingContactEmail.value = data.settings.contactEmail || "olamilawson@gmail.com";
    if (settingAdminPasscode) settingAdminPasscode.value = data.settings.adminPasscode || "Enlive0801@#";
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
      data.settings.updatedAt = new Date().toISOString();

      saveLocalSiteData(data);
      const res = await saveSiteSettingsToSupabase(data.settings);
      notifySaveResult(res, "Homepage hero updated 1-to-1!");
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
      notifySaveResult(res, '"Now" page updated 1-to-1!');
    });
  }

  // 4. Books Render
  function renderBooksList(books) {
    const booksList = document.getElementById("booksList");
    if (!booksList) return;

    booksList.innerHTML = (books || []).map((book) => `
      <div class="admin-grid-item">
        <div class="admin-grid-item-content">
          <span class="admin-badge meta">${book.statusTag || 'FORTHCOMING VOLUME'}</span>
          <h4>${book.title}</h4>
          <p style="font-style: italic; color: var(--text-muted);">${book.subtitle || ''}</p>
          <p style="margin-top: 0.5rem; font-size: 0.95rem;">${book.synopsisP1 || book.summary || ''}</p>
        </div>
        <div class="meta" style="color: var(--text-muted); flex-shrink: 0;">${book.previewUrl}</div>
      </div>
    `).join("");
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
      notifySaveResult(res, "About page content & photo updated 1-to-1!");
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
    data.posts = data.posts.filter((p) => p.id !== postId);
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
    data.projects = data.projects.filter((p) => p.id !== projId);
    data.settings.updatedAt = new Date().toISOString();
    saveLocalSiteData(data);
    const res = await deleteProjectFromSupabase(projId);
    await renderConsoleData();
    notifySaveResult(res, "Project removed.");
  }

  // 7. Global Settings Submission
  const settingsForm = document.getElementById("settingsForm");
  if (settingsForm) {
    settingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = await getMasterSiteData();
      data.settings.siteTitle = document.getElementById("settingSiteTitle").value.trim();
      data.settings.contactEmail = document.getElementById("settingContactEmail").value.trim();
      data.settings.adminPasscode = document.getElementById("settingAdminPasscode").value.trim();
      data.settings.updatedAt = new Date().toISOString();

      saveLocalSiteData(data);
      const res = await saveSiteSettingsToSupabase(data.settings);
      notifySaveResult(res, "Global site settings & admin passcode updated.");
    });
  }

  // 8. Supabase Seeding & Backup Handlers
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
        showToast("Site data reset to factory defaults.");
      }
    });
  }
});

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
