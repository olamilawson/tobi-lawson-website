/**
 * Tobi Lawson — Content Schema
 *
 * SINGLE SOURCE OF TRUTH for every editable piece of content on the site.
 *
 * The admin console UI, the public-page hydrator, and the Supabase payload are
 * all derived from this file. To make something on the site editable you add it
 * here once and put a matching `data-cms="key"` attribute on the element. You
 * never touch admin.html, admin.js, app.js, or the database schema again.
 *
 * Field types:
 *   text     — single-line input
 *   textarea — multi-line input, rendered as-is (newlines become <br>)
 *   prose    — multi-line input, blank-line-separated blocks become <p> tags
 *   url      — single-line input validated as a URL
 *   email    — single-line input validated as an email
 *   image    — URL input plus a file picker that inlines the file as a data URI
 *   select   — dropdown, requires `options: [{value, label}]`
 */

// ---------------------------------------------------------------------------
// Singleton content — one value per key, grouped into admin console tabs.
// ---------------------------------------------------------------------------

export const GROUPS = [
  {
    id: "brand",
    label: "Brand & Nav",
    heading: "Brand & Navigation",
    blurb: "The site name and the six navigation labels, shared by every page.",
    fields: [
      { key: "siteTitle", label: "Site / Brand Name", type: "text", default: "Tobi Lawson" },
      { key: "contactEmail", label: "Contact Email", type: "email", default: "olamilawson@gmail.com",
        help: "Used by every mailto: link across the site." },
      { key: "navHome", label: "Nav — Home", type: "text", default: "Home" },
      { key: "navBooks", label: "Nav — Books", type: "text", default: "Books" },
      { key: "navWriting", label: "Nav — Writing", type: "text", default: "Writing" },
      { key: "navNow", label: "Nav — Now", type: "text", default: "Now" },
      { key: "navCourse", label: "Nav — Course", type: "text", default: "Course" },
      { key: "navAbout", label: "Nav — About", type: "text", default: "About" }
    ]
  },

  {
    id: "home",
    label: "Homepage",
    heading: "Homepage",
    blurb: "Hero headline and the two section headers. Project and essay cards are managed in their own tabs.",
    fields: [
      { key: "homeHeroTitle", label: "Hero Headline", type: "textarea", rows: 3,
        default: "Building\nand investing\nwith purpose.",
        help: "Line breaks are preserved. The scribble word below is circled wherever it appears." },
      { key: "homeHeroScribbleWord", label: "Circled Word", type: "text", default: "purpose.",
        help: "Must appear in the headline above, exactly, for the scribble to draw." },
      { key: "homeHeroSubtitle", label: "Hero Lead Paragraph", type: "textarea", rows: 3,
        default: "Notes on capital, cities, and the slow work of building things that last. Based in Lagos, working across fintech, SME services, and education technology." },
      { key: "homeProjectsHeading", label: "Projects Section — Heading", type: "text", default: "Selected Ventures & Projects" },
      { key: "homeProjectsEyebrow", label: "Projects Section — Eyebrow", type: "text", default: "01 / CORE INITIATIVES" },
      { key: "homeWritingHeading", label: "Writing Section — Heading", type: "text", default: "Recent Essays & Notes" },
      { key: "homeWritingEyebrow", label: "Writing Section — Eyebrow", type: "text", default: "02 / WRITING" }
    ]
  },

  {
    id: "about",
    label: "About",
    heading: "About Page",
    blurb: "Headline, portrait, and bio prose.",
    fields: [
      { key: "aboutHeroTitle", label: "Headline", type: "text", default: "About Tobi Lawson" },
      { key: "aboutHeroSubtitle", label: "Lead Paragraph", type: "textarea", rows: 3,
        default: "Investor and builder based in Lagos. Background in investment analysis and development research, now running companies across fintech, SME services, and education technology." },
      { key: "aboutProfileImage", label: "Portrait Photo", type: "image", default: "/assets/tobi-lawson.jpg" },
      { key: "aboutProfileAlt", label: "Portrait Alt Text", type: "text",
        default: "Tobi Lawson — Investor and Builder based in Lagos",
        help: "Describes the photo for screen readers and when the image fails to load." },
      { key: "aboutBodyProse", label: "Bio Prose", type: "prose", rows: 12,
        default: "I'm an investor and builder based in Lagos. My background is in investment analysis and development research, work that shaped how I think about capital, institutions, and the slow processes that move a country's fortunes.\n\nToday I run and invest in companies across fintech, SME services technology, product development, and education technology. Alongside that, I co-founded 1914 Reader with Feyi Fawehinmi, where we read Nigeria and Africa's biggest stories through the lens of global economic and political change.\n\nI also work on Lagos Urban Project, a platform reimagining Lagos as a more inclusive and livable city, and Long Africa, a new institution focused on the long-run foundations of African prosperity.\n\nMy interests run wide: markets, cities, governance, technology, and the books that help make sense of them. This site is where I write about all of it, and keep a running account of what I'm building.",
        help: "Leave a blank line between paragraphs." },
      { key: "aboutContactLabel", label: "Contact Row Label", type: "text", default: "Direct Contact" }
    ]
  },

  {
    id: "now",
    label: "Now",
    heading: "Now Page",
    blurb: "The running account of what you're working on. The project cards themselves live in the Projects tab.",
    fields: [
      { key: "nowHeroTitle", label: "Headline", type: "text", default: "What I'm spending time on" },
      { key: "nowHeroSubtitle", label: "Lead Paragraph", type: "textarea", rows: 3,
        default: "A running account of the projects I'm building, updated as things move. Last updated July 2026." },
      { key: "nowProjectsHeading", label: "Projects Section — Heading", type: "text", default: "Active Initiatives & Portfolio" },
      { key: "nowProjectsEyebrow", label: "Projects Section — Eyebrow", type: "text", default: "01 / CURRENT FOCUS" },
      { key: "nowOngoingProse", label: "Ongoing Focus Prose", type: "prose", rows: 6,
        default: "I run and invest in companies across fintech, SME services technology, product development, and education technology. Some are early-stage, some are further along.\n\nI share specifics and case studies here as each venture is ready to talk about publicly." }
    ]
  },

  {
    id: "writing",
    label: "Writing",
    heading: "Writing Index",
    blurb: "The essay archive page. Individual essays are managed in the list below.",
    fields: [
      { key: "writingHeroTitle", label: "Headline", type: "text", default: "Writing & Essays" },
      { key: "writingHeroSubtitle", label: "Lead Paragraph", type: "textarea", rows: 3,
        default: "Notes on capital, cities, and the slow work of building things that last. Essays, book reviews, and field notes." },
      { key: "writingCatalogHeading", label: "Archive Section — Heading", type: "text", default: "All Articles & Monographs" },
      { key: "writingCatalogEyebrow", label: "Archive Section — Eyebrow", type: "text", default: "ARCHIVE" },
      { key: "writingMoreLabel", label: '"More Writing" Label', type: "text", default: "More Writing",
        help: "Shown at the foot of each individual essay." }
    ]
  },

  {
    id: "books",
    label: "Books",
    heading: "Books Page",
    blurb: "Page furniture for the books page. Each book and its chapters are managed in the list below.",
    fields: [
      { key: "booksAuthorLabel", label: "Detail Label — Author", type: "text", default: "Author" },
      { key: "booksFormatLabel", label: "Detail Label — Format", type: "text", default: "Format" },
      { key: "booksReleaseLabel", label: "Detail Label — Release", type: "text", default: "Release" },
      { key: "booksPreviewCta", label: "Preview Button Text", type: "text", default: "Read Chapter 01 Preview →" },
      { key: "booksTocHeading", label: "Contents Section — Heading", type: "text", default: "Volume Outline & Chapter Previews" },
      { key: "booksTocEyebrow", label: "Contents Section — Eyebrow", type: "text", default: "TABLE OF CONTENTS" },
      { key: "booksChapterCta", label: "Chapter Card Link — Preview", type: "text", default: "Read Chapter Preview →",
        help: "Used for chapters that have no text of their own yet." },
      { key: "booksReadChapterCta", label: "Chapter Card Link — Full Chapter", type: "text", default: "Read Chapter →",
        help: "Used once a chapter has text, and links to the full chapter." }
    ]
  },

  {
    id: "course",
    label: "Course",
    heading: "Free Course",
    blurb: "The masterclass landing page. Video modules are managed in the list below.",
    fields: [
      { key: "courseStatusTag", label: "Status Tag", type: "text", default: "FREE COURSE • COMING SOON" },
      { key: "courseTitle", label: "Course Title", type: "text", default: "Artificial Intelligence in Frontier Markets" },
      { key: "courseSubtitle", label: "Lead Paragraph", type: "textarea", rows: 3,
        default: "A free masterclass series exploring how compute, data pipelines, and foundation models are reshaped by the physical realities of emerging economies." },
      { key: "courseOverviewEyebrow", label: "Overview — Eyebrow", type: "text", default: "01 / COURSE OVERVIEW" },
      { key: "courseOverviewProse", label: "Overview Prose", type: "prose", rows: 10,
        default: "Artificial Intelligence is often analyzed through the lens of Silicon Valley capital and hyperscaler data centers. But the real friction—and the highest-leverage opportunities—happen at the edges of global networks: in Lagos, Nairobi, Jakarta, and São Paulo.\n\nThis free course examines compute constraints, local dataset curation, offline-first inference architectures, and real-world deployment across fintech, SME logistics, and public institutions in frontier markets." },
      { key: "courseWaitlistEyebrow", label: "Waitlist — Eyebrow", type: "text", default: "02 / EARLY ACCESS & NOTIFICATIONS" },
      { key: "courseWaitlistHeading", label: "Waitlist — Heading", type: "text", default: "Join the Priority Waitlist" },
      { key: "courseCtaText", label: "Waitlist — Body Text", type: "textarea", rows: 3,
        default: "Enrollment is completely free. Leave your email to receive early lesson drops, video modules, and lecture notes as modules go live." },
      { key: "courseCtaButton", label: "Waitlist — Button Text", type: "text", default: "Get Early Access →" },
      { key: "courseLessonsEyebrow", label: "Lessons — Eyebrow", type: "text", default: "03 / LESSONS & VIDEO MODULES" },
      { key: "courseLessonsHeading", label: "Lessons — Heading", type: "text", default: "Course Syllabus & Lectures" }
    ]
  },

  {
    id: "footer",
    label: "Footer",
    heading: "Footer",
    blurb: "Shared by every page on the site.",
    fields: [
      { key: "footerTagline", label: "Tagline", type: "text", default: "Investor, builder, and writer based in Lagos." },
      { key: "footerCopyright", label: "Copyright Line", type: "text", default: "© 2026 Tobi Lawson. All rights reserved." },
      { key: "footerEmailLabel", label: "Email Link Label", type: "text", default: "Email" },
      { key: "footerLink1Name", label: "Custom Link 1 — Label", type: "text", default: "1914 Reader" },
      { key: "footerLink1Url", label: "Custom Link 1 — URL", type: "url", default: "https://www.1914reader.com/" },
      { key: "footerLink2Name", label: "Custom Link 2 — Label", type: "text", default: "Lagos Urban" },
      { key: "footerLink2Url", label: "Custom Link 2 — URL", type: "url", default: "http://lagosurban.com" }
    ]
  },

  {
    id: "seo",
    label: "SEO",
    heading: "Search & Social Metadata",
    blurb: "Browser tab titles, search-result descriptions, and the image used when a link is shared.",
    fields: [
      { key: "seoOgImage", label: "Social Share Image URL", type: "url", default: "https://tobilawson.com/assets/tobi-lawson.jpg" },
      { key: "seoHomeTitle", label: "Home — Tab Title", type: "text", default: "Tobi Lawson" },
      { key: "seoHomeDescription", label: "Home — Description", type: "textarea", rows: 2,
        default: "Notes on capital, cities, and the slow work of building things that last. Based in Lagos, working across fintech, SME services, and education technology." },
      { key: "seoAboutTitle", label: "About — Tab Title", type: "text", default: "Tobi Lawson" },
      { key: "seoAboutDescription", label: "About — Description", type: "textarea", rows: 2,
        default: "Investor and builder based in Lagos, working across fintech, SME services, and education technology." },
      { key: "seoWritingTitle", label: "Writing — Tab Title", type: "text", default: "Tobi Lawson" },
      { key: "seoWritingDescription", label: "Writing — Description", type: "textarea", rows: 2,
        default: "Essays, book reviews, and field notes on capital, cities, and African development." },
      { key: "seoNowTitle", label: "Now — Tab Title", type: "text", default: "Tobi Lawson" },
      { key: "seoNowDescription", label: "Now — Description", type: "textarea", rows: 2,
        default: "A running account of the projects and companies I'm currently building." },
      { key: "seoBooksTitle", label: "Books — Tab Title", type: "text", default: "Tobi Lawson" },
      { key: "seoBooksDescription", label: "Books — Description", type: "textarea", rows: 2,
        default: "Who Made This? — a microhistory of everyday things, and other volumes in progress." },
      { key: "seoCourseTitle", label: "Course — Tab Title", type: "text", default: "Tobi Lawson" },
      { key: "seoCourseDescription", label: "Course — Description", type: "textarea", rows: 2,
        default: "A free masterclass on how compute, data, and foundation models behave in emerging economies." }
    ]
  }
];

