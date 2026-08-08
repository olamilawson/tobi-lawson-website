(function () {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Client-Side Dynamic Hydration from Admin Storage (If Present)
  const STORAGE_KEY = "tobi_site_data_v1";

  function loadSiteData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function hydratePage() {
    const data = loadSiteData();
    if (!data) return;

    // 1. Hydrate Homepage & Writing Catalog
    if (data.posts && data.posts.length > 0) {
      const writingGrid = document.querySelector("#writing .grid-3") || document.querySelector("#writing-catalog .grid-3");
      if (writingGrid) {
        // Take top 3 for index page, or all for writing catalog page
        const isCatalogPage = window.location.pathname.includes("writing");
        const postsToRender = isCatalogPage ? data.posts : data.posts.slice(0, 3);
        const prefix = isCatalogPage ? "" : "writing/";

        writingGrid.innerHTML = postsToRender.map((post, idx) => `
          <article class="grid-item fade-up delay-${(idx % 3) + 1}">
            <a href="${post.url.startsWith("writing/") || isCatalogPage ? post.url.replace(/^writing\//, "") : prefix + post.url}">
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

    // 2. Hydrate "Now" Page
    if (data.nowPage) {
      const nowGrid = document.querySelector("#now-grid");
      if (nowGrid) {
        const subtitleEl = document.querySelector(".hero-subtitle");
        if (subtitleEl && data.nowPage.introSubtitle) {
          subtitleEl.textContent = data.nowPage.introSubtitle;
        }

        const proseEl = document.querySelector(".article-body");
        if (proseEl && data.nowPage.ongoingProse) {
          proseEl.innerHTML = `<p>${data.nowPage.ongoingProse}</p>`;
        }
      }
    }

    // 3. Hydrate Core Projects Showcase
    if (data.projects && data.projects.length > 0) {
      const projectsGrid = document.querySelector("#projects .grid-3") || document.querySelector("#now-grid .grid-3");
      if (projectsGrid && !window.location.pathname.includes("writing")) {
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

    // 4. Hydrate Hero Subtitle & Email Settings
    if (data.settings) {
      if (data.settings.heroSubtitle) {
        const heroSub = document.querySelector(".hero-subtitle");
        if (heroSub && window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
          heroSub.textContent = data.settings.heroSubtitle;
        }
      }

      if (data.settings.contactEmail) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
          link.href = `mailto:${data.settings.contactEmail}`;
        });
      }
    }
  }

  // Hydrate on initial load and listen for live updates
  document.addEventListener("DOMContentLoaded", hydratePage);
  window.addEventListener("tobi_site_data_updated", hydratePage);
})();
