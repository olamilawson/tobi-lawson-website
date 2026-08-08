/**
 * Tobi Lawson — Personal Website & Editorial Admin Console
 * State Manager & Realtime Sync Engine
 */

const STORAGE_KEY = "tobi_site_data_v1";
const AUTH_KEY = "tobi_admin_authenticated";

// Factory Defaults (Matches Tobi Lawson's website)
const INITIAL_DATA = {
  settings: {
    siteTitle: "Tobi Lawson",
    heroTitle: "Building and investing with purpose.",
    heroSubtitle: "Notes on capital, cities, and the slow work of building things that last. Based in Lagos, working across fintech, SME services, and education technology.",
    contactEmail: "olamilawson@gmail.com",
    adminPasscode: "tobi2026"
  },
  nowPage: {
    lastUpdated: "July 2026",
    introSubtitle: "A running account of the projects I'm building, updated as things move. Last updated July 2026.",
    ongoingProse: "I run and invest in companies across fintech, SME services technology, product development, and education technology. Some are early-stage, some are further along. I share specifics and case studies here as each venture is ready to talk about publicly."
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
      title: "Who Made This?",
      subtitle: "A History of Building and Craftsmanship in West Africa",
      status: "Monograph Showcase",
      summary: "An exploration of trade networks, master guilds, and architectural heritage from pre-colonial Lagos to modern West African cities.",
      url: "books/who-made-this-preview.html"
    }
  ]
};

// Data Helper Functions
export function getSiteData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading site data from LocalStorage:", e);
    return INITIAL_DATA;
  }
}

export function saveSiteData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Dispatch custom event for live tab sync
    window.dispatchEvent(new Event("tobi_site_data_updated"));
  } catch (e) {
    console.error("Error saving site data to LocalStorage:", e);
  }
}

