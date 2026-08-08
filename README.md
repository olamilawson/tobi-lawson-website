# Tobi Lawson — Personal Website & Design System Specification

Welcome! This repository contains the static personal website for **Tobi Lawson** — an investor and builder based in Lagos, Nigeria. The site hosts long-form essays, book reviews, project showcases, and personal background information.

This document serves as a comprehensive overview of the site structure, technical architecture, and the design system adopted across the codebase.

---

## 📌 Project Overview & Brand Persona

- **Subject / Owner:** Tobi Lawson
- **Focus Areas:** Venture capital, fintech, edutech, urban development (*Lagos Urban Project*), economics & governance (*1914 Reader*, *Long Africa*).
- **Brand Tone:** High-contrast editorial, minimal, bold serif display typography, institutional, long-form reading experience.
- **Primary Goals:**
  1. Highlight core initiatives and venture projects (*1914 Reader*, *Lagos Urban Project*, *Long Africa*).
  2. Provide a clean, readable typographic layout for long-form essays and book reviews.
  3. Offer an intuitive navigation experience across desktop and mobile devices.

---

## 📁 Repository Structure

```
.
├── index.html               # Home page (Hero with SVG scribble highlight, Projects, Recent Writing)
├── books.html               # Books catalog showcase (Who Made This?, Monographs, Table of Contents)
├── about.html               # Bio, venture summary, and contact CTA
├── now.html                 # Current status page ("Now" page pattern)
├── base.css                 # CSS reset, accessibility defaults, typography base
├── style.css                # Primary design tokens, theme variables, component styles
├── app.js                   # Client-side JS: Smooth scrolling and interactions
├── assets/
│   ├── favicon.svg          # Minimalist brand logo / SVG icon
│   └── who-made-this-cover.jpg # High-resolution cover artwork for "Who Made This?"
├── books/
│   └── who-made-this-preview.html # Interactive Ordinary Abundance-inspired Preview Reader (Ch. 1)
└── writing/
    ├── index.html           # Writing hub catalog (all essays & reviews)
    ├── patient-capital-impatient-markets.html  # Essay: Investment vs development timelines
    ├── review-how-asia-works.html              # Book review: Joe Studwell's "How Asia Works"
    └── the-shape-lagos-takes.html              # Essay: Informal urbanism in Lagos
```

---

## 🎨 Design System Architecture (`style.css` & `base.css`)

### 1. Typography Tokens
- `--font-display`: `'Playfair Display', serif`
- `--font-sans`: `'Inter', sans-serif`

Fluid type scale & typography rules:
- Major headings (`h1`): `clamp(3.5rem, 8vw, 8.5rem)`
- Section headers (`h2`): `clamp(2.25rem, 4vw, 3.75rem)`
- Sub-headings (`h3`): `1.25rem` (semi-bold)
- Metadata & Tags (`.meta`): Uppercase `Inter` font, `0.65rem` size, `700` weight, `0.15em` letter-spacing.

### 2. Color Palette & Layout Tokens
- **Background (`--bg`):** `#f4f4f2` (Soft warm bone white)
- **Text (`--text`):** `#111111` (Stark off-black)
- **Accent (`--accent`):** `#ff3d00` (Electric orange-red circle CTA)
- **Line Dividers (`--line`):** `#d0d0ce` (Crisp 1px borders)
- **Container Padding:** `--container-padding` (`4rem` desktop / `1.5rem` mobile)
- **Grid Gap:** `--grid-gap` (`2rem`)

---

## 🧩 Key Component Classes

- `.header-nav`: Top navigation bar with bottom line border and animated link underline effect (`a::after`).
- `.hero`: Impactful header with giant Playfair Display headline, handwritten SVG stroke scribble underline animation around key emphasis words, and floating circular orange CTA button (`.circle-cta`).
- `.book-hero-showcase`: 3D tilting book frame showcase with metadata list, status badge, and dual CTA group.
- `.ordinary-reader-grid`: Multi-column reader layout featuring chapter prose alongside side marginalia quotes (`.marginalia-card`) and object spotlights (`.object-spotlight`).
- `.highlight-wrapper` & `.scribble`: Handwritten SVG stroke path animated with `@keyframes drawScribble`.
- `.circle-cta`: Floating circular CTA badge with electric orange fill (`#ff3d00`), white uppercase text, and scale-up hover animation.
- `.section-header`: Bottom-bordered divider header sectioning main areas of pages.
- `.grid-3` & `.grid-item`: 3-column responsive card layout with top line border (`.grid-item-header`) and grayscale-to-color hover transition (`filter: grayscale(100%)`).
- `.prose-container` & `.article-body`: Max-width 760px centered prose layout engineered for comfortable long-form reading.
- `.fade-up`: Smooth page entry animation with stagger delays (`.delay-1`, `.delay-2`, `.delay-3`).

---

## 🚀 Guidance for Maintenance

1. **Tokens First:** All colors, line colors, typography choices, and spacing live as CSS variables in `:root` inside [style.css](file:///Users/praikitechnologies/Desktop/Personal/Mine/My%20Website/style.css).
2. **Typography Consistency:** Body copy and article paragraphs use `Playfair Display` for a editorial reading feel, while metadata labels, navigation links, and badges strictly use uppercase bold `Inter` via the `.meta` utility class.
