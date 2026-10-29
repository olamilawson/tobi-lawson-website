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
      { key: "aboutHeroTitle", label: "Headline", type: "text", default: "About Tobi Lawson" },
      { key: "aboutHeroSubtitle", label: "Lead Paragraph", type: "textarea", rows: 3,
        default: "Investor and builder based in Lagos. Background in investment analysis and development research, now running companies across fintech, SME services, and education technology." },
      { key: "aboutProfileImage", label: "Portrait Photo", type: "image", default: "/assets/tobi-lawson.jpg" },
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
    { id: "product-rules", title: "Product Rules", category: "Essay", date: "Oct 2026",
      summary: "Why African tech companies should enter AI at the application layer.",
      url: "/writing/product-rules.html",
      bodyProse: "In November 2022, OpenAI released ChatGPT, a chat window on top of a language model it had sold to developers for two years. Within five days, a million people had signed up. By January, analysts at UBS estimated 100 million monthly users and called ChatGPT “the fastest-growing consumer application in history.”\n\nThe research behind it was five years old. Google researchers published the transformer architecture in 2017, and OpenAI opened GPT-3 to developers through an API in 2020. Through those years, large language models lived in research papers and the labs of a handful of companies. Google had built LaMDA, a capable conversational model of its own, and kept it inside the company.\n\nChatGPT changed the audience. A student or a shopkeeper could type a question and get an answer back in plain language. Within weeks, Google's management had declared a “code red”, The New York Times reported, and by late January Microsoft had committed a multibillion-dollar investment in OpenAI. The research had existed for five years; the wave started when a product put it in front of the public.\n\n## The pattern is old\n\nThe same sequence has played out before. Engineers at Xerox PARC built a computer with windows, icons and a mouse in 1973. The Alto never went on sale to the public. Apple's Macintosh brought the graphical interface to homes and offices in 1984, and Windows followed.\n\nText messaging ran on mobile networks for years before Safaricom launched M-Pesa in Kenya in 2007 and turned it into a way to send money. M-Pesa used technology the networks already had. The new part was a product that a market trader in Nairobi could use to pay a supplier.\n\nIn both cases, the technology existed for years before a product put it in the hands of ordinary users, and adoption dates from the product.\n\n## Products are the moat\n\nBreakthrough technology spreads within months. Researchers publish papers and change employers, and competitors reverse-engineer what they can't read about. Within two years of ChatGPT's launch, Anthropic, Google, Meta and Mistral had released models that matched or beat the one behind the original ChatGPT. In January 2025, the Chinese lab DeepSeek released R1, an open-weight reasoning model that performed close to OpenAI's o1 and cost about a thirtieth as much to use.\n\nIf the model were the advantage, OpenAI would have lost its lead the day those models shipped. It kept the lead because of the product: the habit of hundreds of millions of people who open ChatGPT first, and the memory of their past conversations. A business model grows from that relationship with users. Subscriptions and enterprise contracts depend on people choosing the product, and OpenAI can swap or improve the model underneath without losing them.\n\nFirms that bet on owning a technology watch their lead shrink with every paper their rivals publish. Firms that own a product their customers love can absorb new technology as it arrives, including the competition's.\n\n## Africa's way in\n\nThe argument bears on the debate about Africa's place in the AI race. Much of that debate centres on foundation models: whether the continent needs its own, trained on African languages and data, and how to pay for the compute. Those are fair goals. Training a frontier model costs hundreds of millions of dollars, and the labs that do it draw on revenue from products that already serve customers at scale.\n\nI'd argue African tech companies should enter at the application layer. Build products on top of the best available models, and make them good enough that consumers around the world choose them, beyond the home market. OpenAI's lead since 2022 has rested on its product, and the same layer is open to African companies.\n\nRevenue from those products can then fund the longer project. A company with paying users across several markets can afford researchers and compute, and it knows from its own customers which problems a native model should solve. The sequence runs from products to revenue, and from revenue to research into models built for African languages and needs." }
  ],
  books: [
    {"id":"who-made-this","title":"WHO MADE THIS?","subtitle":"A microhistory of everyday things","statusTag":"FORTHCOMING • IN WRITING","coverImageUrl":"/assets/who-made-this-cover.jpg","synopsisP1":"The stories behind 26 everyday objects, most of them part of daily life in Nigeria: the okada, the generator, garri, pure water, ankara, the jerry can and the plastic chair.","synopsisP2":"Each chapter starts with one object and follows it back through the people, accidents and trade that made it. Chapter One follows the okada, the motorcycle taxi named after an airline that folded in 1997.","author":"Tobi Lawson","format":"","releaseDate":"","previewUrl":"","chapters":[{"id":"01-the-okada","title":"The okada","status":"Chapter 01 · Getting Around","desc":"Named after a defunct Nigerian airline, because it got you there fast.","bodyProse":""},{"id":"02-the-car","title":"The car","status":"Chapter 02 · Getting Around","desc":"The first ran on steam in 1769, and Bertha Benz proved the petrol version worked by driving off without telling her husband.","bodyProse":""},{"id":"03-the-bicycle","title":"The bicycle","status":"Chapter 03 · Getting Around","desc":"Invented partly because a volcano caused a famine that killed the working horses.","bodyProse":""},{"id":"04-the-tyre","title":"The tyre","status":"Chapter 04 · Getting Around","desc":"Vulcanised rubber was an accident, and the trade behind it ran through colonial brutality.","bodyProse":""},{"id":"05-the-generator","title":"The generator","status":"Chapter 05 · Light and Power","desc":"How the absence of public power turned a backup machine into a national object.","bodyProse":""},{"id":"06-the-match","title":"The match","status":"Chapter 06 · Light and Power","desc":"Harder to invent than the light bulb, and early makers lost their jaws to white phosphorus.","bodyProse":""},{"id":"07-the-light-bulb","title":"The light bulb","status":"Chapter 07 · Light and Power","desc":"Edison did not invent it. He won the system and the marketing around it.","bodyProse":""},{"id":"08-the-battery","title":"The battery","status":"Chapter 08 · Light and Power","desc":"Volta stacked metal and brine in 1800, and every device you own descends from that pile.","bodyProse":""},{"id":"09-garri","title":"Garri","status":"Chapter 09 · What We Eat and Drink","desc":"Cassava is South American, and the traditional way of removing its cyanide is real chemistry nobody called science.","bodyProse":""},{"id":"10-pure-water","title":"Pure water","status":"Chapter 10 · What We Eat and Drink","desc":"The sachet that solved Nigerian thirst and created a plastic problem.","bodyProse":""},{"id":"11-the-maggi-cube","title":"The Maggi cube","status":"Chapter 11 · What We Eat and Drink","desc":"A Swiss miller's invention to get cheap protein into poor workers.","bodyProse":""},{"id":"12-the-tin-can","title":"The tin can","status":"Chapter 12 · What We Eat and Drink","desc":"Invented for Napoleon's army, yet the can opener arrived almost fifty years later.","bodyProse":""},{"id":"13-salt-and-sugar","title":"Salt and sugar","status":"Chapter 13 · What We Eat and Drink","desc":"Salt once paid Roman soldiers, the root of the word salary; sugar was paid for in lives.","bodyProse":""},{"id":"14-ankara","title":"Ankara","status":"Chapter 14 · On the Body","desc":"Sold as the most African cloth there is, its design is Indonesian batik, industrialised by the Dutch and printed in Manchester.","bodyProse":""},{"id":"15-the-chewing-stick","title":"The chewing stick","status":"Chapter 15 · On the Body","desc":"West African oral care that modern dentistry later confirmed actually works.","bodyProse":""},{"id":"16-the-mirror","title":"The mirror","status":"Chapter 16 · On the Body","desc":"Venice guarded the silvering secret so tightly that leaving the island could be a death sentence.","bodyProse":""},{"id":"17-soap","title":"Soap","status":"Chapter 17 · On the Body","desc":"The strange road from ash and fat to luxury good to public-health tool.","bodyProse":""},{"id":"18-the-zip","title":"The zip","status":"Chapter 18 · On the Body","desc":"Took twenty years and a name change to catch on.","bodyProse":""},{"id":"19-cowrie-shells","title":"Cowrie shells","status":"Chapter 19 · Counting and Keeping","desc":"Real money in Nigeria for centuries, woven into the same Atlantic trade that moved people.","bodyProse":""},{"id":"20-airtime","title":"Airtime","status":"Chapter 20 · Counting and Keeping","desc":"How Nigeria skipped landlines and jumped straight to mobile.","bodyProse":""},{"id":"21-zero","title":"Zero","status":"Chapter 21 · Counting and Keeping","desc":"The numbers we call Arabic are Indian, and zero was once treated as dangerous.","bodyProse":""},{"id":"22-the-pencil","title":"The pencil","status":"Chapter 22 · Counting and Keeping","desc":"No single person on earth knows how to make one from scratch.","bodyProse":""},{"id":"23-the-jerry-can","title":"The jerry can","status":"Chapter 23 · Around the House and Street","desc":"A German military design so good the Allies copied it, which is the reason it is called a jerry can.","bodyProse":""},{"id":"24-the-plastic-chair","title":"The plastic chair","status":"Chapter 24 · Around the House and Street","desc":"The same white stackable chair sits in every country on the planet.","bodyProse":""},{"id":"25-the-padlock","title":"The padlock","status":"Chapter 25 · Around the House and Street","desc":"The mechanism your keys rely on is around four thousand years old.","bodyProse":""},{"id":"26-the-clock","title":"The clock","status":"Chapter 26 · Around the House and Street","desc":"We split the hour into sixty because the Babylonians counted in sixties.","bodyProse":""}]}
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
