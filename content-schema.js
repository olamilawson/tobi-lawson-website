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
// The headings projects sit under on the Projects page, in page order.
// ---------------------------------------------------------------------------

export const PROJECT_GROUPS = [
  { id: "software", label: "Software" },
  { id: "cities", label: "Cities and ideas" }
];

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
      { key: "contactEmail", label: "Contact Email", type: "email", default: "me@tobilawson.com",
        help: "Used by every mailto: link across the site." },
      { key: "navHome", label: "Nav — Home", type: "text", default: "Home" },
      { key: "navBooks", label: "Nav — Books", type: "text", default: "Books" },
      { key: "navWriting", label: "Nav — Writing", type: "text", default: "Writing" },
      { key: "navProjects", label: "Nav — Projects", type: "text", default: "Projects" },
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
        default: "Building\nthe foundations\nothers build on.",
        help: "Line breaks are preserved. The scribble word below is circled wherever it appears." },
      { key: "homeHeroScribbleWord", label: "Circled Word", type: "text", default: "foundations",
        help: "Must appear in the headline above, exactly, for the scribble to draw." },
      { key: "homeHeroSubtitle", label: "Hero Lead Paragraph", type: "textarea", rows: 3,
        default: "I build the software African businesses run on, and write about capital, cities and how economies grow." },
      { key: "homeCurrentlyLabel", label: "Currently Line — Label", type: "text", default: "Currently",
        help: "The one-line strip under the lead paragraph. Its text is the Currently note in the Projects tab." },
      { key: "homeHeroImage", label: "Hero Portrait", type: "image",
        default: "/assets/tobi-portrait.jpg",
        help: "A framed 4:5 photograph beside the headline on desktop, below it on mobile. The page crops other shapes to 4:5 and keeps the top of the frame." },
      { key: "homeHeroImageAlt", label: "Hero Portrait Alt Text", type: "text",
        default: "Tobi Lawson — Investor and Builder based in Lagos",
        help: "Describes the photo for screen readers and when the image fails to load." },
      { key: "homeHeroCaption", label: "Hero Portrait Caption", type: "text", default: "Tobi Lawson",
        help: "Left side of the line under the portrait." },
      { key: "homeHeroCaptionNote", label: "Hero Portrait Caption — Right", type: "text", default: "Lagos",
        help: "Right side of the line under the portrait. A place, a year, or leave it empty." },
      { key: "homeProjectsHeading", label: "Projects Section — Heading", type: "text", default: "Selected Ventures & Projects" },
      { key: "homeProjectsEyebrow", label: "Projects Section — Eyebrow", type: "text", default: "02 / CORE INITIATIVES" },
      { key: "homeProjectsMore", label: "Projects Section — Link to All", type: "text", default: "All projects →" },
      { key: "homeWritingHeading", label: "Writing Section — Heading", type: "text", default: "Recent Essays & Notes" },
      { key: "homeWritingEyebrow", label: "Writing Section — Eyebrow", type: "text", default: "01 / WRITING" },
      { key: "homeWritingMore", label: "Writing Section — Link to All", type: "text", default: "All writing →" }
    ]
  },

  {
    id: "about",
    label: "About",
    heading: "About Page",
    blurb: "Headline, portrait, and bio prose.",
    fields: [
      { key: "aboutHeroTitle", label: "Headline", type: "text", default: "About me" },
      { key: "aboutHeroSubtitle", label: "Lead Paragraph", type: "textarea", rows: 3,
        default: "Technology does not only create economic value and prosperity, it is also a positive force for public good." },
      { key: "aboutProfileImage", label: "Portrait Photo", type: "image", default: "",
        help: "Leave empty for no photo on the About page." },
      { key: "aboutProfileAlt", label: "Portrait Alt Text", type: "text",
        default: "Tobi Lawson — Investor and Builder based in Lagos",
        help: "Describes the photo for screen readers and when the image fails to load." },
      { key: "aboutBodyProse", label: "Bio Prose", type: "prose", rows: 12,
        default: "The early part of my career was as an investment analyst and development researcher, the latter of which has been the focus of my public writing. For the last decade and a half I have built digital technologies at different nodes of the stack, including cloud computing, enterprise solutions, and application development. I run [Miomir Labs](https://miomirlabs.com/), a systems engineering company building reliable software for consumer and enterprise markets, with the ambition of pushing the frontier of artificial intelligence in Africa.",
        help: "Leave a blank line between paragraphs. Use [label](https://example.com) for links." },
      { key: "aboutContactLabel", label: "Contact Row Label", type: "text", default: "Direct Contact" }
    ]
  },

  {
    id: "projects",
    label: "Projects",
    heading: "Projects Page",
    blurb: "Everything you're building, grouped. The Currently note also runs as a one-line strip on the homepage. The projects themselves are in the list below.",
    fields: [
      { key: "projectsHeroTitle", label: "Headline", type: "text", default: "Projects" },
      { key: "projectsHeroSubtitle", label: "Lead Paragraph", type: "textarea", rows: 3,
        default: "Companies and institutions I've started or co-founded." },
      { key: "currentlyNote", label: "Currently — Note", type: "textarea", rows: 2,
        default: "",
        help: "One or two sentences on what has your attention. Shown at the top of the Projects page and as a line on the homepage. Leave it empty to hide both." },
      { key: "currentlyUpdated", label: "Currently — Last Updated", type: "text", default: "October 2026",
        help: 'Free text, e.g. "October 2026". Change it whenever you change the note.' }
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
        help: "Shown at the foot of each individual essay." },
      { key: "newsletterUsername", label: "Newsletter — Buttondown Username", type: "text", default: "tobilaw",
        help: "Your username from buttondown.com. While this is empty the signup box stays hidden." },
      { key: "newsletterHeading", label: "Newsletter — Heading", type: "text", default: "New essays by email" },
      { key: "newsletterBody", label: "Newsletter — Line", type: "text", default: "Get each new essay by email." },
      { key: "newsletterButton", label: "Newsletter — Button", type: "text", default: "Send me new essays" }
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
      { key: "booksPreviewCta", label: "Preview Button Text", type: "text", default: "Read Chapter One free →" },
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
      { key: "courseStatusTag", label: "Status Tag", type: "text", default: "FREE COURSE • IN DEVELOPMENT" },
      { key: "courseTitle", label: "Course Title", type: "text", default: "Artificial Intelligence in Frontier Markets" },
      { key: "courseSubtitle", label: "Lead Paragraph", type: "textarea", rows: 3,
        default: "A free course on artificial intelligence for a general audience in Africa: how it works, who builds it, and what it means for work." },
      { key: "courseOverviewEyebrow", label: "Overview — Eyebrow", type: "text", default: "01 / COURSE OVERVIEW" },
      { key: "courseOverviewProse", label: "Overview Prose", type: "prose", rows: 10,
        default: "You don't need a technical background. The course starts with the machines and data centres AI runs on, then the models at its centre and the products built on them.\n\nThe last two modules turn to work: which jobs AI disrupts, and where the openings are for Africans who want to build, invest or retrain." },
      { key: "courseWaitlistEyebrow", label: "Waitlist — Eyebrow", type: "text", default: "02 / EARLY ACCESS & NOTIFICATIONS" },
      { key: "courseWaitlistHeading", label: "Waitlist — Heading", type: "text", default: "Get the lessons by email" },
      { key: "courseCtaText", label: "Waitlist — Body Text", type: "textarea", rows: 3,
        default: "The course is free. Leave your email and I'll send each lesson when it's ready." },
      { key: "courseCtaButton", label: "Waitlist — Button Text", type: "text", default: "Send me the lessons" },
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
      { key: "footerLink2Url", label: "Custom Link 2 — URL", type: "url", default: "http://lagosurban.com" },
      { key: "footerLink3Name", label: "Custom Link 3 — Label", type: "text", default: "Miomir Labs" },
      { key: "footerLink3Url", label: "Custom Link 3 — URL", type: "url", default: "https://miomirlabs.com/" }
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
        default: "Tobi Lawson builds the software African businesses run on, and writes about capital, cities and how economies grow." },
      { key: "seoAboutTitle", label: "About — Tab Title", type: "text", default: "Tobi Lawson" },
      { key: "seoAboutDescription", label: "About — Description", type: "textarea", rows: 2,
        default: "Investor and builder based in Lagos, working across fintech, SME services, and education technology." },
      { key: "seoWritingTitle", label: "Writing — Tab Title", type: "text", default: "Tobi Lawson" },
      { key: "seoWritingDescription", label: "Writing — Description", type: "textarea", rows: 2,
        default: "Essays, book reviews, and field notes on capital, cities, and African development." },
      { key: "seoProjectsTitle", label: "Projects — Tab Title", type: "text", default: "Projects · Tobi Lawson" },
      { key: "seoProjectsDescription", label: "Projects — Description", type: "textarea", rows: 2,
        default: "Companies and institutions Tobi Lawson has started or co-founded." },
      { key: "seoBooksTitle", label: "Books — Tab Title", type: "text", default: "Tobi Lawson" },
      { key: "seoBooksDescription", label: "Books — Description", type: "textarea", rows: 2,
        default: "Who Made This? — a microhistory of everyday things, and other volumes in progress." },
      { key: "seoCourseTitle", label: "Course — Tab Title", type: "text", default: "Tobi Lawson" },
      { key: "seoCourseDescription", label: "Course — Description", type: "textarea", rows: 2,
        default: "A free course on artificial intelligence for a general audience in Africa: how it works, who builds it, and what it means for work." }
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
    tab: "projects",
    heading: "Ventures & Projects",
    blurb: "Every project appears on the Projects page under its group. Projects with Show on Homepage at Yes also appear on the homepage.",
    titleField: "title",
    subtitleField: "roleTag",
    bodyField: "description",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "roleTag", label: "Role Tag", type: "text", default: "Project / Founder",
        help: 'e.g. "Publication / Co-founder"' },
      { key: "status", label: "Status", type: "text", default: "Active",
        help: 'Shown on the Projects page, e.g. "Active" or "Launching Soon"' },
      { key: "group", label: "Group", type: "select", default: "software",
        options: PROJECT_GROUPS.map((g) => ({ value: g.id, label: g.label })),
        help: "Which heading it sits under on the Projects page." },
      { key: "featured", label: "Show on Homepage", type: "select", default: "no",
        options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
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
      { key: "previewUrl", label: "Preview Page URL", type: "text", path: true, default: "",
        help: "Leave empty to hide the preview button." }
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
    { id: "briclair", title: "Briclair", roleTag: "Fintech Infrastructure / Founder", status: "Active",
      group: "software", featured: "no",
      description: "Identity, accounts and compliance infrastructure for Nigerian fintechs.",
      link: "https://briclair.com" },
    { id: "praiki", title: "Praiki", roleTag: "Business Infrastructure / Founder", status: "Active",
      group: "software", featured: "no",
      description: "Infrastructure for African founders and professionals: vetted help, an operating layer for the business, and escrow that releases when the work ships.",
      link: "https://praiki.com" },
    { id: "prai", title: "Prai", roleTag: "AI Workspace / Founder", status: "Active",
      group: "software", featured: "no",
      description: "An AI workspace for chat, code and agents.",
      link: "https://prai.dev" },
    { id: "crapht", title: "Crapht", roleTag: "Engineering Commons / Founder", status: "Active",
      group: "software", featured: "yes",
      description: "An open commons for engineers who want to build hard things.",
      link: "https://crapht.cloud" },
    { id: "fine-friction", title: "Fine Friction", roleTag: "Holding Company / Co-founder", status: "Active",
      group: "software", featured: "no",
      description: "Holding company for Bombell and Gistbird.",
      link: "https://finefriction.com" },
    { id: "lagos-urban", title: "Lagos Urban Project", roleTag: "Platform / Founder", status: "Active",
      group: "cities", featured: "yes",
      description: "Reimagining Lagos as a more inclusive, livable, and productive city, built from how people live in it.",
      link: "http://lagosurban.com" },
    { id: "long-africa", title: "Long Africa", roleTag: "Institution / Launching Soon", status: "Launching Soon",
      group: "cities", featured: "yes",
      description: "An institution dedicated to the civilisational foundations of African prosperity across multi-decade horizons.",
      link: "http://longafrica.org" },
    { id: "1914-reader", title: "1914 Reader", roleTag: "Publication / Co-founder", status: "Active",
      group: "cities", featured: "no",
      description: "A publication co-founded with Feyi Fawehinmi reading African stories through the lens of global economic change.",
      link: "https://www.1914reader.com/" }
  ],
  posts: [
    {"id":"why-some-things-are-harder-than-others","title":"Why Some Things Are Harder Than Others","category":"Essay","date":"Oct 2026","summary":"Difficulty often arises when an environment fails to make the right action clear, possible, or socially available.","url":"/writing/why-some-things-are-harder-than-others.html","bodyProse":"Some things are difficult for obvious reasons. Climbing a mountain is hard because it is steep, cold, and tiring. Learning a foreign language is hard because it takes time and practice. Solving a difficult mathematical problem is hard because the answer is not immediately clear.\n\nBut much everyday difficulty is stranger than that.\n\nA door will not open because its handle suggests pulling when it needs pushing. A website makes a simple task feel impossible because the relevant setting is buried under three vague menus. A new workplace system is technically straightforward, yet nobody knows where to begin. A student has a useful question but does not ask it because the room does not feel like a place where questions are welcome.\n\nIn each case, the problem is not simply that the person lacks intelligence, effort, or confidence. The problem lies in the relation between the person and the environment around them.\n\nThis is the central insight of affordance theory. An affordance is a possibility for action. A chair affords sitting. A handle affords pulling. A staircase affords climbing. A button affords pressing. But these possibilities are never entirely properties of objects alone. They depend on the body, skills, knowledge, and circumstances of the person encountering them.\n\nA staircase that is easy for an able-bodied adult may be difficult for a child, an older person, someone carrying shopping, or someone using a wheelchair. A piece of software that is simple for an experienced accountant may be opaque to a new employee. A classroom may afford speaking to one student and silence to another.\n\nThis helps explain why some things are harder than others. Difficulty often arises when an environment fails to make the right action clear, possible, or socially available.\n\n## When objects point us in the wrong direction\n\nThe most familiar example is the badly designed door.\n\nA flat metal plate usually suggests pushing. A vertical handle usually suggests pulling. When these cues match the required action, people move through the door without thinking. When they do not, people hesitate, push when they should pull, or pull when they should push.\n\nThe door is not difficult because opening doors is a demanding intellectual exercise. It is difficult because the design presents the wrong possibility for action.\n\nDonald Norman used examples like this to explain why everyday objects can be confusing. Designers often think about what an object can do. Users need to know what they are supposed to do with it. A door may physically allow pushing, but its design may fail to show that pushing is the correct action.\n\nThis distinction matters far beyond doors.\n\nConsider a ticket machine at a railway station. It may offer every function a traveller needs: buying a ticket, changing a journey, applying a discount, collecting a booking. Yet the machine can still be difficult to use if the screen does not make the relevant options visible. The problem is not a lack of functions. It is that the useful functions are hidden, poorly labelled, or presented in the wrong order.\n\nThe same applies to remote controls, coffee machines, hospital equipment, government forms, and mobile apps. A system becomes difficult when it requires users to infer what should have been made clear.\n\nGood design reduces the amount of interpretation people must do before they can act. It does not force them to guess whether a symbol is a button, whether a swipe will reveal a menu, or whether a form has been submitted successfully. It makes the next step legible.\n\nThis is one reason simple-looking products can be so frustrating. They are not always simple. They are merely stripped of visible guidance.\n\n## Difficulty is often a problem of fit\n\nAffordance theory also shows why the same object can be easy for one person and hard for another.\n\nJames Gibson, who developed the original theory, argued that environments should be understood in relation to the organisms moving through them. A surface is not merely flat or sloped. It may be walkable, climbable, sit-on-able, or dangerous, depending on the body and abilities of the person encountering it.\n\nResearch on stairs and doorways makes this point concrete. People do not judge whether stairs are climbable by measuring their height in centimetres. They judge them in relation to their own bodies. A step that feels ordinary to a tall adult may feel uncomfortably high to a small child. A narrow doorway may be easy to pass through alone but awkward when carrying a box.\n\nThis sounds obvious once stated. Yet many environments are still designed as though there were one standard user: healthy, mobile, unhurried, familiar with the setting, and able to devote full attention to the task.\n\nReal people are rarely like that.\n\nA pavement may be easy to cross until someone is pushing a pram. A staircase may be manageable until someone is carrying bags. A kitchen layout may work well for a tall person but strain the back of a shorter one. A form may be clear to someone fluent in bureaucratic language and confusing to someone who is not.\n\nThe task has not changed in an abstract sense. What has changed is the fit between the person and the environment.\n\nThis is why accessibility should not be treated as a specialist concern for a small group of users. It reveals something true about design in general. An environment that works only for people with a narrow range of bodies, abilities, and experience is not neutral. It is poorly fitted to the people who must use it.\n\nA ramp does not merely help wheelchair users. It also helps people with prams, luggage, deliveries, injuries, and limited mobility. Clear signs do not merely help people who are lost. They reduce uncertainty for everyone. Good lighting does not merely make a building safer. It makes the environment easier to read.\n\nThe best designs do not demand that people adapt endlessly to their surroundings. They adapt, where possible, to people.\n\n## Why technology feels harder than it should\n\nDigital systems create a different form of difficulty.\n\nA physical handle has a visible relationship to the action it supports. A button can look pressable. A drawer can look pullable. Digital interfaces often do not have this advantage. A screen can display almost anything. It can make a word look like a button, a button look like plain text, or an important function disappear behind an icon with no obvious meaning.\n\nAs a result, many digital actions depend on convention.\n\nPeople learn that a magnifying-glass icon means search, that three horizontal lines may open a menu, that a cog may lead to settings, and that a blue underlined phrase may be a link. None of these meanings is natural. They are learned through repeated use.\n\nThis is why new software can feel difficult even when it is objectively capable. The user may understand the goal but not the local conventions required to reach it.\n\nImagine an employee who has used one project-management system for years and is then moved to another. They may already understand deadlines, tasks, dependencies, and team communication. Yet they still struggle. The new system uses different labels, different workflows, different defaults, and different assumptions about what a user already knows.\n\nThe difficulty is not ignorance of project management. It is a failure of calibration.\n\nPeople learn how an environment responds to action. They learn which menus contain useful options, which alerts matter, which buttons are safe to press, and which processes lead nowhere. When the environment changes, that knowledge may no longer transfer cleanly.\n\nThis is why software training often fails when it focuses only on features. Users do not need a list of everything a system can do. They need to learn what actions are relevant in the situations they actually face.\n\nA good interface makes this easier by offering clear feedback. It shows what has happened, what can happen next, and how to recover from an error. A bad interface leaves people uncertain. Did the file save? Was the form submitted? Is the system loading, or has it frozen? Can this action be undone?\n\nUncertainty creates work. It makes users stop, check, repeat, and worry. That is difficulty.\n\n## Some actions are socially possible but practically unavailable\n\nNot every affordance is physical or technical. Some are social.\n\nA student may be able to ask a question, in the narrow sense that no physical barrier prevents them from speaking. Yet the classroom may not afford questioning. The teacher may respond impatiently. Other students may laugh. The pace may be too fast. The institution may reward confident performance rather than visible uncertainty.\n\nThe action exists in principle. It does not exist as a live possibility for that student in that moment.\n\nThe same applies at work. An organisation may claim to welcome feedback, but employees may have learned that criticism is ignored or punished. A collaboration platform may have a useful discussion feature, but nobody uses it because the workplace norm is to make decisions privately. A manager may say that anyone can raise concerns, while the structure of meetings makes it clear that only senior people are expected to speak.\n\nIn these cases, the difficulty does not come from a missing tool. It comes from the social environment.\n\nThis matters because institutions often mistake formal permission for practical access. They say that anyone may apply, speak, complain, contribute, or ask for help. But a possibility is not genuinely available merely because it appears in a policy document.\n\nIt must also be visible, understandable, and safe enough to use.\n\nA well-designed organisation does not merely permit action. It creates conditions in which people can recognise and take action without excessive risk. It gives clear routes for raising problems. It makes responsibility visible. It explains what happens after someone speaks up. It does not rely on people to overcome ambiguity, hierarchy, and fear by force of personality.\n\n## Why stress makes simple tasks difficult\n\nAffordance theory also helps explain why ordinary tasks become harder when people are tired, anxious, overloaded, or under pressure.\n\nWhen someone is calm and experienced, they can often see several possible actions at once. They can compare options, notice details, and recover from small mistakes. When someone is stressed, the field of possible action narrows.\n\nA person trying to catch a train may miss an obvious sign because they are scanning for the platform number. Someone filling in an urgent form may overlook instructions that would be clear under normal conditions. A worker facing ten alerts on a dashboard may struggle to identify which one matters most.\n\nThe environment has not necessarily become more complex. But the person’s ability to notice and use what it offers has changed.\n\nThis is why adding more options does not always make a system better. A dashboard with twenty controls may be more powerful than one with five, but it may also make action harder by forcing users to sort through too much information. A workplace with many communication channels may create more opportunities to collaborate, but it may also make it difficult to know where a decision belongs.\n\nEase is not the same as abundance. A good environment does not simply provide many possibilities. It helps people find the relevant one.\n\n## Making the world easier to act in\n\nThe practical value of affordance theory is that it shifts attention away from blaming individuals.\n\nWhen people struggle, the usual explanation is often personal: they were careless, unskilled, resistant, unconfident, or not trying hard enough. Sometimes that is true. But it is often incomplete.\n\nA person may be struggling because the task has been badly specified. The controls may be misleading. The environment may not fit their body. The system may assume knowledge they do not have. The social setting may make a legitimate action feel forbidden. The available options may be too numerous or too poorly organised.\n\nThese are not minor inconveniences. They shape who can participate, who can work independently, who feels competent, and who gives up.\n\nSome things are harder than others because the world does not offer the same actions to everyone in the same way. A useful action may be obvious to one person, hidden from another, easy in one setting, and risky in another.\n\nThe practical lesson is simple. When a task is difficult, do not ask only what the person lacks. Ask what the environment is asking them to do. Ask whether the relevant action is visible. Ask whether it fits the user’s body and skills. Ask whether it depends on conventions they have had no chance to learn. Ask whether the social setting makes the action feel legitimate.\n\nMany everyday difficulties cannot be removed. But many can.\n\nThe aim of good design, good teaching, good technology, and good institutions is not to make every task effortless. It is to stop making ordinary action harder than it needs to be."},
    { id: "product-rules", title: "Product Rules", category: "Essay", date: "Oct 2026",
      summary: "Why African tech companies should enter AI at the application layer.",
      url: "/writing/product-rules.html",
      bodyProse: "In November 2022, OpenAI released ChatGPT, a chat window on top of a language model it had sold to developers for two years. Within five days, a million people had signed up. By January, analysts at UBS estimated 100 million monthly users and called ChatGPT “the fastest-growing consumer application in history.”\n\nThe research behind it was five years old. Google researchers published the transformer architecture in 2017, and OpenAI opened GPT-3 to developers through an API in 2020. Through those years, large language models lived in research papers and the labs of a handful of companies. Google had built LaMDA, a capable conversational model of its own, and kept it inside the company.\n\nChatGPT changed the audience. A student or a shopkeeper could type a question and get an answer back in plain language. Within weeks, Google's management had declared a “code red”, The New York Times reported, and by late January Microsoft had committed a multibillion-dollar investment in OpenAI. The research had existed for five years; the wave started when a product put it in front of the public.\n\n## The pattern is old\n\nThe same sequence has played out before. Engineers at Xerox PARC built a computer with windows, icons and a mouse in 1973. The Alto never went on sale to the public. Apple's Macintosh brought the graphical interface to homes and offices in 1984, and Windows followed.\n\nText messaging ran on mobile networks for years before Safaricom launched M-Pesa in Kenya in 2007 and turned it into a way to send money. M-Pesa used technology the networks already had. The new part was a product that a market trader in Nairobi could use to pay a supplier.\n\nIn both cases, the technology existed for years before a product put it in the hands of ordinary users, and adoption dates from the product.\n\n## Products are the moat\n\nBreakthrough technology spreads within months. Researchers publish papers and change employers, and competitors reverse-engineer what they can't read about. Within two years of ChatGPT's launch, Anthropic, Google, Meta and Mistral had released models that matched or beat the one behind the original ChatGPT. In January 2025, the Chinese lab DeepSeek released R1, an open-weight reasoning model that performed close to OpenAI's o1 and cost about a thirtieth as much to use.\n\nIf the model were the advantage, OpenAI would have lost its lead the day those models shipped. It kept the lead because of the product: the habit of hundreds of millions of people who open ChatGPT first, and the memory of their past conversations. A business model grows from that relationship with users. Subscriptions and enterprise contracts depend on people choosing the product, and OpenAI can swap or improve the model underneath without losing them.\n\nFirms that bet on owning a technology watch their lead shrink with every paper their rivals publish. Firms that own a product their customers love can absorb new technology as it arrives, including the competition's.\n\n## Africa's way in\n\nThe argument bears on the debate about Africa's place in the AI race. Much of that debate centres on foundation models: whether the continent needs its own, trained on African languages and data, and how to pay for the compute. Those are fair goals. Training a frontier model costs hundreds of millions of dollars, and the labs that do it draw on revenue from products that already serve customers at scale.\n\nI'd argue African tech companies should enter at the application layer. Build products on top of the best available models, and make them good enough that consumers around the world choose them, beyond the home market. OpenAI's lead since 2022 has rested on its product, and the same layer is open to African companies.\n\nRevenue from those products can then fund the longer project. A company with paying users across several markets can afford researchers and compute, and it knows from its own customers which problems a native model should solve. The sequence runs from products to revenue, and from revenue to research into models built for African languages and needs." }
  ],
  books: [
    {"id":"who-made-this","title":"WHO MADE THIS?","subtitle":"A microhistory of everyday things","statusTag":"FORTHCOMING • IN WRITING","coverImageUrl":"/assets/who-made-this-cover.jpg","synopsisP1":"The stories behind 26 everyday objects, most of them part of daily life in Nigeria: the okada, the generator, garri, pure water, ankara, the jerry can and the plastic chair.","synopsisP2":"Each chapter starts with one object and follows it back through the people, accidents and trade that made it. Chapter One follows the okada, the motorcycle taxi named after an airline that folded in 1997.","author":"Tobi Lawson","format":"","releaseDate":"","previewUrl":"/books/chapter#book=who-made-this&chapter=01-the-okada","chapters":[{"id":"01-the-okada","title":"The okada","status":"Chapter 01 · Getting Around","desc":"Named after a defunct Nigerian airline, because it got you there fast.","bodyProse":"## The Word That Outlived the Airline\n\nIn September 1983, on the tarmac of the small airport at Benin City, Chief Gabriel Osawaru Igbinedion climbed the steps of a BAC One-Eleven painted in his own airline's colours for the first time. He already knew the aircraft type well. Two years earlier he had bought one secondhand for his own use — a plane that had previously flown as part of the presidential fleet of Ferdinand Marcos, the president of the Philippines, who would be driven from power in 1986. Now there were several of them, arranged on the apron in a small fleet, each tail marked with the same image: the wide-set eyes and coral-beaded collar of Queen Idia, the sixteenth-century mother of Oba Esigie of Benin, an icon so central to Edo identity that it had already, a decade earlier, become the official emblem of FESTAC '77, Africa's largest festival of arts and culture.\n\nIgbinedion had named the airline after the place he was born: Okada, a farming town roughly an hour's drive from Benin City, whose only real landmark, until then, was a hill above a river. He was, at 49, already one of the wealthiest men in the country — a former police officer who had gone on to build Nigeria's first indigenous car assembly plant, and who now held stakes in banking, oil, hotels, and television. The airline would turn out to be the least durable of his ventures. Okada Air folded in 1997, fourteen years after that first flight, undone by the slow accumulation of maintenance bills and a national economy that made almost everything more expensive by the month.\n\nBut the airline's name did not die with it. It migrated, sometime in the years after that first flight, onto an entirely different machine: the motorcycle taxi, ridden by the millions through the traffic of Lagos, Benin City, Kano, and every Nigerian city large enough to have traffic worth beating. By January 2020, when the Oxford English Dictionary added twenty-nine Nigerian words and senses to its official record, *okada* was among them, defined simply as \"a motorcycle that is used as a taxi.\" The dictionary noted, almost as an aside, that the word referred to the airline's reputation for getting people where they needed to go quickly. Most of the Nigerians who used the word every day had no idea an airline was involved at all.\n\nHow does the name of a defunct airline become the English language's word for a motorcycle taxi? The answer runs through a German workshop in 1885, a Japanese factory in 1958, an economic collapse in the late 1980s, and a joke that Lagosians told so often it stopped being a joke and became a fact.\n\n### A Machine Nobody Meant to Build\n\nThe vehicle riding under that borrowed name has its own long and mostly accidental history, and it begins nowhere near Nigeria.\n\nIn May 1885, in a workshop in Cannstatt, Germany, the engineer Gottlieb Daimler and his collaborator Wilhelm Maybach bolted a compact petrol engine onto a wooden bicycle frame reinforced with a pair of small stabilising wheels. They called it the *Reitwagen* — the \"riding car\" — though calling it a motorcycle would have surprised them both. Daimler had no interest in building a two-wheeled vehicle for its own sake; the *Reitwagen* was a rolling test bed for the engine he actually wanted to perfect, the one that would power the world's first automobile within the year. To prove the engine worked, he sent his teenage son Paul on a short, shaking ride between Cannstatt and the neighbouring town of Untertürkheim. The machine wobbled so badly at low speed that the outrigger wheels were, by most accounts, a necessity rather than a design flourish. Daimler patented the device that August. He never manufactured a second one for sale. The original burned in a factory fire in 1903, and Daimler is remembered today as \"the father of the motorcycle\" for an invention he built purely to get somewhere else.\n\nThe industry that Daimler never intended to start took most of the next seventy years to become the machine now familiar on every Nigerian street corner. European and American manufacturers spent the turn of the century bolting engines to bicycle frames of increasing sophistication; the Isle of Man began holding motorcycle endurance races in 1907, partly to prove to buyers that the things wouldn't fall apart. But the transformation that mattered most for Nigeria happened in Japan. Soichiro Honda founded his company in 1948 out of the wreckage of a wartime economy, and in 1958 his factory released the Super Cub: cheap, light, nearly impossible to break, and easy enough to repair that a market trader with no formal training could keep one running for a decade. Honda pushed the Super Cub and its many descendants into Asia, then Africa, then Latin America, at prices that undercut anything built for the wealthier markets of Europe or North America. By the time motorcycle taxis needed a supply of cheap, durable machines to feed Nigeria's growing informal transport trade, Honda and a handful of Indian and Chinese manufacturers had already spent decades building exactly that.\n\nEvery okada on Nigerian roads today — whether it carries a Honda badge, a Bajaj badge, or no recognisable badge at all — is a great-grandchild of a machine Gottlieb Daimler built to test an engine, not to ride.\n\n### The Man Who Named a Town\n\nThe name attached to that machine belongs to a much smaller and more particular story: the life of Chief Gabriel Igbinedion, and the town he came from.\n\nOkada sits in Ovia North-East Local Government Area of Edo State, its name derived, in the Edo language, from *Oke* and *Ada* — \"the hilltop of the River Ada.\" For most of its history it was known, if at all, only to the people who farmed around it. Igbinedion changed that twice over: once by building the airline that carried the town's name into national conversation, and again, much later, by founding Igbinedion University on the same site in 1999, Nigeria's first private university.\n\nBetween those two acts sat a career that reads like a catalogue of what a single ambitious Nigerian could accumulate across four decades. Igbinedion joined the police force as a young man and left it for business, founding Mid-Motors Nigeria Limited in 1968 — the country's first indigenous motor vehicle assembly plant — before expanding into banking, oil marketing, hotels, and broadcasting. He holds the traditional title of Esama of Benin, \"son of the people,\" conferred by the Oba — the traditional ruler of the Benin Kingdom, a role that has survived every political system Nigeria has passed through since long before independence. By the early 1980s he was wealthy enough to buy a used presidential jet from a country he had no obvious connection to, simply because the aircraft became available and he had the means to acquire it. That single purchase — the Marcos jet — turned out to be a kind of rehearsal for the airline that followed two years later.\n\nOkada Air, once airborne, grew into one of the largest privately owned carriers in Africa. At its peak it operated more than forty aircraft, including Boeing 727s, a Boeing 747, and a scattering of smaller Dorniers, flying nine domestic routes and, from 1992, international charters that carried Nigerian pilgrims to Saudi Arabia. For a stretch of the 1980s and early 1990s, Okada Air was one of the clearest available proofs that Nigerian private enterprise could do something well — fast, efficient, and privately run — in an era when the machinery of the Nigerian state itself was visibly grinding down.\n\nThat contrast is what gave the airline's name its second life.\n\n### The Joke That Became a Word\n\nCommercial motorcycle taxis did not begin in Lagos, and they did not begin as a joke about an airline. The practice surfaced first in the early 1970s in Cross River State, in Nigeria's south-south, where riders known locally by other names carried farm produce and the occasional passenger along roads too rough for anything larger. Around the same time, under the name *achaba*, motorcycles were doing similar work in Yola and the wider Gongola region in the north. Lagos picked up the practice later, arriving through a cluster of riders working out of Agege in the late 1970s — modest, informal, and mostly unremarked upon.\n\nIt was the collapse of the 1980s that turned a marginal practice into a citywide necessity. In 1986 the Babangida government adopted the Structural Adjustment Programme, a package of conditions attached to IMF and World Bank lending: subsidies removed, the naira devalued, state enterprises pushed toward privatisation, public spending cut. The programme was designed to correct an economy too dependent on oil. What it produced in the short term was inflation, mass job losses, and — critically for this story — the further deterioration of state-run urban transport that had never been especially reliable to begin with. Lagos had grown from roughly 665,000 people in 1963 to nearly five million by 1991, on roads and bus routes that had never come close to catching up. When the state bus companies buckled further under SAP, nothing organised rose to take their place, especially not in the low-income neighbourhoods where paved roads were scarce and formal transport operators saw little profit in running routes.\n\nMotorcycles filled the gap because they were the only machine cheap enough, small enough, and simple enough to work without anyone's permission. They needed no licence, no fixed route, and comparatively little capital — which mattered enormously to the young men who had just lost formal-sector jobs, or had never found one to lose. For passengers, an okada offered the one thing a paralysed city could no longer promise: a reasonable chance of arriving somewhere on time.\n\nIt was against this backdrop — motorcycles multiplying through neighbourhoods that had once had almost none, at exactly the moment Okada Air was becoming a familiar name in Nigerian aviation — that the nickname took hold. The joke was simple enough to spread on its own: these motorcycles, weaving between stalled cars and slipping down alleys too narrow for a bus, moved you through the city the way Okada Air moved you through the sky — fast, a little reckless, and more reliable than whatever the government was running. The comparison was ironic (an air carrier and a motorcycle share almost nothing except speed and a willingness to take a risk) and that irony was exactly why it stuck. By the time the airline folded in 1997, the joke had already outgrown it. Lagosians kept calling the bikes *okada* long after most of them had stopped remembering, or had never known, where the word came from.\n\nNigeria was not alone in needing a name for this machine. Across West and Central Africa, the same economic pressures produced the same informal transport solution, and each country coined its own word for it: *zémidjan* in Benin Republic, meaning roughly \"take me quickly\" in the Fon language; *oléyia* in Togo; *bendskin* in Cameroon; *boda-boda* in Uganda and Kenya, a phrase that began as shorthand for \"border to border,\" describing bikes that once ferried people across a closed Kenya–Uganda frontier. Nigeria's contribution to this shared vocabulary happened to be the one an international dictionary eventually noticed. In January 2020, alongside words like *mama put* and *Kannywood*, the Oxford English Dictionary made *okada* official — a small, quiet acknowledgment that an airline's collapse had left behind something more durable than the airline itself.\n\n### Every Governor Has Tried to Kill It\n\nA word that survives an airline's death turns out to be considerably harder to kill than the vehicle it names — as one Lagos State governor after another has discovered since the return of democracy in 1999.\n\nBola Tinubu threatened a ban in 2005, citing riders' \"destructive tendencies.\" Babatunde Fashola followed in 2012 with a more targeted approach, banning okadas from 475 specific routes, including Ikorodu Road and the Lagos–Badagry expressway; riders simply relocated to the inner streets the ban didn't cover, and the promised full ban never arrived. The most sweeping attempt came under Babajide Sanwo-Olu in 2020, invoking the Lagos State Transport Sector Reform Law of 2018 to restrict commercial motorcycles across six local government areas, nine local council development areas, and ten major highways. Each ban has cited some combination of road safety and security — in the north, motorcycles' use by Boko Haram insurgents has justified far harsher restrictions, displacing riders who had nothing to do with the insurgency and pushing many of them south, toward Lagos. And each ban has produced roughly the same aftermath: crowded bus stops, long walks for commuters who once rode, riders relocating rather than disappearing, and an okada population that never actually shrinks by much. As one Lagos newspaper put it bluntly in 2021, a state whose population never sleeps was never going to be able to permanently ban the one vehicle nimble enough to move through it.\n\nThe clearest test of whether the okada trade could be improved rather than merely banned came, briefly, from a wave of ride-hailing startups. Between 2017 and 2020, Gokada, MAX.ng, and ORide — the last backed by the Chinese firm Opera — raised tens of millions of dollars between them to bring helmets, insurance, GPS tracking, and fixed pricing to a trade that had none of those things. It was, in miniature, an attempt to build the version of the okada that safety advocates and regulators claimed to want. When the 2020 ban arrived, it swept up the regulated startups along with the unregulated riders they had been trying to improve on. Gokada laid off most of its staff and pivoted to food delivery; ORide stopped carrying passengers altogether. The question a TechCrunch analysis asked at the time has never really been answered: if Lagos, supposedly Nigeria's most tech-friendly city, would shut down well-funded, well-regulated operators trying to make an informal trade safer, what exactly was the state's objection — the motorcycles, or the informality?\n\nThe human cost behind all of this shows up most starkly at the National Orthopaedic Hospital in Igbobi, Lagos, where a section of wards became so associated with motorcycle injuries in the early years of the okada boom that patients and staff began calling it, informally, the okada ward. Head injuries remain the leading cause of okada-related death across the region, driven by low helmet use, overloading, poor roads, and the absence of insurance in most informal operations. And still the bikes keep running, because for millions of Nigerians the maths is simple: the risk of a crash is real, but the certainty of being stuck — late for work, late for a market that closes, late for a shift that starts before the first bus does — is worse.\n\n### What Travelled, and What Stayed\n\nAlmost nothing about the okada originated in Nigeria, and almost everything about what it has become is entirely Nigerian.\n\nThe engine traces back to a German workshop that never meant to build a motorcycle. The mass-market design that made it affordable came from a Japanese company rebuilding itself after a war. The particular machines riding Nigerian roads today were assembled in India or manufactured in China, imported by the container-load through ports that Okada Air's founder, in his other businesses, would have recognised the logic of. The economic vacuum that made motorcycle taxis a necessity rather than a curiosity was manufactured in Washington, at the IMF and the World Bank, and administered in Lagos by a military government trying to save an oil economy from itself. Only the name is purely, locally Nigerian — borrowed from a small Edo town, carried into national fame by one ambitious man's airline, and then handed, almost as a joke, to the machine that outlasted it.\n\nThat is, in the end, the whole shape of the story: an airline built to prove that Nigerian enterprise could move fast when the state could not, folding after fourteen years, while the word it left behind kept moving — through Lagos traffic, through Kano's back streets, through the pages of the world's most authoritative dictionary of the English language — long after anyone needed to remember where it came from."},{"id":"02-the-car","title":"The car","status":"Chapter 02 · Getting Around","desc":"The first ran on steam in 1769, and Bertha Benz proved the petrol version worked by driving off without telling her husband.","bodyProse":""},{"id":"03-the-bicycle","title":"The bicycle","status":"Chapter 03 · Getting Around","desc":"Invented partly because a volcano caused a famine that killed the working horses.","bodyProse":""},{"id":"04-the-tyre","title":"The tyre","status":"Chapter 04 · Getting Around","desc":"Vulcanised rubber was an accident, and the trade behind it ran through colonial brutality.","bodyProse":""},{"id":"05-the-generator","title":"The generator","status":"Chapter 05 · Light and Power","desc":"How the absence of public power turned a backup machine into a national object.","bodyProse":""},{"id":"06-the-match","title":"The match","status":"Chapter 06 · Light and Power","desc":"Harder to invent than the light bulb, and early makers lost their jaws to white phosphorus.","bodyProse":""},{"id":"07-the-light-bulb","title":"The light bulb","status":"Chapter 07 · Light and Power","desc":"Edison did not invent it. He won the system and the marketing around it.","bodyProse":""},{"id":"08-the-battery","title":"The battery","status":"Chapter 08 · Light and Power","desc":"Volta stacked metal and brine in 1800, and every device you own descends from that pile.","bodyProse":""},{"id":"09-garri","title":"Garri","status":"Chapter 09 · What We Eat and Drink","desc":"Cassava is South American, and the traditional way of removing its cyanide is real chemistry nobody called science.","bodyProse":""},{"id":"10-pure-water","title":"Pure water","status":"Chapter 10 · What We Eat and Drink","desc":"The sachet that solved Nigerian thirst and created a plastic problem.","bodyProse":""},{"id":"11-the-maggi-cube","title":"The Maggi cube","status":"Chapter 11 · What We Eat and Drink","desc":"A Swiss miller's invention to get cheap protein into poor workers.","bodyProse":""},{"id":"12-the-tin-can","title":"The tin can","status":"Chapter 12 · What We Eat and Drink","desc":"Invented for Napoleon's army, yet the can opener arrived almost fifty years later.","bodyProse":""},{"id":"13-salt-and-sugar","title":"Salt and sugar","status":"Chapter 13 · What We Eat and Drink","desc":"Salt once paid Roman soldiers, the root of the word salary; sugar was paid for in lives.","bodyProse":""},{"id":"14-ankara","title":"Ankara","status":"Chapter 14 · On the Body","desc":"Sold as the most African cloth there is, its design is Indonesian batik, industrialised by the Dutch and printed in Manchester.","bodyProse":""},{"id":"15-the-chewing-stick","title":"The chewing stick","status":"Chapter 15 · On the Body","desc":"West African oral care that modern dentistry later confirmed actually works.","bodyProse":""},{"id":"16-the-mirror","title":"The mirror","status":"Chapter 16 · On the Body","desc":"Venice guarded the silvering secret so tightly that leaving the island could be a death sentence.","bodyProse":""},{"id":"17-soap","title":"Soap","status":"Chapter 17 · On the Body","desc":"The strange road from ash and fat to luxury good to public-health tool.","bodyProse":""},{"id":"18-the-zip","title":"The zip","status":"Chapter 18 · On the Body","desc":"Took twenty years and a name change to catch on.","bodyProse":""},{"id":"19-cowrie-shells","title":"Cowrie shells","status":"Chapter 19 · Counting and Keeping","desc":"Real money in Nigeria for centuries, woven into the same Atlantic trade that moved people.","bodyProse":""},{"id":"20-airtime","title":"Airtime","status":"Chapter 20 · Counting and Keeping","desc":"How Nigeria skipped landlines and jumped straight to mobile.","bodyProse":""},{"id":"21-zero","title":"Zero","status":"Chapter 21 · Counting and Keeping","desc":"The numbers we call Arabic are Indian, and zero was once treated as dangerous.","bodyProse":""},{"id":"22-the-pencil","title":"The pencil","status":"Chapter 22 · Counting and Keeping","desc":"No single person on earth knows how to make one from scratch.","bodyProse":""},{"id":"23-the-jerry-can","title":"The jerry can","status":"Chapter 23 · Around the House and Street","desc":"A German military design so good the Allies copied it, which is the reason it is called a jerry can.","bodyProse":""},{"id":"24-the-plastic-chair","title":"The plastic chair","status":"Chapter 24 · Around the House and Street","desc":"The same white stackable chair sits in every country on the planet.","bodyProse":""},{"id":"25-the-padlock","title":"The padlock","status":"Chapter 25 · Around the House and Street","desc":"The mechanism your keys rely on is around four thousand years old.","bodyProse":""},{"id":"26-the-clock","title":"The clock","status":"Chapter 26 · Around the House and Street","desc":"We split the hour into sixty because the Babylonians counted in sixties.","bodyProse":""}]}
  ],
  lessons: [
    {
      "id": "module-01-how-ai-runs",
      "moduleNumber": "MODULE 01",
      "title": "How AI runs",
      "status": "Planned",
      "summary": "The chips, data centres, power and connections AI depends on, and where Africa sits in that chain.",
      "textContent": "",
      "videoType": "none",
      "videoUrl": ""
    },
    {
      "id": "module-02-the-models",
      "moduleNumber": "MODULE 02",
      "title": "The models",
      "status": "Planned",
      "summary": "What a model is, how it learns from data, and why a handful of companies build most of them.",
      "textContent": "",
      "videoType": "none",
      "videoUrl": ""
    },
    {
      "id": "module-03-the-applications",
      "moduleNumber": "MODULE 03",
      "title": "The applications",
      "status": "Planned",
      "summary": "The products built on top of models, and the problems they can and cannot solve yet.",
      "textContent": "",
      "videoType": "none",
      "videoUrl": ""
    },
    {
      "id": "module-04-work-and-disruption",
      "moduleNumber": "MODULE 04",
      "title": "Work and disruption",
      "status": "Planned",
      "summary": "Which jobs AI changes first, and what that means for workers and employers in African economies.",
      "textContent": "",
      "videoType": "none",
      "videoUrl": ""
    },
    {
      "id": "module-05-the-opportunities",
      "moduleNumber": "MODULE 05",
      "title": "The opportunities",
      "status": "Planned",
      "summary": "Where Africans can build, invest and find work as AI spreads.",
      "textContent": "",
      "videoType": "none",
      "videoUrl": ""
    }
  ]
};

export const SCHEMA_VERSION = 3;