// ---------------------------------------------------------------------------
// Repeatable content — lists the console can add to, reorder, edit, and delete.
// ---------------------------------------------------------------------------

export const COLLECTIONS = [
  {
    id: "projects",
    label: "Projects",
    singular: "Project",
    tab: "now",
    heading: "Ventures & Projects",
    blurb: "Shown on both the homepage and the Now page.",
    titleField: "title",
    subtitleField: "roleTag",
    bodyField: "description",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "roleTag", label: "Role Tag", type: "text", default: "Project / Founder",
        help: 'e.g. "Publication / Co-founder"' },
      { key: "status", label: "Status", type: "text", default: "Active",
        help: 'Shown on the Now page, e.g. "Active" or "Launching Soon"' },
      { key: "description", label: "Description", type: "textarea", rows: 3 },
      { key: "link", label: "Link URL", type: "url" }
    ]
  },

  {
    id: "posts",
    label: "Essays",
    singular: "Essay",
    tab: "writing",
    heading: "Essays & Reviews",
    blurb: "The three newest appear on the homepage. All of them appear in the Writing archive.",
    titleField: "title",
    subtitleField: "category",
    bodyField: "summary",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "category", label: "Category", type: "text", default: "Essay",
        help: 'e.g. "Essay" or "Book Review"' },
      { key: "date", label: "Date", type: "text", default: "", help: 'Free text, e.g. "Jun 2026"' },
      { key: "summary", label: "Summary", type: "textarea", rows: 3,
        help: "The one-line description shown on cards." },
      { key: "url", label: "Page URL", type: "text", path: true,
        help: "Leave blank and one will be generated for you. Existing hand-built essays keep their own file paths." },
      { key: "bodyProse", label: "Essay Body", type: "prose", rows: 18,
        help: "Blank line between paragraphs. Start a line with ## for a subheading, or > for a pull quote." }
    ]
  },

  {
    id: "books",
    label: "Books",
    singular: "Book",
    tab: "books",
    heading: "Books & Monographs",
    blurb: "The first book in this list is featured at the top of the Books page.",
    titleField: "title",
    subtitleField: "statusTag",
    bodyField: "subtitle",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "statusTag", label: "Status Tag", type: "text", default: "FORTHCOMING VOLUME • IN WRITING" },
      { key: "coverImageUrl", label: "Cover Image", type: "image", default: "/assets/who-made-this-cover.jpg" },
      { key: "synopsisP1", label: "Synopsis — Paragraph 1", type: "textarea", rows: 4 },
      { key: "synopsisP2", label: "Synopsis — Paragraph 2", type: "textarea", rows: 4 },
      { key: "author", label: "Author", type: "text", default: "Tobi Lawson" },
      { key: "format", label: "Format", type: "text", default: "Hardcover & Digital" },
      { key: "releaseDate", label: "Release", type: "text", default: "Late 2026" },
      { key: "previewUrl", label: "Preview Page URL", type: "text", path: true, default: "/books/who-made-this-preview.html" }
    ],
    // A list nested inside each item of this collection.
    subCollection: {
      id: "chapters",
      label: "Chapters",
      singular: "Chapter",
      titleField: "title",
      subtitleField: "status",
      bodyField: "desc",
      fields: [
        { key: "title", label: "Chapter Title", type: "text", required: true },
        { key: "status", label: "Status Line", type: "text", default: "Chapter 01 • In Research" },
        { key: "desc", label: "Description", type: "textarea", rows: 3,
          help: "The one-line summary shown on the chapter card." },
        { key: "bodyProse", label: "Chapter Text", type: "prose", rows: 20,
          help: "The full chapter. Blank line between paragraphs; ## for a subheading, > for a pull quote. Leave empty and the card links to the preview page instead." }
      ]
    }
  },

  {
    id: "lessons",
    label: "Course Modules",
    singular: "Module",
    tab: "course",
    heading: "Lesson & Video Modules",
    blurb: "Each module renders on the course page with its video, if it has one.",
    titleField: "title",
    subtitleField: "moduleNumber",
    bodyField: "summary",
    fields: [
      { key: "moduleNumber", label: "Module Number", type: "text", default: "MODULE 01" },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "status", label: "Status", type: "text", default: "Published" },
      { key: "summary", label: "Summary", type: "textarea", rows: 3 },
      { key: "videoType", label: "Video Source", type: "select", default: "none",
        options: [
          { value: "none", label: "No video" },
          { value: "youtube", label: "YouTube" },
          { value: "upload", label: "Uploaded / direct file URL" }
        ] },
      { key: "videoUrl", label: "Video URL", type: "url",
        help: "A YouTube watch/short link, or a direct .mp4 URL for uploads.",
        showIf: { key: "videoType", notEquals: "none" } },
      { key: "textContent", label: "Lecture Notes", type: "prose", rows: 10 }
    ]
  }
];

