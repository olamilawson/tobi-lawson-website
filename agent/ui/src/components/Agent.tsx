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
  | "down"
  // things he does between jobs (the stage's idle life, and the public tour)
  | "wave"
  | "coffee"
  | "read"
  | "watch"
  | "dance";

type Props = {
  pose: Pose;
  look?: number; // -1 … 1, where the eyes point
  size?: number;
  still?: boolean; // reduced motion
  night?: boolean;
  carry?: boolean; // holding a reminder note
};

// Ola is a soft toy made in Tobi's likeness: warm brown felt with visible
// stitching, a glossy screen face with level brows and a smile, and Tobi's
// navy quarter-zip with grey and blue bands across the chest, over navy
// trousers. Colours are real values because the SVG needs them for gradients;
// they sit beside the theme tokens (accent #d93a26, face #141518).
const FELT_LIGHT = "#bd875f";
const FELT = "#9a6644";
const FELT_SHADE = "#714730";
const THREAD = "#e2c09c"; // stitching on the felt
const EDGE = "#7b4c31"; // the soft outline of each felt piece
const FACE = "#141518";
const RED = "#d93a26";
const NAVY = "#25324f";
const NAVY_DEEP = "#1c2740";
const BLUE = "#5d77a5";
const BLUE_DARK = "#3f5784";
const GREY = "#a9aeb6";
const GREY_LIGHT = "#bcc0c6";
const TROUSERS = "#1d2436";
const ZIP = "#d3d6db";
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
            : pose === "dance"
              ? a("animate-dance")
              : "";

  const bodyBob =
    pose === "walk" ? a("animate-step") : pose === "sleep" || pose === "down" ? "" : a("animate-breathe");

  const armL =
    pose === "walk" || pose === "dance"
      ? a("animate-swing-l")
      : pose === "draft"
        ? a("animate-type-l")
        : pose === "cheer"
          ? a("animate-cheer-l")
          : pose === "idle" || pose === "think" || pose === "wait" || pose === "wave" || pose === "coffee"
            ? a("animate-sway-l")
            : "";
  const armR =
    pose === "walk" || pose === "dance"
      ? a("animate-swing-r")
      : pose === "draft"
        ? a("animate-type-r")
        : pose === "cheer"
          ? a("animate-cheer-r")
          : pose === "wait" || pose === "wave"
            ? a("animate-wave-r")
            : pose === "research"
              ? a("animate-search-r")
              : pose === "coffee"
                ? a("animate-sip")
                : pose === "idle"
                  ? a("animate-sway-r")
                  : "";

  // static poses, used when no loop applies (or reduced motion)
  const armLStatic =
    pose === "draft" || pose === "read"
      ? -28
      : pose === "watch"
        ? -62
        : pose === "cheer"
          ? 155
          : pose === "think"
            ? -6
            : pose === "sleep"
              ? 6
              : 4;
  const armRStatic =
    pose === "draft" || pose === "read"
      ? 28
      : pose === "cheer"
        ? -155
        : pose === "wait" || pose === "wave"
          ? -160
          : pose === "research"
            ? -75
            : pose === "think"
              ? -130
              : pose === "coffee"
                ? -118
                : pose === "sleep"
                  ? -6
                  : -4;

  const head = pose === "think" ? a("animate-tilt") : pose === "draft" || pose === "read" ? a("animate-nod") : "";
  const headStatic = pose === "sleep" ? 9 : pose === "down" ? -6 : pose === "watch" ? 5 : 0;

  const lx = Math.max(-1, Math.min(1, look)) * 9;
  const walking = pose === "walk";
  const working = pose === "research" || pose === "draft" || pose === "think" || pose === "read";
  const fallen = pose === "down";

  const felt = { fill: url("felt-fill"), stroke: EDGE, strokeWidth: 1.2, filter: url("felt") };
  const stitch = { fill: "none", stroke: THREAD, strokeWidth: 1.3, strokeDasharray: "2.6 2.4", strokeLinecap: "round" as const };
  const knit = { stroke: "#000", strokeOpacity: 0.12, filter: url("felt") };

  // A sleeve: navy knit with a grey band, a blue stripe and a ribbed cuff, and a felt hand.
  const sleeve = (x: number) => (
    <>
      <rect x={x} y="106" width="17" height="42" rx="8.5" fill={NAVY} {...knit} />
      <rect x={x} y="117" width="17" height="6" fill={GREY} opacity="0.95" />
      <rect x={x} y="123" width="17" height="2.5" fill={BLUE} />
      <rect x={x + 0.5} y="139" width="16" height="9" rx="3" fill={NAVY_DEEP} />
      <path d={`M${x + 3} 140 v7 M${x + 6.5} 140 v7 M${x + 10} 140 v7 M${x + 13.5} 140 v7`} stroke="#000" strokeOpacity="0.25" strokeWidth="0.8" />
      <circle cx={x + 8.5} cy="151" r="6.8" {...felt} />
    </>
  );

  const leftArm = (
    <g className={armL} style={{ ...fill("50% 8%"), transform: armL ? undefined : `rotate(${armLStatic}deg)`, transition: "transform 260ms ease-out" }}>
      {sleeve(30)}
      {pose === "watch" && (
        <g>
          {/* the watch on his wrist */}
          <rect x="32.5" y="134" width="12" height="7" rx="2" fill="#2a2a2a" />
          <circle cx="38.5" cy="137.5" r="5" fill="#f4f1ea" stroke="#2a2a2a" strokeWidth="1.6" />
          <path d="M38.5 137.5 L38.5 134.6 M38.5 137.5 L40.6 138.6" stroke="#2a2a2a" strokeWidth="1" strokeLinecap="round" />
        </g>
      )}
    </g>
  );

  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 160 200" className="overflow-visible" aria-hidden="true">
      <defs>
        {/* felt: soft volume, lit from the top left */}
        <radialGradient id={id("felt-fill")} cx="0.35" cy="0.28" r="0.85">
          <stop offset="0" stopColor={FELT_LIGHT} />
          <stop offset="0.55" stopColor={FELT} />
          <stop offset="1" stopColor={FELT_SHADE} />
        </radialGradient>
        {/* fibres: a fine grain multiplied over the felt and the knit, and a hint of fuzz at the edges */}
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
        <clipPath id={id("body-clip")}>
          <rect x="42" y="96" width="76" height="76" rx="30" />
        </clipPath>
        {/* knit texture: rows of small stitches, laid over the jumper */}
        <pattern id={id("knit-tex")} width="5.5" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 0.8 l2.75 2.4 l2.75 -2.4" stroke="#000" strokeOpacity="0.16" strokeWidth="0.7" fill="none" />
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
        {/* legs: navy trousers, with a stitched hem */}
        <g className={walking ? a("animate-leg-a") : ""}>
          <rect x="56" y="160" width="19" height="32" rx="9.5" fill={TROUSERS} stroke="#000" strokeOpacity="0.2" filter={url("felt")} />
          <path d="M59 184 Q65.5 188 72 184" fill="none" stroke="#56607a" strokeWidth="1.2" strokeDasharray="2.4 2.2" />
        </g>
        <g className={walking ? a("animate-leg-b") : ""}>
          <rect x="85" y="160" width="19" height="32" rx="9.5" fill={TROUSERS} stroke="#000" strokeOpacity="0.2" filter={url("felt")} />
          <path d="M88 184 Q94.5 188 101 184" fill="none" stroke="#56607a" strokeWidth="1.2" strokeDasharray="2.4 2.2" />
        </g>

        <g className={bodyBob}>
          {/* left arm (behind the body, except when he checks his watch) */}
          {pose !== "watch" && leftArm}
          {/* right arm, carries the props */}
          <g className={armR} style={{ ...fill("50% 8%"), transform: armR ? undefined : `rotate(${armRStatic}deg)`, transition: "transform 260ms ease-out" }}>
            {sleeve(113)}
            {pose === "research" && (
              <g>
                <line x1="121.5" y1="152" x2="121.5" y2="162" stroke={FACE} strokeWidth="4" strokeLinecap="round" />
                <circle cx="121.5" cy="173" r="11" fill="#ffffff" fillOpacity="0.55" stroke={FACE} strokeWidth="4" />
                <circle cx="117" cy="169" r="3" fill="#ffffff" />
              </g>
            )}
            {pose === "coffee" && (
              <g className={a("animate-sip-cup")} style={{ ...fill("50% 30%"), transform: still ? "rotate(118deg)" : undefined }}>
                {/* a cup of coffee, held at the hand, kept upright */}
                <path d="M131 152 q6 0 6 5 q0 5 -6 5" fill="none" stroke={FACE} strokeWidth="2.2" />
                <rect x="112" y="148" width="20" height="18" rx="3" fill="#f6f1e8" stroke={FACE} strokeWidth="2.2" />
                <rect x="112" y="153" width="20" height="4" fill={RED} />
              </g>
            )}
            {carry && (
              <g>
                <rect x="104" y="142" width="32" height="30" rx="3" fill="#fbe4df" stroke={FACE} strokeWidth="2.5" />
                <rect x="110" y="154" width="20" height="3" rx="1.5" fill={FACE} opacity="0.55" />
                <rect x="110" y="161" width="13" height="3" rx="1.5" fill={FACE} opacity="0.35" />
                <circle cx="120" cy="147" r="3" fill={RED} />
              </g>
            )}
            {pose === "wait" && !carry && (
              <g>
                <rect x="104" y="148" width="36" height="25" rx="4" fill="#ffffff" stroke={FACE} strokeWidth="2.5" />
                <path d="M105 150 L122 163 L139 150" fill="none" stroke={FACE} strokeWidth="2.5" strokeLinejoin="round" />
                <circle cx="137" cy="150" r="5" fill={RED} />
              </g>
            )}
          </g>

          {/* body: the quarter-zip jumper, bands across the chest, a ribbed hem */}
          <rect x="42" y="96" width="76" height="76" rx="30" fill={NAVY} {...knit} />
          <g clipPath={url("body-clip")}>
            <rect x="40" y="108" width="80" height="5" fill={BLUE_DARK} />
            <rect x="40" y="113" width="80" height="8" fill={BLUE} />
            <rect x="40" y="121" width="80" height="10" fill={GREY} />
            <rect x="40" y="131" width="80" height="3" fill={BLUE_DARK} />
            <rect x="40" y="134" width="80" height="7" fill={GREY_LIGHT} />
            <rect x="40" y="96" width="80" height="80" fill={url("knit-tex")} />
            <rect x="40" y="163" width="80" height="10" fill={NAVY_DEEP} />
            <path d="M48 164 v8 M53 164 v8 M58 164 v8 M63 164 v8 M68 164 v8 M73 164 v8 M78 164 v8 M83 164 v8 M88 164 v8 M93 164 v8 M98 164 v8 M103 164 v8 M108 164 v8 M113 164 v8" stroke="#000" strokeOpacity="0.28" strokeWidth="0.8" />
          </g>
          {/* the pocket for the activity light */}
          <rect x="66" y="148.5" width="28" height="8" rx="4" fill={FACE} />
          <circle cx={working ? 80 : 72} cy="152.5" r="2.3" fill={working ? RED : "#5d6066"} className={working ? a("animate-led") : ""} />

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

          {pose === "read" && (
            <g>
              {/* an open file, pages turning */}
              <path d="M80 130 L48 126 L48 158 L80 162 Z" fill="#fbf7ef" stroke={FACE} strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M80 130 L112 126 L112 158 L80 162 Z" fill="#fbf7ef" stroke={FACE} strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M54 134 L74 136.5 M54 140 L74 142.5 M54 146 L70 148" stroke={FACE} strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M86 136.5 L106 134 M86 142.5 L106 140 M86 148 L102 146" stroke={FACE} strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M80 130 L112 126 L112 158 L80 162 Z" fill="#f1ebe0" stroke={FACE} strokeWidth="1.4" strokeLinejoin="round" className={a("animate-flip")} style={fill("0% 50%")} opacity={still ? 0 : 1} />
              <line x1="80" y1="130" x2="80" y2="162" stroke={FACE} strokeWidth="1.8" />
            </g>
          )}

          {/* head */}
          <g className={head} style={{ ...fill("50% 95%"), transform: head ? undefined : `rotate(${headStatic}deg)`, transition: "transform 300ms ease-out" }}>
            {/* felt ears with pom-pom tips, navy and red */}
            <g className={pose === "think" || pose === "research" ? a("animate-antenna") : ""} style={fill("50% 100%")}>
              <g transform="rotate(-22 50 26)">
                <rect x="46" y="10" width="9" height="16" rx="4.5" {...felt} />
                <circle cx="50.5" cy="8" r="8" fill={NAVY} stroke="#000" strokeOpacity="0.15" filter={url("felt")} />
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

          {/* the jumper's collar, standing up round his neck, with the zip */}
          <path d="M50 102 Q80 114 110 102 L111 112 Q80 125 49 112 Z" fill={NAVY} {...knit} />
          <path d="M53 108 Q80 119 107 108" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="0.8" />
          <line x1="80" y1="113" x2="80" y2="134" stroke={ZIP} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="80" y1="114" x2="80" y2="133" stroke="#8d929b" strokeWidth="0.9" strokeDasharray="1 1.2" />
          {/* checking the watch: the arm comes across the chest, in front */}
          {pose === "watch" && leftArm}

          {/* the zip pull swings as he moves */}
          <g className={walking || pose === "dance" ? a("animate-tag") : a("animate-tag-slow")} style={fill("50% 0%")}>
            <rect x="77.6" y="132" width="4.8" height="8" rx="1.6" fill={ZIP} stroke="#7d828b" strokeWidth="0.7" />
          </g>
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

      {/* music notes while dancing */}
      {pose === "dance" && !still && (
        <g fontFamily="Figtree, sans-serif" fontSize="16" fontWeight="700" fill={night ? "#e9e9e6" : FACE}>
          <text x="128" y="40" className="animate-zzz">♪</text>
          <text x="18" y="48" className="animate-zzz [animation-delay:0.8s]">♫</text>
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

/** Eyes, brows, cheeks and mouth on the screen. The mouth and brows carry his mood. */
function Face({ pose, lx, still }: { pose: Pose; lx: number; still: boolean }) {
  const W = "#fff8ee";
  const cheeks = pose !== "down" && pose !== "tumble" && (
    <g fill={CHEEK} opacity={pose === "sleep" ? 0.5 : 0.78}>
      <ellipse cx="50" cy="78" rx="6.5" ry="3.6" />
      <ellipse cx="110" cy="78" rx="6.5" ry="3.6" />
    </g>
  );
  const mouthStroke = { stroke: W, strokeWidth: 2.6, strokeLinecap: "round" as const, fill: "none" };
  const happyMouth = <path d="M72 78 Q80 89 88 78 Z" fill={W} stroke={W} strokeWidth="1.5" strokeLinejoin="round" />;

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
  if (pose === "wait" || pose === "cheer" || pose === "hop" || pose === "wave" || pose === "dance" || pose === "coffee") {
    return (
      <>
        <g stroke={W} strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M57 64 Q65 52 73 64" />
          <path d="M87 64 Q95 52 103 64" />
        </g>
        {cheeks}
        {pose === "coffee" ? <path d="M75 80 Q80 84 85 80" {...mouthStroke} /> : happyMouth}
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
  // pill eyes with a blink and a catchlight, and level brows, positioned per pose
  const looksDown = pose === "draft" || pose === "read" || pose === "watch";
  const dy = looksDown ? 9 : pose === "think" ? -7 : 0;
  const dx = pose === "think" ? 7 : pose === "watch" ? -4 : looksDown ? 0 : lx;
  const h = looksDown ? 14 : pose === "research" ? 24 : pose === "wake" ? 10 : 22;
  const w = pose === "research" ? 13 : 11.5;
  const y = 60 - h / 2;
  // Brows: level and calm; one lifts while he thinks; both settle while he reads.
  const browY = y - 7;
  const lift = pose === "think" ? 4 : 0;
  const brows = (
    <g stroke={W} strokeWidth="2.6" strokeLinecap="round" opacity="0.92">
      <path d={`M${60} ${browY + 0.6} L${72} ${browY}`} />
      <path d={`M${88} ${browY - lift} L${100} ${browY + 0.6 - lift}`} />
    </g>
  );
  const mouth =
    pose === "think" || pose === "research" ? (
      <path d={`M${76 + dx * 0.4} ${83 + dy * 0.3} L${84 + dx * 0.4} ${83 + dy * 0.3}`} {...mouthStroke} />
    ) : pose === "draft" || pose === "read" ? null : pose === "wake" ? (
      <ellipse cx="80" cy="82" rx="3" ry="3.6" fill="none" stroke={W} strokeWidth="2.2" />
    ) : (
      <path d={`M${74 + dx * 0.4} 80 Q${80 + dx * 0.4} 86 ${86 + dx * 0.4} 80`} {...mouthStroke} />
    );
  return (
    <>
      <g style={{ transform: `translate(${dx}px, ${dy}px)`, transition: "transform 380ms cubic-bezier(0.3, 0.7, 0.4, 1)" }}>
        {brows}
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
 * Ola as a round portrait: head and collar on a warm ground, for the rail and
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