// UI State Controller
document.addEventListener("DOMContentLoaded", () => {
  const authOverlay = document.getElementById("authOverlay");
  const authForm = document.getElementById("authForm");
  const passcodeInput = document.getElementById("passcodeInput");
  const authError = document.getElementById("authError");
  const adminConsole = document.getElementById("adminConsole");
  const logoutBtn = document.getElementById("logoutBtn");

  // Check Session Auth
  const isAuth = sessionStorage.getItem(AUTH_KEY) === "true";
  if (isAuth) {
    showConsole();
  }

  // Handle Authentication Submission
  if (authForm) {
    authForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const currentData = getSiteData();
      const expectedPasscode = currentData.settings.adminPasscode || "tobi2026";
      
      if (passcodeInput.value.trim() === expectedPasscode) {
        sessionStorage.setItem(AUTH_KEY, "true");
        if (authError) authError.style.display = "none";
        showConsole();
        showToast("Authenticated successfully. Welcome back, Tobi!");
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

  function showConsole() {
    if (authOverlay) authOverlay.style.display = "none";
    if (adminConsole) adminConsole.style.display = "block";
    renderConsoleData();
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
  function renderConsoleData() {
    const data = getSiteData();

    // 1. Render Posts List
    renderPostsList(data.posts);

    // 2. Populate Now Page Form
    const nowLastUpdated = document.getElementById("nowLastUpdated");
    const nowIntroSubtitle = document.getElementById("nowIntroSubtitle");
    const nowOngoingProse = document.getElementById("nowOngoingProse");

    if (nowLastUpdated) nowLastUpdated.value = data.nowPage.lastUpdated || "";
    if (nowIntroSubtitle) nowIntroSubtitle.value = data.nowPage.introSubtitle || "";
    if (nowOngoingProse) nowOngoingProse.value = data.nowPage.ongoingProse || "";

    // 3. Render Books List
    renderBooksList(data.books);

    // 4. Render Projects List
    renderProjectsList(data.projects);

    // 5. Populate Settings Form
    const settingSiteTitle = document.getElementById("settingSiteTitle");
    const settingHeroSubtitle = document.getElementById("settingHeroSubtitle");
    const settingContactEmail = document.getElementById("settingContactEmail");
    const settingAdminPasscode = document.getElementById("settingAdminPasscode");

    if (settingSiteTitle) settingSiteTitle.value = data.settings.siteTitle || "";
    if (settingHeroSubtitle) settingHeroSubtitle.value = data.settings.heroSubtitle || "";
    if (settingContactEmail) settingContactEmail.value = data.settings.contactEmail || "";
    if (settingAdminPasscode) settingAdminPasscode.value = data.settings.adminPasscode || "tobi2026";
  }

  // Render Writing Posts
  function renderPostsList(posts) {
    const postsList = document.getElementById("postsList");
    if (!postsList) return;

    if (!posts || posts.length === 0) {
      postsList.innerHTML = `<div class="meta" style="padding: 2rem 0; color: var(--text-muted);">No published posts found. Click "+ Create New Post" above to add one.</div>`;
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

    // Attach Edit & Delete Listeners
    postsList.querySelectorAll(".edit-post-btn").forEach((btn) => {
      btn.addEventListener("click", () => openPostModal(btn.getAttribute("data-id")));
    });

    postsList.querySelectorAll(".delete-post-btn").forEach((btn) => {
      btn.addEventListener("click", () => deletePost(btn.getAttribute("data-id")));
    });
  }

  // Render Books
  function renderBooksList(books) {
    const booksList = document.getElementById("booksList");
    if (!booksList) return;

    booksList.innerHTML = (books || []).map((book) => `
      <div class="admin-grid-item">
        <div class="admin-grid-item-content">
          <span class="admin-badge meta">${book.status || 'Book'}</span>
          <h4>${book.title}</h4>
          <p style="font-style: italic; color: var(--text-muted);">${book.subtitle || ''}</p>
          <p style="margin-top: 0.5rem; font-size: 0.95rem;">${book.summary}</p>
        </div>
        <div class="meta" style="color: var(--text-muted);">${book.url}</div>
      </div>
    `).join("");
  }

  // Render Projects
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
        <a href="${proj.link}" target="_blank" class="meta" style="color: var(--text-muted); flex-shrink: 0;">${proj.link} ↗</a>
      </div>
    `).join("");
  }

  // Modal Controllers for Articles
  const postModal = document.getElementById("postModal");
  const newPostBtn = document.getElementById("newPostBtn");
  const closePostModalBtn = document.getElementById("closePostModalBtn");
  const cancelPostModalBtn = document.getElementById("cancelPostModalBtn");
  const postForm = document.getElementById("postForm");

  if (newPostBtn) {
    newPostBtn.addEventListener("click", () => openPostModal());
  }

  if (closePostModalBtn) closePostModalBtn.addEventListener("click", closePostModal);
  if (cancelPostModalBtn) cancelPostModalBtn.addEventListener("click", closePostModal);

  function openPostModal(postId = null) {
    const data = getSiteData();
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
    postForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = getSiteData();
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
        // Edit existing
        const idx = data.posts.findIndex((p) => p.id === idInput);
        if (idx !== -1) data.posts[idx] = newPost;
      } else {
        // Add new to top
        data.posts.unshift(newPost);
      }

      saveSiteData(data);
      closePostModal();
      renderConsoleData();
      showToast(idInput ? "Article updated successfully." : "New article published successfully.");
    });
  }

  function deletePost(postId) {
    if (!confirm("Are you sure you want to delete this article?")) return;
    const data = getSiteData();
    data.posts = data.posts.filter((p) => p.id !== postId);
    saveSiteData(data);
    renderConsoleData();
    showToast("Article deleted.");
  }

  // Now Page Form Listener
  const nowPageForm = document.getElementById("nowPageForm");
  if (nowPageForm) {
    nowPageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = getSiteData();
      data.nowPage.lastUpdated = document.getElementById("nowLastUpdated").value.trim();
      data.nowPage.introSubtitle = document.getElementById("nowIntroSubtitle").value.trim();
      data.nowPage.ongoingProse = document.getElementById("nowOngoingProse").value.trim();

      saveSiteData(data);
      showToast('"Now" page updated successfully.');
    });
  }

  // Settings Form Listener
  const settingsForm = document.getElementById("settingsForm");
  if (settingsForm) {
    settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = getSiteData();
      data.settings.siteTitle = document.getElementById("settingSiteTitle").value.trim();
      data.settings.heroSubtitle = document.getElementById("settingHeroSubtitle").value.trim();
      data.settings.contactEmail = document.getElementById("settingContactEmail").value.trim();
      data.settings.adminPasscode = document.getElementById("settingAdminPasscode").value.trim();

      saveSiteData(data);
      showToast("Global site settings updated.");
    });
  }

  // Backup Export & Import Handlers
  const exportJsonBtn = document.getElementById("exportJsonBtn");
  const importJsonInput = document.getElementById("importJsonInput");
  const resetDefaultsBtn = document.getElementById("resetDefaultsBtn");

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", () => {
      const data = getSiteData();
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
      reader.onload = (evt) => {
        try {
          const imported = JSON.parse(evt.target.result);
          if (imported && imported.settings && imported.posts) {
            saveSiteData(imported);
            renderConsoleData();
            showToast("Database snapshot imported successfully.");
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
    resetDefaultsBtn.addEventListener("click", () => {
      if (confirm("Reset all content to factory defaults? This will erase custom edits.")) {
        saveSiteData(INITIAL_DATA);
        renderConsoleData();
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
