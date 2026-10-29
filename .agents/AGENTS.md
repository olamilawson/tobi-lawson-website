# Project Rules: Design & Copy Guidelines

This project strictly enforces the **Hallmark Design System** (Anti-AI-UI Slop) and **Stop-Slop Copywriting Rules** (Anti-AI Prose Tells).

---

## 🎨 Part 1: Design System Rules (Hallmark Consensus)

1. **Typographic Hierarchy & Roles**
   - **Distinct Display & Body Pairing**: Never use a single font family (e.g. Inter) for both display headlines and body copy.
   - **Role Assignment**: Use `Playfair Display` for display headlines and editorial prose body, and bold `Inter` for metadata/labels (`.meta`).
   - **Hierarchy**: Maintain a sharp weight ladder: Display > Body > Label.

2. **Color Palette & Restraint**
   - **No Gradient Slop**: Never use purple-to-pink, purple-to-blue, or multi-hue gradient hero backgrounds.
   - **Single Accent Rule**: Use a single anchor accent hue (`--accent: #ff3d00`). Accent coverage must remain under 5% of total page area.
   - **Tinted Neutrals**: For warmth, tint neutral background surfaces (`--bg: #f4f4f2`, `--line: #d0d0ce`) instead of using noisy background fills.

3. **Asymmetric Layout & Intentional Rhythm**
   - **Break Symmetry**: Avoid "centered everything" (centered title + centered lead + centered button + centered grid). Bias layouts with left-alignments, edge paddings, and asymmetric grids.
   - **Genre-Specific Navigation**: Use an edge-aligned minimal header (`.header-nav`) with animated link underlines rather than a generic SaaS navigation bar.

4. **Card & Component Restraint**
   - **No Generic Icon-Tile Cards**: Avoid rounded cards with colored square icons top-left and 3-line body copy. Lead with typography, custom cover blocks, or asymmetric borders.
   - **Restraint Over Decoration**: Better clean silence than unnecessary UI clutter or sparkle emojis.

5. **Motion & Performance**
   - Use exponential ease-out curves (`cubic-bezier(0.16, 1, 0.3, 1)`).
   - Strictly honor `@media (prefers-reduced-motion: reduce)` across all CSS keyframe animations.

---

## ✍️ Part 2: Writing & Copywriting Rules (Stop-Slop Guidelines)

1. **Cut Throat-Clearing Openers**
   - **Banned**: *"Here's the thing:"*, *"Here's what [X]"*, *"Here's why [X]"*, *"The uncomfortable truth is"*, *"It turns out"*, *"Let me be clear"*, *"The truth is"*, *"Can we talk about"*.
   - **Rule**: State the point immediately without introductory announcements.

2. **Eliminate Emphasis Crutches & Jargon**
   - **Banned Crutches**: *"Full stop."*, *"Period."*, *"Let that sink in."*, *"This matters because"*, *"Make no mistake"*.
   - **Banned Jargon**: *"navigate"*, *"unpack"*, *"lean into"*, *"landscape"*, *"game-changer"*, *"double down"*, *"deep dive"*, *"moving forward"*, *"circle back"*.
   - **Kill Adverbs**: Remove all unnecessary -ly words and softeners (*"really"*, *"just"*, *"literally"*, *"basically"*).

3. **Break Binary Contrasts & Negation-First Formulas**
   - **Banned Patterns**: *"Not because X. Because Y."*, *"[X] isn't the problem. [Y] is."*, *"The answer isn't X. It's Y."*, *"Not X. But Y."*, *"It's not this. It's that."*.
   - **Rule**: Drop the negation runway entirely. State Y directly.

4. **Avoid Dramatic Fragmentation & Rhetorical Setups**
   - **Banned**: *"[Noun]. That's it."*, *"What if [reframe]?"*, *"Here's what I mean:"*, *"Think about it:"*, *"And that's okay."*.
   - **Rule**: Write complete sentences. Trust content over performative drama.

5. **Active Voice, Concrete Specifics & Reader Placement**
   - Every sentence must have a human subject doing an action.
   - Avoid passive voice and inanimate objects performing human actions.
   - Use concrete names, dates, and locations (*Lagos*, *Yaba*, *Ojota*, *Mushin*, *Joe Studwell*). Specifics beat abstractions.
   - Vary sentence lengths. Avoid em dashes (—) in prose text.
