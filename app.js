import {
  isSupabaseConfigured,
  syncSiteSettingsFromSupabase,
  syncPostsFromSupabase,
  syncProjectsFromSupabase,
  syncNowPageFromSupabase,
  syncBooksFromSupabase,
  syncCourseSettingsFromSupabase,
  syncCourseLessonsFromSupabase,
  subscribeToSupabaseRealtime
} from "/supabase.js";

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
    const [cloudSettings, cloudNow, cloudPosts, cloudProjects, cloudBooks, cloudCourseSettings, cloudCourseLessons] = await Promise.all([
      syncSiteSettingsFromSupabase(),
      syncNowPageFromSupabase(),
      syncPostsFromSupabase(),
      syncProjectsFromSupabase(),
      syncBooksFromSupabase(),
      syncCourseSettingsFromSupabase(),
      syncCourseLessonsFromSupabase()
    ]);

    const baseDefaults = {
      siteTitle: "Tobi Lawson",
      heroTitle: "Building and investing with purpose.",
      heroSubtitle: "Notes on capital, cities, and the slow work of building things that last. Based in Lagos, working across fintech, SME services, and education technology.",
      heroScribbleWord: "purpose.",
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
      footerLink2Url: "http://lagosurban.com"
    };

    let mergedSettings = { ...baseDefaults };

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
      : (local?.posts || []);

    const mergedProjects = (Array.isArray(cloudProjects) && cloudProjects.length > 0)
      ? cloudProjects
      : (local?.projects || []);

    const mergedBooks = (Array.isArray(cloudBooks) && cloudBooks.length > 0)
      ? cloudBooks
      : (local?.books || []);

    const mergedCourseLessons = (Array.isArray(cloudCourseLessons) && cloudCourseLessons.length > 0)
      ? cloudCourseLessons
      : (local?.courseLessons || []);

    const merged = {
      settings: mergedSettings,
      nowPage: cloudNow || local?.nowPage,
      courseSettings: cloudCourseSettings || local?.courseSettings,
      courseLessons: mergedCourseLessons,
      posts: mergedPosts,
      projects: mergedProjects,
      books: mergedBooks
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

  // 1. Hydrate Navigation, Brand, and Footer across all pages
  if (data.settings) {
    if (data.settings.siteTitle) {
      document.querySelectorAll(".meta-brand").forEach(el => {
        el.textContent = data.settings.siteTitle;
      });
    }

    if (data.settings.contactEmail) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        link.href = `mailto:${data.settings.contactEmail}`;
      });
    }

    // Dynamic Footer & Custom Links Hydration across all pages
    if (data.settings.footerTagline !== undefined && data.settings.footerTagline !== null) {
      document.querySelectorAll(".footer-tagline").forEach(el => { el.textContent = data.settings.footerTagline; });
    }
    if (data.settings.footerCopyright !== undefined && data.settings.footerCopyright !== null) {
      document.querySelectorAll(".footer-copyright").forEach(el => { el.textContent = data.settings.footerCopyright; });
    }
    if (data.settings.footerLink1Name) {
      document.querySelectorAll(".footer-custom-link-1").forEach(el => { el.textContent = data.settings.footerLink1Name; });
    }
    if (data.settings.footerLink1Url) {
      document.querySelectorAll(".footer-custom-link-1").forEach(el => { el.href = data.settings.footerLink1Url; });
    }
    if (data.settings.footerLink2Name) {
      document.querySelectorAll(".footer-custom-link-2").forEach(el => { el.textContent = data.settings.footerLink2Name; });
    }
    if (data.settings.footerLink2Url) {
      document.querySelectorAll(".footer-custom-link-2").forEach(el => { el.href = data.settings.footerLink2Url; });
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
    const projectsGrid = document.querySelector("#projects .grid-3");
    if (projectsGrid) {
      if (Array.isArray(data.projects) && data.projects.length > 0) {
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
      } else if (Array.isArray(data.projects) && data.projects.length === 0) {
        projectsGrid.innerHTML = `<div class="meta" style="color: var(--text-muted); padding: 2rem 0;">No active projects configured.</div>`;
      }
    }

    // Recent Writing Section
    const writingGrid = document.querySelector("#writing .grid-3");
    if (writingGrid) {
      if (Array.isArray(data.posts) && data.posts.length > 0) {
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
      } else if (Array.isArray(data.posts) && data.posts.length === 0) {
        writingGrid.innerHTML = `<div class="meta" style="color: var(--text-muted); padding: 2rem 0;">No articles published yet.</div>`;
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
        let imgPath = data.settings.aboutProfileImage;
        if (imgPath.startsWith("./assets/")) {
          imgPath = imgPath.replace("./assets/", "/assets/");
        } else if (imgPath.startsWith("assets/")) {
          imgPath = "/" + imgPath;
        }
        aboutImg.src = imgPath;
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
    const catalogGrid = document.querySelector("#writing-catalog .grid-3");
    if (catalogGrid) {
      if (Array.isArray(data.posts) && data.posts.length > 0) {
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
      } else if (Array.isArray(data.posts) && data.posts.length === 0) {
        catalogGrid.innerHTML = `<div class="meta" style="color: var(--text-muted); padding: 2rem 0;">No articles published yet.</div>`;
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

    const nowProjectsGrid = document.querySelector("#now-grid .grid-3");
    if (nowProjectsGrid) {
      if (Array.isArray(data.projects) && data.projects.length > 0) {
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
      } else if (Array.isArray(data.projects) && data.projects.length === 0) {
        nowProjectsGrid.innerHTML = `<div class="meta" style="color: var(--text-muted); padding: 2rem 0;">No active projects configured.</div>`;
      }
    }
  }

  // 6. Hydrate Books Page (Presence of #table-of-contents or books route)
  const isBooksPage = document.getElementById("table-of-contents") || currentPath.includes("books");
  if (isBooksPage) {
    if (Array.isArray(data.books) && data.books.length > 0) {
      const flagshipBook = data.books[0];
      if (flagshipBook) {
        const titleEl = document.querySelector(".book-title");
        if (titleEl && flagshipBook.title) titleEl.textContent = flagshipBook.title;

        const subEl = document.querySelector(".book-subtitle");
        if (subEl && flagshipBook.subtitle) subEl.textContent = flagshipBook.subtitle;

        const tagEl = document.querySelector(".book-status-tag .meta");
        if (tagEl && flagshipBook.statusTag) tagEl.textContent = flagshipBook.statusTag;

        const coverImgEl = document.querySelector(".book-cover-container img");
        if (coverImgEl && flagshipBook.coverImageUrl) coverImgEl.src = flagshipBook.coverImageUrl;

        const synEls = document.querySelectorAll(".book-synopsis");
        if (synEls.length >= 2) {
          if (flagshipBook.synopsisP1) synEls[0].textContent = flagshipBook.synopsisP1;
          if (flagshipBook.synopsisP2) synEls[1].textContent = flagshipBook.synopsisP2;
        }

        const previewBtns = document.querySelectorAll(".book-hero-showcase a[href*='preview']");
        previewBtns.forEach(btn => {
          if (flagshipBook.previewUrl) btn.href = flagshipBook.previewUrl;
        });

        // Chapters Table of Contents
        if (flagshipBook.chapters && flagshipBook.chapters.length > 0) {
          const tocGrid = document.querySelector("#table-of-contents .grid-3");
          if (tocGrid) {
            tocGrid.innerHTML = flagshipBook.chapters.map((chap) => `
              <article class="grid-item">
                <div class="grid-item-header">
                  <span class="meta" style="color: var(--accent);">${chap.status}</span>
                  <h3>${chap.title}</h3>
                </div>
                <p class="grid-item-desc">${chap.desc}</p>
                <a href="${flagshipBook.previewUrl || '#'}" class="grid-item-link">Read Chapter Preview →</a>
              </article>
            `).join("");
          }
        }
      }
    }
  }

  // 7. Hydrate Course Page (Presence of #courseTitle or course route)
  const isCoursePage = document.getElementById("courseTitle") || currentPath.includes("course");
  if (isCoursePage) {
    if (data.courseSettings) {
      const statusTag = document.getElementById("courseStatusTag");
      const title = document.getElementById("courseTitle");
      const subtitle = document.getElementById("courseSubtitle");
      const overviewProse = document.getElementById("courseOverviewProse");
      const ctaText = document.getElementById("courseCtaText");

      if (statusTag && data.courseSettings.statusTag) {
        statusTag.innerHTML = `<span class="meta" style="letter-spacing: 0.12em;">${data.courseSettings.statusTag}</span>`;
      }
      if (title && data.courseSettings.title) title.textContent = data.courseSettings.title;
      if (subtitle && data.courseSettings.subtitle) subtitle.textContent = data.courseSettings.subtitle;
      if (ctaText && data.courseSettings.ctaText) ctaText.textContent = data.courseSettings.ctaText;

      if (overviewProse && data.courseSettings.overviewProse) {
        const paragraphs = data.courseSettings.overviewProse.split("\n\n");
        overviewProse.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join("");
      }
    }

    const lessonsGrid = document.getElementById("courseLessonsList");
    if (lessonsGrid) {
      if (Array.isArray(data.courseLessons) && data.courseLessons.length > 0) {
        lessonsGrid.innerHTML = data.courseLessons.map((l) => {
          let mediaHtml = "";

          if (l.videoType === "youtube" && l.videoUrl) {
            let embedUrl = l.videoUrl;
            if (l.videoUrl.includes("watch?v=")) {
              const videoId = l.videoUrl.split("watch?v=")[1].split("&")[0];
              embedUrl = `https://www.youtube.com/embed/${videoId}`;
            } else if (l.videoUrl.includes("youtu.be/")) {
              const videoId = l.videoUrl.split("youtu.be/")[1].split("?")[0];
              embedUrl = `https://www.youtube.com/embed/${videoId}`;
            }
            mediaHtml = `
              <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.5rem 0; border: 1px solid var(--line);">
                <iframe src="${embedUrl}" style="position: absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen></iframe>
              </div>
            `;
          } else if (l.videoType === "upload" && l.videoUrl) {
            mediaHtml = `
              <div style="margin: 1.5rem 0; border: 1px solid var(--line);">
                <video controls src="${l.videoUrl}" style="width: 100%; max-height: 400px; display: block;"></video>
              </div>
            `;
          }

          let textHtml = l.textContent ? `<div style="margin-top: 1rem; color: var(--text); font-size: 1rem; line-height: 1.65;">${l.textContent.replace(/\n\n/g, '<br><br>')}</div>` : "";

          return `
            <article class="grid-item" style="border-top: 1px solid var(--line); padding-top: 1.5rem;">
              <div class="grid-item-header" style="border-top: none; padding-top: 0; margin-bottom: 1rem;">
                <span class="meta" style="color: var(--accent);">${l.moduleNumber || 'MODULE 01'} • ${l.status || 'Published'}</span>
                <h3 style="margin-top: 0.5rem; font-size: 1.35rem;">${l.title}</h3>
              </div>
              <p class="grid-item-desc" style="font-size: 1.05rem; line-height: 1.6;">${l.summary}</p>
              ${mediaHtml}
              ${textHtml}
            </article>
          `;
        }).join("");
      } else if (Array.isArray(data.courseLessons) && data.courseLessons.length === 0) {
        lessonsGrid.innerHTML = `<div class="meta" style="color: var(--text-muted); padding: 2rem 0;">No lesson modules published yet.</div>`;
      }
    }
  }
}

// Smooth Anchor Scroll & Hydration Init
function initApp() {
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
