// The picture a link preview shows for an essay (1200 × 630, the size X,
// LinkedIn, WhatsApp and Slack all use): the essay's title in Playfair on the
// site's bone background, with its date, summary and the author's name.
// Drawn as SVG, rasterised by resvg with the two fonts in scripts/fonts
// (both SIL Open Font License; the licences sit beside them).
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const fonts = path.join(path.dirname(fileURLToPath(import.meta.url)), "fonts");
const FONT_FILES = [path.join(fonts, "PlayfairDisplay.ttf"), path.join(fonts, "Inter.ttf")];

const W = 1200;
const H = 630;
const LEFT = 80;
const RIGHT = W - 80;

const xml = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Break text into lines of at most `max` characters, on spaces. Character
 * counts stand in for measured widths; the limits below leave room for wide
 * letters. Anything past `lines` lines ends in an ellipsis.
 */
function wrap(text, max, lines) {
  const out = [];
  let line = "";
  for (const word of String(text || "").split(/\s+/).filter(Boolean)) {
    if ((line + " " + word).trim().length > max && line) {
      out.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) out.push(line);
  if (out.length > lines) {
    out.length = lines;
    out[lines - 1] = out[lines - 1].replace(/\s*\S*$/, "") + "…";
  }
  return out;
}

export function shareImage(post, settings = {}) {
  // Short titles set large; long ones step down so three lines still fit.
  const long = String(post.title || "").length > 40;
  const size = long ? 62 : 92;
  const title = wrap(post.title, long ? 32 : 21, 3);
  // First baseline sits a cap height below the date line, plus breathing room.
  const titleTop = 196 + Math.round(size * 0.72);
  const leading = Math.round(size * 1.1);
  const summaryTop = titleTop + (title.length - 1) * leading + 64;
  const summary = wrap(post.summary, 74, 2);
  const meta = [post.category, post.date].filter(Boolean).join("  ·  ").toUpperCase();
  const author = settings.siteTitle || "Tobi Lawson";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#f4f4f2"/>
  <rect x="${LEFT}" y="96" width="56" height="4" fill="#ff3d00"/>
  <text x="${LEFT}" y="148" font-family="Inter" font-size="22" font-weight="700" letter-spacing="3" fill="#555555">${xml(meta)}</text>
  ${title.map((l, i) => `<text x="${LEFT}" y="${titleTop + i * leading}" font-family="Playfair Display" font-size="${size}" fill="#111111">${xml(l)}</text>`).join("\n  ")}
  ${summary.map((l, i) => `<text x="${LEFT}" y="${summaryTop + i * 38}" font-family="Inter" font-size="26" fill="#555555">${xml(l)}</text>`).join("\n  ")}
  <line x1="${LEFT}" y1="530" x2="${RIGHT}" y2="530" stroke="#d0d0ce" stroke-width="2"/>
  <g transform="translate(${LEFT}, 556) scale(1.5)">
    <rect width="32" height="32" rx="6" fill="#111111"/>
    <path d="M7.5 17.5C7 10 12.5 6.5 17 6.5C23 6.5 26 10.5 25.5 16.5C25 22.5 20.5 25.5 15.5 25.5C10 25.5 6.5 22 7 17C7.4 12.8 10.5 9.6 15.5 9.2" fill="none" stroke="#f4f4f2" stroke-width="2.6" stroke-linecap="round"/>
  </g>
  <text x="${LEFT + 66}" y="591" font-family="Playfair Display" font-size="32" fill="#111111">${xml(author)}</text>
  <text x="${RIGHT}" y="589" text-anchor="end" font-family="Inter" font-size="22" letter-spacing="1" fill="#555555">tobilawson.com</text>
</svg>`;

  return new Resvg(svg, {
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: "Inter" },
    fitTo: { mode: "width", value: W }
  }).render().asPng();
}