// ---------------------------------------------------------------------------
// Derived lookups
// ---------------------------------------------------------------------------

export const ALL_FIELDS = GROUPS.flatMap((g) => g.fields);

export const FIELD_BY_KEY = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f]));

export const COLLECTION_BY_ID = Object.fromEntries(COLLECTIONS.map((c) => [c.id, c]));

/** Every singleton key mapped to its default value. */
export function defaultSettings() {
  const out = {};
  for (const f of ALL_FIELDS) out[f.key] = f.default ?? "";
  return out;
}

/** A blank item for a collection (or sub-collection), with defaults applied. */
export function blankItem(fields) {
  const out = {};
  for (const f of fields) out[f.key] = f.default ?? "";
  return out;
}

/**
 * Seed content for a brand-new install. Only used when there is nothing in
 * the cloud, nothing in localStorage, and no legacy data to migrate.
 */
export const SEED_COLLECTIONS = {
  projects: [
    { id: "1914-reader", title: "1914 Reader", roleTag: "Publication / Co-founder", status: "Active",
      description: "A publication co-founded with Feyi Fawehinmi reading African stories through the lens of global economic change.",
      link: "https://www.1914reader.com/" },
    { id: "lagos-urban", title: "Lagos Urban Project", roleTag: "Platform / Founder", status: "Active",
      description: "Reimagining Lagos as a more inclusive, livable, and productive city, built from how people live in it.",
      link: "http://lagosurban.com" },
    { id: "long-africa", title: "Long Africa", roleTag: "Institution / Launching Soon", status: "Launching Soon",
      description: "An institution dedicated to the civilisational foundations of African prosperity across multi-decade horizons.",
      link: "http://longafrica.org" }
  ],
  posts: [
    { id: "shape-lagos-takes", title: "The Shape Lagos Takes When No One Is Planning It", category: "Essay",
      date: "Jun 2026", summary: "On informal urbanism, and what the city's edges reveal about how Lagos works.",
      url: "/writing/the-shape-lagos-takes.html", bodyProse: "" },
    { id: "patient-capital", title: "Patient Capital, Impatient Markets", category: "Essay",
      date: "May 2026", summary: "The timelines investors want and the timelines development requires rarely match. That mismatch has a cost.",
      url: "/writing/patient-capital-impatient-markets.html", bodyProse: "" },
    { id: "how-asia-works-review", title: "How Asia Works, and What It Leaves Unanswered for Africa", category: "Book Review",
      date: "Apr 2026", summary: "Joe Studwell's case for land reform and export discipline holds up. The parts that don't translate say a lot about the starting point.",
      url: "/writing/review-how-asia-works.html", bodyProse: "" }
  ],
  books: [
    { id: "who-made-this", title: "WHO MADE THIS?", subtitle: "A microhistory of everyday things",
      statusTag: "FORTHCOMING VOLUME • IN WRITING", coverImageUrl: "/assets/who-made-this-cover.jpg",
      synopsisP1: "Every morning, millions of people reach for an aluminum octagonal pot, twist a metallic tap, or click a ballpoint pen without considering the fierce industrial battles, accidental metallurgical discoveries, and human obsession engineered into those geometric forms.",
      synopsisP2: "Who Made This? traces the physical origins of modern domestic life. Moving object by object—from Alfonso Bialetti's aluminum foundry in Piedmont to the early safety bicycle workshops of the 1890s—this volume recovers the sense of awe buried inside the ordinary objects surrounding us.",
      author: "Tobi Lawson", format: "Hardcover & Digital", releaseDate: "Late 2026",
      previewUrl: "/books/who-made-this-preview.html",
      chapters: [
        { title: "The Eight Sides of Aluminum", status: "Chapter 01 • Available to Read",
          desc: "How Alfonso Bialetti observed laundry boilers in 1930s Crusinallo and engineered steam pressure to distill espresso inside an octagonal aluminum shell." },
        { title: "Light Without Smoke", status: "Chapter 02 • In Editing",
          desc: "The night Wabash, Indiana illuminated its public square with arc lamps, ending thousands of years of indoor fire, candle smoke, and oil fumes." },
        { title: "The Equal Wheels", status: "Chapter 03 • In Research",
          desc: "How the 1885 safety bicycle unlocked personal movement, dismantled social movement restrictions, and forced city engineers to pave muddy thoroughfares." }
      ] }
  ],
  lessons: [
    { id: "module-01-compute-constraints", moduleNumber: "MODULE 01",
      title: "Compute Constraints & Edge Deployment", status: "Published",
      summary: "Designing low-latency model inference under intermittent power, bandwidth limits, and local infrastructure reality.",
      textContent: "In this lecture, we examine compute constraints across frontier market server environments. We analyze model quantization (4-bit / 8-bit), edge caching strategies, and local fallback routines.",
      videoType: "none", videoUrl: "" }
  ]
};

/** Bootstrap passcode hash — sha256("tobi-cms:" + passcode). Never store plaintext. */
export const BOOTSTRAP_PASSCODE_HASH =
  "0d3512b56a15441a4a30ef96f99b12c899554a473e5aee2941444e67bf217ac7";

export const SCHEMA_VERSION = 3;
