import type { CSSProperties } from "react";

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

// Character colours. Kept here because the SVG needs real values for gradients.
// They mirror the theme tokens: shell #f7f7f5, shell-shade #dcdcd7, face #141518, accent #d93a26.
const SHELL = "#f7f7f5";
const SHELL_SHADE = "#d9d9d4";
const SEAM = "#c9c9c3";
const FACE = "#141518";
const RED = "#d93a26";

const fill = (origin: string): CSSProperties => ({ transformBox: "fill-box", transformOrigin: origin });

export default function Agent({ pose, look = 0, size = 150, still = false, night = false, carry = false }: Props) {
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

  const head =
    pose === "think"
      ? a("animate-tilt")
      : pose === "draft"
        ? a("animate-nod")
        : "";
  const headStatic = pose === "sleep" ? 9 : pose === "down" ? -6 : 0;

  const lx = Math.max(-1, Math.min(1, look)) * 9;
  const walking = pose === "walk";
  const working = pose === "research" || pose === "draft" || pose === "think";
  const fallen = pose === "down";

  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 160 200"
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="shell" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor={SHELL} />
          <stop offset="1" stopColor={SHELL_SHADE} />
        </linearGradient>
        <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2c31" />
          <stop offset="0.5" stopColor={FACE} />
          <stop offset="1" stopColor="#0b0c0e" />
        </linearGradient>
        <clipPath id="screen-clip">
          <rect x="38" y="30" width="84" height="64" rx="24" />
        </clipPath>
      </defs>

      {/* ground shadow */}
      <ellipse
        cx="80"
        cy="194"
        rx={fallen ? 62 : 36}
        ry="5"
        fill="#000"
        opacity={night ? 0.35 : 0.1}
      />

      <g
        className={root}
        style={{
          ...fill("50% 100%"),
          transform: fallen ? "translate(-80px, -54px) rotate(90deg)" : root ? undefined : "translate(0px, 0px) rotate(0deg)",
          transition: still ? undefined : "transform 500ms cubic-bezier(0.3, 0.7, 0.4, 1)",
        }}
      >
        {/* legs */}
        <g className={walking ? a("animate-leg-a") : ""}>
          <rect x="56" y="160" width="19" height="32" rx="9.5" fill="url(#shell)" stroke={SEAM} strokeWidth="1" />
        </g>
        <g className={walking ? a("animate-leg-b") : ""}>
          <rect x="85" y="160" width="19" height="32" rx="9.5" fill="url(#shell)" stroke={SEAM} strokeWidth="1" />
        </g>

        <g className={bodyBob}>
          {/* left arm */}
          <g className={armL} style={{ ...fill("50% 8%"), transform: armL ? undefined : `rotate(${armLStatic}deg)`, transition: "transform 260ms ease-out" }}>
            <rect x="30" y="106" width="17" height="44" rx="8.5" fill="url(#shell)" stroke={SEAM} strokeWidth="1" />
          </g>
          {/* right arm, carries the props */}
          <g className={armR} style={{ ...fill("50% 8%"), transform: armR ? undefined : `rotate(${armRStatic}deg)`, transition: "transform 260ms ease-out" }}>
            <rect x="113" y="106" width="17" height="44" rx="8.5" fill="url(#shell)" stroke={SEAM} strokeWidth="1" />
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

          {/* body */}
          <rect x="42" y="96" width="76" height="76" rx="30" fill="url(#shell)" stroke={SEAM} strokeWidth="1" />
          <path d="M46 122 Q80 128 114 122" fill="none" stroke={SEAM} strokeWidth="1" />
          {/* belly slot with activity light */}
          <rect x="64" y="148" width="32" height="9" rx="4.5" fill={FACE} />
          <circle
            cx={working ? 80 : 72}
            cy="152.5"
            r="2.4"
            fill={working ? RED : "#5d6066"}
            className={working ? a("animate-led") : ""}
          />
          {/* red tag at the neck */}
          <g className={walking ? a("animate-tag") : a("animate-tag-slow")} style={fill("50% 0%")}>
            <path d="M108 98 C114 100 116 108 111 113 C106 109 104 102 108 98 Z" fill={RED} />
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
          <g
            className={head}
            style={{ ...fill("50% 95%"), transform: head ? undefined : `rotate(${headStatic}deg)`, transition: "transform 300ms ease-out" }}
          >
            {/* antenna knobs */}
            <g className={pose === "think" || pose === "research" ? a("animate-antenna") : ""} style={fill("50% 100%")}>
              <g transform="rotate(-22 50 26)">
                <rect x="44" y="10" width="13" height="16" rx="3" fill="#b9bbbf" />
                <rect x="40" y="0" width="21" height="13" rx="4" fill="url(#shell)" stroke={SEAM} strokeWidth="1" />
              </g>
              <g transform="rotate(22 110 26)">
                <rect x="103" y="10" width="13" height="16" rx="3" fill="#b9bbbf" />
                <rect x="99" y="0" width="21" height="13" rx="4" fill="url(#shell)" stroke={SEAM} strokeWidth="1" />
                {pose === "think" && <circle cx="109.5" cy="6.5" r="3" fill={RED} className={a("animate-led")} />}
              </g>
            </g>

            <rect x="24" y="16" width="112" height="90" rx="38" fill="url(#shell)" stroke={SEAM} strokeWidth="1" />
            <line x1="24" y1="62" x2="36" y2="62" stroke={SEAM} strokeWidth="1" />
            <line x1="124" y1="62" x2="136" y2="62" stroke={SEAM} strokeWidth="1" />
            <rect x="38" y="30" width="84" height="64" rx="24" fill="url(#screen)" />
            <circle cx="54" cy="42" r="2.2" fill="#ffffff" opacity="0.85" />

            <g clipPath="url(#screen-clip)">
              <Eyes pose={pose} lx={lx} still={still} />
              {pose === "research" && (
                <rect x="38" y="60" width="84" height="3" fill="#ffffff" opacity="0.18" className={a("animate-scan")} />
              )}
            </g>
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

function Eyes({ pose, lx, still }: { pose: Pose; lx: number; still: boolean }) {
  const W = "#ffffff";
  if (pose === "sleep") {
    return (
      <g stroke={W} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M58 70 Q65 75 72 70" />
        <path d="M88 70 Q95 75 102 70" />
      </g>
    );
  }
  if (pose === "wait" || pose === "cheer" || pose === "hop") {
    return (
      <g stroke={W} strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M57 66 Q65 54 73 66" />
        <path d="M87 66 Q95 54 103 66" />
      </g>
    );
  }
  if (pose === "tumble" || pose === "down") {
    return (
      <g stroke={W} strokeWidth="4" strokeLinecap="round">
        <path d="M58 54 L72 68 M72 54 L58 68" />
        <path d="M88 54 L102 68 M102 54 L88 68" />
      </g>
    );
  }
  // pill eyes with blink, positioned per pose
  const dy = pose === "draft" ? 10 : pose === "think" ? -7 : 0;
  const dx = pose === "think" ? 7 : pose === "draft" ? 0 : lx;
  const h = pose === "draft" ? 14 : pose === "research" ? 26 : pose === "wake" ? 10 : 24;
  const w = pose === "research" ? 13 : 11;
  const y = 62 - h / 2;
  return (
    <g style={{ transform: `translate(${dx}px, ${dy}px)`, transition: "transform 380ms cubic-bezier(0.3, 0.7, 0.4, 1)" }}>
      <g className={still ? "" : "animate-blink"} style={fill("50% 50%")}>
        <rect x={66 - w / 2} y={y} width={w} height={h} rx={w / 2} fill={W} />
        <rect x={94 - w / 2} y={y} width={w} height={h} rx={w / 2} fill={W} />
      </g>
    </g>
  );
}
