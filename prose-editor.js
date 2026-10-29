/**
 * Tobi Lawson — Prose editor.
 *
 * A visual editor for `prose` fields. You see bold text, real links, pictures
 * and players while you type; you never see markup.
 *
 * What is stored is still plain text. The editable surface is serialised back
 * to the same markup `renderProse` reads, and that markup is what goes into
 * the content document. This matters: the Supabase anonymous key ships in the
 * page source and has to be able to write, so if the document held author HTML
 * anyone who viewed source could inject a script into every page. Text in,
 * escaped markup out, keeps that shut while the editing feels direct.
 */

import { esc, renderProse } from "/content-store.js?v=3.10.0";

const TICK = String.fromCharCode(96);
const FENCE = TICK + TICK + TICK;

// ---------------------------------------------------------------------------
// Serialising the editable surface back to markup
// ---------------------------------------------------------------------------

/** Inline content of an element: links, bold, italic, code, line breaks. */
function inlineOf(node) {
  let out = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.nodeValue;
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const tag = child.tagName;
    const inner = inlineOf(child);

    if (tag === "BR") { out += "\n"; return; }
    if (!inner.trim() && tag !== "IMG") { return; }

    switch (tag) {
      case "A": {
        const href = child.getAttribute("href") || "";
        out += href ? "[" + inner + "](" + href + ")" : inner;
        break;
      }
      case "STRONG":
      case "B":
        out += "**" + inner + "**";
        break;
      case "EM":
      case "I":
        out += "*" + inner + "*";
        break;
      case "CODE":
        out += TICK + inner + TICK;
        break;
      default:
        out += inner;
    }
  });
  return out;
}

