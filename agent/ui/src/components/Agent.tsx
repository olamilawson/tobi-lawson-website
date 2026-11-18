import { type CSSProperties, useId } from "react";

export type Pose =
  | "idle"
  | "walk"
  | "hop"
  | "think"
  | "research"
  | "draft"
  | "wait"
  | "cheer"
  | "tumble"
  | "sleep"
  | "wake"
  | "down";

type Props = {
  pose: Pose;
  look?: number; // -1 … 1, where the eyes point
  size?: number;
  still?: boolean; // reduced motion
  night?: boolean;
  carry?: boolean; // holding a reminder note
};

// Ola is a soft toy, not a gadget: a felt body with visible stitching, a glossy
// screen face that smiles, and a striped hand-knitted scarf. Colours are real
// values because the SVG needs them for gradients and patterns; they sit beside
// the theme tokens (accent #d93a26, face #141518).
const FELT_LIGHT = "#fffaf2";
const FELT = "#f4ebdd";
const FELT_SHADE = "#dccbb2";
const THREAD = "#c9b291"; // stitching
const EDGE = "#e2d4bf"; // the soft outline of each felt piece
const FACE = "#141518";
const RED = "#d93a26";
const INDIGO = "#2e3a66";
const CREAM = "#f7efe2";
const CHEEK = "#ff8f78";

const fill = (origin: string): CSSProperties => ({ transformBox: "fill-box", transformOrigin: origin });

