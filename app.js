import {
  isSupabaseConfigured,
  syncSiteSettingsFromSupabase,
  syncPostsFromSupabase,
  syncProjectsFromSupabase,
  syncNowPageFromSupabase,
  syncBooksFromSupabase,
  subscribeToSupabaseRealtime
} from "./supabase.js";

const STORAGE_KEY = "tobi_site_data_v1";

// Local Storage Helper
function getLocalSiteData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// Master Fetch Strategy: Merges Supabase Cloud with Local Edits
async function fetchMasterData() {
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

    // Prefer local settings if user just edited in admin on this device
    let mergedSettings = cloudSettings || (local ? local.settings : null);
    if (local?.settings && localSettingsTs >= cloudSettingsTs) {
      mergedSettings = local.settings;
    }

    const merged = {
      settings: mergedSettings,
      nowPage: cloudNow || local?.nowPage,
      posts: (cloudPosts && cloudPosts.length > 0) ? cloudPosts : local?.posts,
      projects: (cloudProjects && cloudProjects.length > 0) ? cloudProjects : local?.projects,
      books: (cloudBooks && cloudBooks.length > 0) ? cloudBooks : local?.books
    };

    return merged;
  } catch (e) {
    console.warn("Using local cache for page render:", e);
    return local;
  }
}