/** One top-level node becomes one markup block. */
function blockOf(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.nodeValue.trim();
    return t ? t : "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const tag = node.tagName;

  if (tag === "H1" || tag === "H2") return "## " + inlineOf(node).trim();
  if (tag === "H3" || tag === "H4") return "### " + inlineOf(node).trim();
  if (tag === "HR") return "---";

  if (tag === "BLOCKQUOTE") {
    return inlineOf(node).trim().split("\n").map((l) => "> " + l).join("\n");
  }

  if (tag === "UL" || tag === "OL") {
    const items = [...node.children].filter((li) => li.tagName === "LI");
    return items.map((li, i) => (tag === "UL" ? "- " : (i + 1) + ". ") + inlineOf(li).trim()).join("\n");
  }

  if (tag === "PRE") {
    return FENCE + "\n" + (node.textContent || "").replace(/\n$/, "") + "\n" + FENCE;
  }

  if (tag === "FIGURE") {
    const img = node.querySelector("img");
    if (!img) return "";
    const cap = node.querySelector("figcaption");
    const caption = cap && cap.textContent.trim() ? ' "' + cap.textContent.trim().replace(/"/g, "") + '"' : "";
    return "![" + (img.getAttribute("alt") || "") + "](" + (img.getAttribute("src") || "") + caption + ")";
  }

  if (node.classList && node.classList.contains("prose-embed")) {
    const url = node.getAttribute("data-video") || "";
    return url ? "@video(" + url + ")" : "";
  }

  if (tag === "IMG") {
    return "![" + (node.getAttribute("alt") || "") + "](" + (node.getAttribute("src") || "") + ")";
  }

  // A bare div is what some browsers produce for a new line. If it holds
  // block children, recurse; otherwise treat it as a paragraph.
  if (tag === "DIV" && [...node.children].some((c) => /^(P|H\d|UL|OL|BLOCKQUOTE|FIGURE|PRE|HR)$/.test(c.tagName))) {
    return [...node.childNodes].map(blockOf).filter(Boolean).join("\n\n");
  }

  const text = inlineOf(node).trim();
  return text;
}

/** The whole surface, as the plain text that goes into the document. */
export function serialize(root) {
  return [...root.childNodes]
    .map(blockOf)
    .filter((b) => b !== "")
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------------------------------------------------------------------------
// Markup
// ---------------------------------------------------------------------------

const TOOLS = [
  { id: "h2",      label: "H2",      title: "Subheading" },
  { id: "h3",      label: "H3",      title: "Minor subheading" },
  { id: "bold",    label: "B",       title: "Bold (Cmd/Ctrl+B)" },
  { id: "italic",  label: "I",       title: "Italic (Cmd/Ctrl+I)" },
  { id: "link",    label: "Link",    title: "Link (Cmd/Ctrl+K)" },
  { id: "unlink",  label: "Unlink",  title: "Remove link" },
  { id: "quote",   label: "Quote",   title: "Pull quote" },
  { id: "ul",      label: "List",    title: "Bulleted list" },
  { id: "ol",      label: "1.",      title: "Numbered list" },
  { id: "image",   label: "Image",   title: "Insert a picture by path or URL" },
  { id: "video",   label: "Video",   title: "Insert a YouTube or Vimeo player" },
  { id: "rule",    label: "Divider", title: "Divider" },
  { id: "clear",   label: "Clear",   title: "Strip formatting from the selection" }
];

export function proseEditorMarkup(id, field, value, req) {
  const tools = TOOLS.map((t) =>
    `<button type="button" class="prose-tool" data-tool="${t.id}" data-for="${id}" title="${esc(t.title)}">${esc(t.label)}</button>`
  ).join("");

  return `
    <div class="prose-editor" data-prose-root="${id}">
      <div class="prose-toolbar">
        ${tools}
        <label class="prose-tool prose-tool-file" title="Upload a picture into this field">
          Upload
          <input type="file" accept="image/*" data-prose-upload="${id}" style="display: none;" />
        </label>
        <span class="prose-toolbar-gap"></span>
        <button type="button" class="prose-tool prose-tool-source" data-source-for="${id}" aria-pressed="false">Source</button>
      </div>

      <div class="prose-surface article-body" contenteditable="true" spellcheck="true"
           data-prose-surface="${id}" role="textbox" aria-multiline="true"
           aria-label="${esc(field.label)}"></div>

      <textarea id="${id}" class="prose-source-input" rows="${field.rows || 10}"
                data-field="${esc(field.key)}"${req} style="display: none;">${esc(value)}</textarea>

      <div class="prose-linkbar" data-linkbar-for="${id}" style="display: none;">
        <input type="url" class="admin-input prose-linkinput" placeholder="https://example.com" />
        <button type="button" class="admin-btn prose-linkapply">Link</button>
        <button type="button" class="admin-btn admin-btn-secondary prose-linkcancel">Cancel</button>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Behaviour
// ---------------------------------------------------------------------------

const exec = (cmd, arg) => document.execCommand(cmd, false, arg === undefined ? null : arg);

/** Replace the current selection with a block of already-rendered markup. */
function insertRendered(markup) {
  exec("insertHTML", renderProse(markup));
}

function isUrl(text) {
  return /^(https?:\/\/|mailto:)\S+$/i.test(String(text || "").trim());
}

/**
 * Wire one editor: mirror the surface into the hidden textarea on every
 * change, so every existing save path keeps working untouched.
 */
function bindOne(root) {
  const id = root.getAttribute("data-prose-root");
  const surface = root.querySelector(`[data-prose-surface="${id}"]`);
  const source = root.querySelector(`#${CSS.escape(id)}`);
  const linkbar = root.querySelector(`[data-linkbar-for="${id}"]`);
  if (!surface || !source) return;

  // Browsers differ on what Enter produces; ask for paragraphs.
  try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (err) { /* not fatal */ }

  surface.innerHTML = renderProse(source.value) || "<p><br></p>";

  const sync = () => {
    source.value = serialize(surface);
    source.dispatchEvent(new Event("input", { bubbles: true }));
  };

  surface.addEventListener("input", sync);
  surface.addEventListener("blur", sync);

  // The last selection seen inside this surface. Focusing an element can
  // collapse the current selection, so the range is remembered as it moves
  // rather than read back at the moment a toolbar button is pressed.
  let lastRange = null;
  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (surface.contains(range.commonAncestorContainer)) lastRange = range.cloneRange();
  });

  /** Put the caret back where the author left it, then run `fn`. */
  const withSelection = (fn) => {
    surface.focus();
    if (lastRange) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(lastRange);
    }
    fn();
    sync();
  };

  const markExternal = () => {
    surface.querySelectorAll("a[href]").forEach((a) => {
      if (/^https?:/i.test(a.getAttribute("href") || "")) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
    });
  };

  // --- paste: keep the document plain, and link a pasted URL -----------------
  surface.addEventListener("paste", (e) => {
    const text = (e.clipboardData || window.clipboardData).getData("text/plain");
    e.preventDefault();
    const sel = window.getSelection();
    const hasSelection = sel && !sel.isCollapsed && String(sel).trim() !== "";
    if (isUrl(text) && hasSelection) {
      exec("createLink", text.trim());
      markExternal();
    } else {
      exec("insertText", text);
    }
    sync();
  });

  // --- keyboard ------------------------------------------------------------
  surface.addEventListener("keydown", (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); openLinkbar(); }
    if (mod && e.key.toLowerCase() === "b") { e.preventDefault(); exec("bold"); sync(); }
    if (mod && e.key.toLowerCase() === "i") { e.preventDefault(); exec("italic"); sync(); }
  });

  // --- the link bar --------------------------------------------------------
  const input = linkbar.querySelector(".prose-linkinput");

  function openLinkbar() {
    if (!lastRange || lastRange.collapsed) {
      alert("Select the words you want to link first, then press Link.");
      return;
    }
    const holder = lastRange.commonAncestorContainer;
    const el = holder.nodeType === Node.ELEMENT_NODE ? holder : holder.parentElement;
    const existing = el ? el.closest("a") : null;
    input.value = existing ? existing.getAttribute("href") : "";
    linkbar.style.display = "flex";
    input.focus();
    input.select();
  }

  function closeLinkbar() {
    linkbar.style.display = "none";
  }

  function applyLink() {
    const url = input.value.trim();
    if (!url) { closeLinkbar(); return; }
    withSelection(() => {
      exec("createLink", url);
      markExternal();
    });
    closeLinkbar();
  }

  linkbar.querySelector(".prose-linkapply").addEventListener("click", applyLink);
  linkbar.querySelector(".prose-linkcancel").addEventListener("click", closeLinkbar);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); applyLink(); }
    if (e.key === "Escape") { e.preventDefault(); closeLinkbar(); }
  });

  // --- toolbar -------------------------------------------------------------
  root.querySelectorAll("[data-tool]").forEach((btn) => {
    // mousedown, not click: the surface must not lose its selection first.
    btn.addEventListener("mousedown", (e) => e.preventDefault());
    btn.addEventListener("click", () => {
      const tool = btn.getAttribute("data-tool");
      if (tool === "link") { openLinkbar(); return; }

      withSelection(() => {
      switch (tool) {
        case "bold":   exec("bold"); break;
        case "italic": exec("italic"); break;
        case "h2":     exec("formatBlock", "h2"); break;
        case "h3":     exec("formatBlock", "h3"); break;
        case "quote":  exec("formatBlock", "blockquote"); break;
        case "ul":     exec("insertUnorderedList"); break;
        case "ol":     exec("insertOrderedList"); break;
        case "unlink": exec("unlink"); break;
        case "clear":  exec("removeFormat"); exec("formatBlock", "p"); break;
        case "rule":   insertRendered("---"); break;
        case "image": {
          const url = prompt("Picture path or URL (put files in /assets/):", "/assets/");
          if (!url || url === "/assets/") return;
          const alt = prompt("Describe the picture, for screen readers:", "") || "";
          const cap = prompt("Caption (leave blank for none):", "") || "";
          insertRendered("![" + alt + "](" + url + (cap ? ' "' + cap + '"' : "") + ")");
          break;
        }
        case "video": {
          const url = prompt("YouTube or Vimeo URL:", "https://");
          if (!url || url === "https://") return;
          insertRendered("@video(" + url + ")");
          break;
        }
        default: break;
      }
      markExternal();
      });
    });
  });

  // --- upload --------------------------------------------------------------
  const upload = root.querySelector(`[data-prose-upload="${id}"]`);
  if (upload) {
    upload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      e.target.value = "";
      if (file.size > 1.5 * 1024 * 1024) {
        alert("That picture is over 1.5 MB. Put it in /assets/ and use the Image button instead.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        surface.focus();
        insertRendered("![" + file.name.replace(/\.[^.]+$/, "") + "](" + evt.target.result + ")");
        sync();
      };
      reader.readAsDataURL(file);
    });
  }

  // --- source view ---------------------------------------------------------
  const sourceBtn = root.querySelector(`[data-source-for="${id}"]`);
  sourceBtn.addEventListener("click", () => {
    const showingSource = source.style.display !== "none";
    if (showingSource) {
      surface.innerHTML = renderProse(source.value) || "<p><br></p>";
      source.style.display = "none";
      surface.style.display = "";
    } else {
      source.value = serialize(surface);
      source.style.display = "";
      surface.style.display = "none";
    }
    sourceBtn.classList.toggle("active", !showingSource);
    sourceBtn.setAttribute("aria-pressed", String(!showingSource));
  });

  // Typing in the source view still has to reach the document.
  source.addEventListener("input", () => { /* the shared [data-field] handler does the work */ });
}

export function bindProseEditors(container) {
  container.querySelectorAll("[data-prose-root]").forEach(bindOne);
}