export default function Agent({ pose, look = 0, size = 150, still = false, night = false, carry = false }: Props) {
  // Several Agents can share a page (the rail portrait and the stage): ids must be unique.
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;
  const a = (cls: string) => (still ? "" : cls);

  const root =
    pose === "hop"
      ? a("animate-hop")
      : pose === "cheer"
        ? a("animate-hop-twice")
        : pose === "tumble"
          ? a("animate-tumble")
          : pose === "wake"
            ? a("animate-stretch")
            : "";

  const bodyBob =
    pose === "walk" ? a("animate-step") : pose === "sleep" || pose === "down" ? "" : a("animate-breathe");

  const armL =
    pose === "walk"
      ? a("animate-swing-l")
      : pose === "draft"
        ? a("animate-type-l")
        : pose === "cheer"
          ? a("animate-cheer-l")
          : pose === "idle" || pose === "think" || pose === "wait"
            ? a("animate-sway-l")
            : "";
  const armR =
    pose === "walk"
      ? a("animate-swing-r")
      : pose === "draft"
        ? a("animate-type-r")
        : pose === "cheer"
          ? a("animate-cheer-r")
          : pose === "wait"
            ? a("animate-wave-r")
            : pose === "research"
              ? a("animate-search-r")
              : pose === "idle"
                ? a("animate-sway-r")
                : "";

  // static poses, used when no loop applies (or reduced motion)
  const armLStatic =
    pose === "draft" ? -28 : pose === "cheer" ? 155 : pose === "think" ? -6 : pose === "sleep" ? 6 : 4;
  const armRStatic =
    pose === "draft"
      ? 28
      : pose === "cheer"
        ? -155
        : pose === "wait"
          ? -160
          : pose === "research"
            ? -75
            : pose === "think"
              ? -130
              : pose === "sleep"
                ? -6
                : -4;

  const head = pose === "think" ? a("animate-tilt") : pose === "draft" ? a("animate-nod") : "";
  const headStatic = pose === "sleep" ? 9 : pose === "down" ? -6 : 0;

  const lx = Math.max(-1, Math.min(1, look)) * 9;
  const walking = pose === "walk";
  const working = pose === "research" || pose === "draft" || pose === "think";
  const fallen = pose === "down";

  const felt = { fill: url("felt-fill"), stroke: EDGE, strokeWidth: 1.2, filter: url("felt") };
  const stitch = { fill: "none", stroke: THREAD, strokeWidth: 1.3, strokeDasharray: "2.6 2.4", strokeLinecap: "round" as const };

  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 160 200" className="overflow-visible" aria-hidden="true">
      <defs>
        {/* felt: soft volume, lit from the top left */}
        <radialGradient id={id("felt-fill")} cx="0.35" cy="0.28" r="0.85">
          <stop offset="0" stopColor={FELT_LIGHT} />
          <stop offset="0.55" stopColor={FELT} />
          <stop offset="1" stopColor={FELT_SHADE} />
        </radialGradient>
        {/* fibres: a fine grain multiplied over the felt, and a hint of fuzz at the edges */}
        <filter id={id("felt")} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="fuzzy" />
          <feColorMatrix in="noise" type="saturate" values="0" result="grey" />
          <feComponentTransfer in="grey" result="grain">
            <feFuncA type="linear" slope="0" intercept="0.22" />
          </feComponentTransfer>
          <feComposite in="grain" in2="fuzzy" operator="in" result="grainIn" />
          <feBlend in="fuzzy" in2="grainIn" mode="multiply" />
        </filter>
        {/* the screen face: glossy, the one hard surface on him */}
        <linearGradient id={id("screen")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b2d33" />
          <stop offset="0.5" stopColor={FACE} />
          <stop offset="1" stopColor="#0a0b0d" />
        </linearGradient>
        <linearGradient id={id("gloss")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={id("screen-clip")}>
          <rect x="38" y="30" width="84" height="64" rx="24" />
        </clipPath>
        {/* the scarf: knitted stripes, indigo, cream and red */}
        <pattern id={id("knit")} width="22" height="8" patternUnits="userSpaceOnUse">
          <rect width="22" height="8" fill={CREAM} />
          <rect width="9" height="8" fill={INDIGO} />
          <rect x="13" width="4" height="8" fill={RED} />
          {/* knit stitches: little chevrons in rows */}
          <path d="M0 1.5 l2.75 3 l2.75 -3 M5.5 1.5 l2.75 3 l2.75 -3 M11 1.5 l2.75 3 l2.75 -3 M16.5 1.5 l2.75 3 l2.75 -3" stroke="#000" strokeOpacity="0.13" strokeWidth="0.8" fill="none" />
        </pattern>
        <pattern id={id("knit-v")} width="8" height="22" patternUnits="userSpaceOnUse">
          <rect width="8" height="22" fill={CREAM} />
          <rect width="8" height="9" fill={INDIGO} />
          <rect y="13" width="8" height="4" fill={RED} />
          <path d="M1.5 0 l3 2.75 l-3 2.75 M1.5 5.5 l3 2.75 l-3 2.75 M1.5 11 l3 2.75 l-3 2.75 M1.5 16.5 l3 2.75 l-3 2.75" stroke="#000" strokeOpacity="0.13" strokeWidth="0.8" fill="none" />
        </pattern>
      </defs>

      {/* ground shadow */}
      <ellipse cx="80" cy="194" rx={fallen ? 62 : 36} ry="5" fill="#000" opacity={night ? 0.35 : 0.1} />

      <g
        className={root}
        style={{
          ...fill("50% 100%"),
          transform: fallen ? "translate(-80px, -54px) rotate(90deg)" : root ? undefined : "translate(0px, 0px) rotate(0deg)",
          transition: still ? undefined : "transform 500ms cubic-bezier(0.3, 0.7, 0.4, 1)",
        }}
      >
        {/* legs: little felt stubs with a stitched sole */}
        <g className={walking ? a("animate-leg-a") : ""}>
          <rect x="56" y="160" width="19" height="32" rx="9.5" {...felt} />
          <path d="M59 184 Q65.5 188 72 184" {...stitch} />
        </g>
        <g className={walking ? a("animate-leg-b") : ""}>
          <rect x="85" y="160" width="19" height="32" rx="9.5" {...felt} />
          <path d="M88 184 Q94.5 188 101 184" {...stitch} />
        </g>

        <g className={bodyBob}>
          {/* left arm */}
          <g className={armL} style={{ ...fill("50% 8%"), transform: armL ? undefined : `rotate(${armLStatic}deg)`, transition: "transform 260ms ease-out" }}>
            <rect x="30" y="106" width="17" height="44" rx="8.5" {...felt} />
          </g>
          {/* right arm, carries the props */}
          <g className={armR} style={{ ...fill("50% 8%"), transform: armR ? undefined : `rotate(${armRStatic}deg)`, transition: "transform 260ms ease-out" }}>
            <rect x="113" y="106" width="17" height="44" rx="8.5" {...felt} />
            {pose === "research" && (
              <g>
                <line x1="121.5" y1="148" x2="121.5" y2="160" stroke={FACE} strokeWidth="4" strokeLinecap="round" />
                <circle cx="121.5" cy="171" r="11" fill="#ffffff" fillOpacity="0.55" stroke={FACE} strokeWidth="4" />
                <circle cx="117" cy="167" r="3" fill="#ffffff" />
              </g>
            )}
            {carry && (
              <g>
                <rect x="104" y="140" width="32" height="30" rx="3" fill="#fbe4df" stroke={FACE} strokeWidth="2.5" />
                <rect x="110" y="152" width="20" height="3" rx="1.5" fill={FACE} opacity="0.55" />
                <rect x="110" y="159" width="13" height="3" rx="1.5" fill={FACE} opacity="0.35" />
                <circle cx="120" cy="145" r="3" fill={RED} />
              </g>
            )}
            {pose === "wait" && !carry && (
              <g>
                <rect x="104" y="146" width="36" height="25" rx="4" fill="#ffffff" stroke={FACE} strokeWidth="2.5" />
                <path d="M105 148 L122 161 L139 148" fill="none" stroke={FACE} strokeWidth="2.5" strokeLinejoin="round" />
                <circle cx="137" cy="148" r="5" fill={RED} />
              </g>
            )}
          </g>

          {/* body, with a stitched seam and a stitched pocket for the activity light */}
          <rect x="42" y="96" width="76" height="76" rx="30" {...felt} />
          <path d="M80 118 L80 166" {...stitch} />
          <rect x="62" y="145" width="36" height="15" rx="7.5" fill="none" stroke={THREAD} strokeWidth="1.3" strokeDasharray="2.6 2.4" />
          <rect x="66" y="148.5" width="28" height="8" rx="4" fill={FACE} />
          <circle cx={working ? 80 : 72} cy="152.5" r="2.3" fill={working ? RED : "#5d6066"} className={working ? a("animate-led") : ""} />

          {/* the scarf's hanging end, swinging as he moves */}
          <g className={walking ? a("animate-tag") : a("animate-tag-slow")} style={fill("50% 0%")}>
            <path d="M95 112 Q104 110 113 112 L115 146 Q106 148 97 146 Z" fill={url("knit-v")} stroke="#000" strokeOpacity="0.1" filter={url("felt")} />
            <path d="M98.5 146 l-0.5 6 M102.5 146.8 l0 6.5 M106.5 147 l0 6.5 M110.5 146.6 l0 6.5 M114 146 l0.5 6" stroke={INDIGO} strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {pose === "draft" && (
            <g>
              {/* tiny laptop */}
              <path d="M44 150 L116 150 L124 162 L36 162 Z" fill="#e6e6e2" stroke={FACE} strokeWidth="2" strokeLinejoin="round" />
              <rect x="48" y="122" width="64" height="30" rx="4" fill={FACE} />
              <rect x="56" y="130" width="30" height="3" rx="1.5" fill="#ffffff" opacity="0.7" />
              <rect x="56" y="137" width="22" height="3" rx="1.5" fill="#ffffff" opacity="0.45" />
              <rect x="80" y="136" width="3" height="6" fill={RED} className={a("animate-cursor")} />
            </g>
          )}

          {/* head */}
          <g className={head} style={{ ...fill("50% 95%"), transform: head ? undefined : `rotate(${headStatic}deg)`, transition: "transform 300ms ease-out" }}>
            {/* felt ears with pom-pom tips */}
            <g className={pose === "think" || pose === "research" ? a("animate-antenna") : ""} style={fill("50% 100%")}>
              <g transform="rotate(-22 50 26)">
                <rect x="46" y="10" width="9" height="16" rx="4.5" {...felt} />
                <circle cx="50.5" cy="8" r="8" {...felt} />
              </g>
              <g transform="rotate(22 110 26)">
                <rect x="105" y="10" width="9" height="16" rx="4.5" {...felt} />
                <circle cx="109.5" cy="8" r="8" fill={RED} filter={url("felt")} />
                {pose === "think" && <circle cx="109.5" cy="8" r="3" fill="#ffd9cf" className={a("animate-led")} />}
              </g>
            </g>

            <rect x="24" y="16" width="112" height="90" rx="38" {...felt} />
            {/* stitching round the face, like a sewn-on panel */}
            <rect x="32" y="24" width="96" height="76" rx="30" {...stitch} />
            <rect x="38" y="30" width="84" height="64" rx="24" fill={url("screen")} />
            <rect x="42" y="32" width="76" height="22" rx="11" fill={url("gloss")} />

            <g clipPath={url("screen-clip")}>
              <Face pose={pose} lx={lx} still={still} />
              {pose === "research" && <rect x="38" y="60" width="84" height="3" fill="#ffffff" opacity="0.18" className={a("animate-scan")} />}
            </g>
          </g>

          {/* the scarf round his neck, over the join of head and body */}
          <path d="M39 103 Q80 116 121 103 Q124 112 121 121 Q80 135 39 121 Q36 112 39 103 Z" fill={url("knit")} stroke="#000" strokeOpacity="0.1" filter={url("felt")} />
          {/* the knot, where the end comes out */}
          <ellipse cx="104" cy="121" rx="9" ry="7.5" fill={url("knit")} stroke="#000" strokeOpacity="0.12" filter={url("felt")} />
        </g>
      </g>

      {/* thinking dots */}
      {pose === "think" && (
        <g>
          <circle cx="140" cy="20" r="3.5" fill={night ? "#e9e9e6" : FACE} className={a("animate-dot")} />
          <circle cx="151" cy="12" r="3.5" fill={night ? "#e9e9e6" : FACE} className={a("animate-dot [animation-delay:150ms]")} />
          <circle cx="162" cy="4" r="3.5" fill={night ? "#e9e9e6" : FACE} className={a("animate-dot [animation-delay:300ms]")} />
        </g>
      )}

      {/* letters flying off while drafting */}
      {pose === "draft" && !still && (
        <g fontFamily="Geist Mono, monospace" fontSize="11" fill={FACE}>
          <text x="96" y="118" className="animate-letter">a</text>
          <text x="70" y="114" className="animate-letter [animation-delay:300ms]">k</text>
          <text x="84" y="112" className="animate-letter [animation-delay:600ms]">T</text>
        </g>
      )}

      {/* sleeping */}
      {pose === "sleep" && (
        <g fontFamily="Figtree, sans-serif" fontWeight="700" fill={night ? "#e9e9e6" : FACE}>
          <text x="140" y="44" fontSize="20" className={a("animate-zzz")}>z</text>
          <text x="140" y="44" fontSize="28" className={a("animate-zzz [animation-delay:0.9s]")}>z</text>
          <text x="140" y="44" fontSize="16" className={a("animate-zzz [animation-delay:1.8s]")}>z</text>
        </g>
      )}
    </svg>
  );
}

/** Eyes, cheeks and mouth on the screen. The mouth is what makes him warm; it changes with the pose. */
function Face({ pose, lx, still }: { pose: Pose; lx: number; still: boolean }) {
  const W = "#fff8ee";
  const cheeks = pose !== "down" && pose !== "tumble" && (
    <g fill={CHEEK} opacity={pose === "sleep" ? 0.5 : 0.78}>
      <ellipse cx="50" cy="78" rx="6.5" ry="3.6" />
      <ellipse cx="110" cy="78" rx="6.5" ry="3.6" />
    </g>
  );
  const mouthStroke = { stroke: W, strokeWidth: 2.6, strokeLinecap: "round" as const, fill: "none" };

  if (pose === "sleep") {
    return (
      <>
        <g stroke={W} strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M58 66 Q65 71 72 66" />
          <path d="M88 66 Q95 71 102 66" />
        </g>
        {cheeks}
        <circle cx="80" cy="82" r="2.4" fill="none" stroke={W} strokeWidth="2" />
      </>
    );
  }
  if (pose === "wait" || pose === "cheer" || pose === "hop") {
    return (
      <>
        <g stroke={W} strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M57 64 Q65 52 73 64" />
          <path d="M87 64 Q95 52 103 64" />
        </g>
        {cheeks}
        {/* an open, happy mouth */}
        <path d="M72 78 Q80 89 88 78 Z" fill={W} stroke={W} strokeWidth="1.5" strokeLinejoin="round" />
      </>
    );
  }
  if (pose === "tumble" || pose === "down") {
    return (
      <>
        <g stroke={W} strokeWidth="4" strokeLinecap="round">
          <path d="M58 52 L72 66 M72 52 L58 66" />
          <path d="M88 52 L102 66 M102 52 L88 66" />
        </g>
        <path d="M70 83 q2.5 -3 5 0 t5 0 t5 0 t5 0" {...mouthStroke} />
      </>
    );
  }
  // pill eyes with a blink and a catchlight, positioned per pose
  const dy = pose === "draft" ? 10 : pose === "think" ? -7 : 0;
  const dx = pose === "think" ? 7 : pose === "draft" ? 0 : lx;
  const h = pose === "draft" ? 14 : pose === "research" ? 24 : pose === "wake" ? 10 : 22;
  const w = pose === "research" ? 13 : 11.5;
  const y = 60 - h / 2;
  const mouth =
    pose === "think" || pose === "research" ? (
      <path d={`M${76 + dx * 0.4} ${83 + dy * 0.3} L${84 + dx * 0.4} ${83 + dy * 0.3}`} {...mouthStroke} />
    ) : pose === "draft" ? null : pose === "wake" ? (
      <ellipse cx="80" cy="82" rx="3" ry="3.6" fill="none" stroke={W} strokeWidth="2.2" />
    ) : (
      <path d={`M${74 + dx * 0.4} 80 Q${80 + dx * 0.4} 86 ${86 + dx * 0.4} 80`} {...mouthStroke} />
    );
  return (
    <>
      <g style={{ transform: `translate(${dx}px, ${dy}px)`, transition: "transform 380ms cubic-bezier(0.3, 0.7, 0.4, 1)" }}>
        <g className={still ? "" : "animate-blink"} style={fill("50% 50%")}>
          <rect x={66 - w / 2} y={y} width={w} height={h} rx={w / 2} fill={W} />
          <rect x={94 - w / 2} y={y} width={w} height={h} rx={w / 2} fill={W} />
          {/* catchlights: the gloss of a doll's eye */}
          <circle cx={66 + w / 2 - 3.5} cy={y + 4.5} r="1.8" fill={FACE} opacity="0.55" />
          <circle cx={94 + w / 2 - 3.5} cy={y + 4.5} r="1.8" fill={FACE} opacity="0.55" />
        </g>
      </g>
      {cheeks}
      {mouth}
    </>
  );
}

/**
 * Ola as a round portrait: head and scarf on a warm ground, for the rail and
 * anywhere he needs to be small. Static by default; it breathes when not still.
 */
export function AgentPortrait({ size = 40, pose = "idle", still = true }: { size?: number; pose?: Pose; still?: boolean }) {
  const w = size * 1.22;
  return (
    <span
      aria-hidden="true"
      className="relative block shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, background: "radial-gradient(circle at 35% 30%, #fde9df, #f3c7b4 70%, #e9ae96)" }}
    >
      <span className="absolute" style={{ left: (size - w) / 2, top: size * 0.04 }}>
        <Agent pose={pose} size={w} still={still} />
      </span>
    </span>
  );
}