// 1-to-1 Page Hydrator (DOM-Element-Driven)
async function hydratePage() {
  const data = await fetchMasterData();
  if (!data) return;

  const currentPath = window.location.pathname;

  // 1. Hydrate Navigation & Brand across all pages
  if (data.settings) {
    if (data.settings.siteTitle) {
      document.querySelectorAll(".meta-brand").forEach(el => {
        if (!el.textContent.includes("[1-to-1")) {
          el.textContent = data.settings.siteTitle;
        }
      });
    }

    if (data.settings.contactEmail) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        link.href = `mailto:${data.settings.contactEmail}`;
      });
    }
  }

  // 2. Hydrate Homepage (Presence of #projects or #writing on index.html)
  const isHomepage = document.querySelector("#projects") || document.querySelector(".highlight-wrapper");
  if (isHomepage) {
    if (data.settings) {
      const heroH1 = document.querySelector(".hero h1");
      if (heroH1 && data.settings.heroTitle) {
        const titleText = data.settings.heroTitle;
        const scribbleWord = data.settings.heroScribbleWord || "purpose.";
        
        if (titleText.includes(scribbleWord)) {
          const parts = titleText.split(scribbleWord);
          heroH1.innerHTML = `${parts[0]} <span class="highlight-wrapper">${scribbleWord} <svg class="scribble" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true"><path d="M 15,40 C 20,15 50,5 100,5 C 160,5 190,20 185,50 C 180,75 140,78 90,75 C 40,72 5,55 10,35 C 15,20 40,12 80,15"></path></svg></span> ${parts[1] || ''}`;
        } else {
          heroH1.textContent = titleText;
        }
      }

      const heroSubtitle = document.querySelector(".hero-subtitle");
      if (heroSubtitle && data.settings.heroSubtitle) {
        heroSubtitle.textContent = data.settings.heroSubtitle;
      }
    }

    // Projects Section
    if (data.projects && data.projects.length > 0) {
      const projectsGrid = document.querySelector("#projects .grid-3");
      if (projectsGrid) {
        projectsGrid.innerHTML = data.projects.map((proj, idx) => `
          <article class="grid-item fade-up delay-${(idx % 3) + 1}">
            <a href="${proj.link}" target="_blank" rel="noopener noreferrer">
              <div class="grid-item-header">
                <h3>${proj.title}</h3>
                <div class="meta">${proj.roleTag}</div>
              </div>
              <div class="grid-item-cover">
                <span class="meta" style="font-size:1.1rem; text-align:center;">${proj.title.toUpperCase()}</span>
              </div>
            </a>
            <p class="grid-item-desc">${proj.description}</p>
            <a class="grid-item-link" href="${proj.link}" target="_blank" rel="noopener noreferrer">Visit ${proj.link.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗</a>
          </article>
        `).join("");
      }
    }

    // Recent Writing Section
    if (data.posts && data.posts.length > 0) {
      const writingGrid = document.querySelector("#writing .grid-3");
      if (writingGrid) {
        writingGrid.innerHTML = data.posts.slice(0, 3).map((post, idx) => `
          <article class="grid-item fade-up delay-${(idx % 3) + 1}">
            <a href="${post.url}">
              <div class="grid-item-header">
                <h3>${post.title}</h3>
                <div class="meta">${post.category || 'Essay'} / ${post.date || ''}</div>
              </div>
              <p class="grid-item-desc">${post.summary}</p>
              <span class="grid-item-link">Read ${post.category || 'Essay'} →</span>
            </a>
          </article>
        `).join("");
      }
    }
  }

  // 3. Hydrate About Page (Presence of #aboutProfileImg or about.html route)
  const isAboutPage = document.getElementById("aboutProfileImg") || currentPath.includes("about");
  if (isAboutPage) {
    if (data.settings) {
      const aboutH1 = document.querySelector(".hero h1");
      if (aboutH1 && data.settings.aboutHeroTitle) {
        aboutH1.textContent = data.settings.aboutHeroTitle;
      }

      const aboutSub = document.querySelector(".hero-subtitle");
      if (aboutSub && data.settings.aboutHeroSubtitle) {
        aboutSub.textContent = data.settings.aboutHeroSubtitle;
      }

      const aboutImg = document.getElementById("aboutProfileImg");
      if (aboutImg && data.settings.aboutProfileImage) {
        aboutImg.src = data.settings.aboutProfileImage;
      }

      const aboutProse = document.querySelector(".article-body");
      if (aboutProse && data.settings.aboutBodyProse) {
        const paragraphs = data.settings.aboutBodyProse.split("\n\n");
        aboutProse.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join("");
      }
    }
  }

  // 4. Hydrate Writing Catalog (Presence of #writing-catalog or writing route)
  const isWritingPage = document.getElementById("writing-catalog") || currentPath.includes("writing");
  if (isWritingPage && !isHomepage) {
    if (data.posts && data.posts.length > 0) {
      const catalogGrid = document.querySelector("#writing-catalog .grid-3");
      if (catalogGrid) {
        catalogGrid.innerHTML = data.posts.map((post, idx) => `
          <article class="grid-item fade-up delay-${(idx % 3) + 1}">
            <a href="${post.url.replace(/^writing\//, '')}">
              <div class="grid-item-header">
                <h3>${post.title}</h3>
                <div class="meta">${post.category || 'Essay'} / ${post.date || ''}</div>
              </div>
              <p class="grid-item-desc">${post.summary}</p>
              <span class="grid-item-link">Read ${post.category || 'Essay'} →</span>
            </a>
          </article>
        `).join("");
      }
    }
  }

  // 5. Hydrate "Now" Page (Presence of #now-grid or now route)
  const isNowPage = document.getElementById("now-grid") || currentPath.includes("now");
  if (isNowPage) {
    if (data.nowPage) {
      const nowSub = document.querySelector(".hero-subtitle");
      if (nowSub && data.nowPage.introSubtitle) {
        nowSub.textContent = data.nowPage.introSubtitle;
      }

      const nowProse = document.querySelector("#now-grid .article-body");
      if (nowProse && data.nowPage.ongoingProse) {
        nowProse.innerHTML = `<p>${data.nowPage.ongoingProse}</p>`;
      }
    }

    if (data.projects && data.projects.length > 0) {
      const nowProjectsGrid = document.querySelector("#now-grid .grid-3");
      if (nowProjectsGrid) {
        nowProjectsGrid.innerHTML = data.projects.map((proj) => `
          <article class="grid-item">
            <div class="grid-item-header">
              <h3>${proj.title}</h3>
              <div class="meta">${proj.status || 'Active'} · ${proj.roleTag}</div>
            </div>
            <p class="grid-item-desc">${proj.description}</p>
            <a class="grid-item-link" href="${proj.link}" target="_blank" rel="noopener noreferrer">Visit ${proj.link.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗</a>
          </article>
        `).join("");
      }
    }
  }

  // 6. Hydrate Books Page (Presence of #table-of-contents or books route)
  const isBooksPage = document.getElementById("table-of-contents") || currentPath.includes("books");
  if (isBooksPage) {
    if (data.books && data.books.length > 0) {
      const flagshipBook = data.books[0];
      if (flagshipBook) {
        const titleEl = document.querySelector(".book-title");
        if (titleEl && flagshipBook.title) titleEl.textContent = flagshipBook.title;

        const subEl = document.querySelector(".book-subtitle");
        if (subEl && flagshipBook.subtitle) subEl.textContent = flagshipBook.subtitle;

        const tagEl = document.querySelector(".book-status-tag .meta");
        if (tagEl && flagshipBook.statusTag) tagEl.textContent = flagshipBook.statusTag;

        const synEls = document.querySelectorAll(".book-synopsis");
        if (synEls.length >= 2) {
          if (flagshipBook.synopsisP1) synEls[0].textContent = flagshipBook.synopsisP1;
          if (flagshipBook.synopsisP2) synEls[1].textContent = flagshipBook.synopsisP2;
        }

        // Chapters Table of Contents
        if (flagshipBook.chapters && flagshipBook.chapters.length > 0) {
          const tocGrid = document.querySelector("#table-of-contents .grid-3");
          if (tocGrid) {
            tocGrid.innerHTML = flagshipBook.chapters.map((chap, idx) => `
              <article class="grid-item">
                <div class="grid-item-header">
                  <span class="meta" style="color: var(--accent);">${chap.status}</span>
                  <h3>${chap.title}</h3>
                </div>
                <p class="grid-item-desc">${chap.desc}</p>
                <a href="${flagshipBook.previewUrl}" class="grid-item-link">Read Chapter Preview →</a>
              </article>
            `).join("");
          }
        }
      }
    }
  }
}

// Smooth Anchor Scroll
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Initial Hydration & Realtime Subscription Listener
  hydratePage();
  window.addEventListener("tobi_site_data_updated", hydratePage);
  subscribeToSupabaseRealtime(hydratePage);
});
