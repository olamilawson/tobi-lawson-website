import { useEffect, useRef, useState } from "react";
import Agent, { type Pose } from "./Agent";
import type { Activity, Source } from "../activity";

type Props = {
  name: string;
  activity: Activity;
  waking: boolean;
  status: string;
  detail?: string;
  sources: Source[];
  celebrateKey: number;
  celebratePlane: boolean;
  pingKey: number;
  onWake: () => void;
  onFetched: () => void;
};

const FULL = 172; // rendered width of the character on a wide stage
const SPEED = 110; // px per second

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const on = () => setR(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return r;
}

export default function Stage({
  name,
  activity,
  waking,
  status,
  detail,
  sources,
  celebrateKey,
  celebratePlane,
  pingKey,
  onWake,
  onFetched,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(760);
  const [x, setX] = useState(240);
  const [dur, setDur] = useState(0);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [walking, setWalking] = useState(false);
  const [action, setAction] = useState<Pose | null>(null);
  const [look, setLook] = useState(0);
  const [plane, setPlane] = useState(0);
  const [alert, setAlert] = useState(false);
  const [grabbed, setGrabbed] = useState(false);
  const still = useReducedMotion();
  // Phones: a smaller character on a shorter stage.
  const CHAR = w < 560 ? 96 : FULL;
  const k = CHAR / FULL;
  const xRef = useRef(x);
  xRef.current = x;
  const timers = useRef<number[]>([]);
  const placed = useRef(false);
  const measured = useRef(false);

  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  };
  const clearAll = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => {
      measured.current = true;
      setW(Math.floor(e.contentRect.width));
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const walkTo = (target: number, then?: () => void) => {
    const min = CHAR / 2 + 24;
    const max = w - CHAR / 2 - 24;
    const t = Math.round(Math.max(min, Math.min(max, target)));
    const d = Math.abs(t - xRef.current);
    if (d < 8) {
      then?.();
      return;
    }
    const ms = still ? 0 : Math.round((d / SPEED) * 1000);
    setFacing(t > xRef.current ? 1 : -1);
    setDur(ms);
    setWalking(!still);
    setX(t);
    later(() => {
      setWalking(false);
      then?.();
    }, ms + 20);
  };

  // where each activity happens on the stage
  useEffect(() => {
    clearAll();
    setAction(null);
    setLook(0);
    setAlert(false);
    setWalking(false);
    if (activity !== "fetching") setGrabbed(false);
    const spot: Record<Activity, number> = {
      idle: xRef.current,
      thinking: w * 0.5,
      researching: w * 0.28,
      drafting: w * 0.52,
      waiting: w - 150,
      sleeping: w * 0.7,
      down: w * 0.42,
      briefing: w * 0.42,
      fetching: xRef.current,
      delivering: w * 0.58,
    };
    const settle = () => setFacing(activity === "waiting" ? -1 : 1);
    if (!placed.current) {
      // first paint: put him in place, no walk
      const start = activity === "idle" ? w * 0.32 : spot[activity];
      setDur(0);
      setX(Math.round(start));
      settle();
      if (measured.current) placed.current = true;
      return clearAll;
    }
    if (activity === "fetching") {
      // notice, run to the note, grab it, bring it back
      setAlert(true);
      setAction("hop");
      later(() => {
        setAlert(false);
        setAction(null);
        walkTo(0, () => {
          setAction("hop");
          setGrabbed(true);
          later(() => {
            setAction(null);
            walkTo(w * 0.58, () => onFetched());
          }, 760);
        });
      }, 850);
      return clearAll;
    }
    if (activity === "delivering") return clearAll;
    walkTo(spot[activity], settle);
    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, w]);

  // idle life: wander, hop, look around
  useEffect(() => {
    if (activity !== "idle" || still) return;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const r = Math.random();
      if (r < 0.5) {
        walkTo(80 + Math.random() * (w - 160));
      } else if (r < 0.72) {
        setAction("hop");
        later(() => setAction(null), 720);
      } else {
        setLook(Math.random() < 0.5 ? -1 : 1);
        later(() => setLook(0), 1400);
      }
      later(tick, 3200 + Math.random() * 2600);
    };
    later(tick, 1800);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, w, still]);

  // celebrate a release or a finished task
  useEffect(() => {
    if (!celebrateKey) return;
    setAction("cheer");
    if (celebratePlane) setPlane((p) => p + 1);
    later(() => setAction(null), 1450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrateKey]);

  // a hop each time a briefing section arrives
  useEffect(() => {
    if (!pingKey) return;
    setAction("hop");
    later(() => setAction(null), 720);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pingKey]);

  const poke = () => {
    if (action || waking) return;
    if (activity === "sleeping") {
      onWake();
      return;
    }
    if (activity === "idle" || activity === "waiting") {
      setAction("tumble");
      later(() => setAction(null), 2000);
      return;
    }
    setAction("hop");
    later(() => setAction(null), 720);
  };

  const basePose: Record<Activity, Pose> = {
    idle: "idle",
    thinking: "think",
    researching: "research",
    drafting: "draft",
    waiting: "wait",
    sleeping: "sleep",
    down: "down",
    briefing: "research",
    fetching: "idle",
    delivering: "wait",
  };
  const pose: Pose = action ?? (waking ? "wake" : walking ? "walk" : basePose[activity]);
  const night = activity === "sleeping" && !waking;
  const held = activity === "delivering" || (activity === "fetching" && grabbed);
  const working = activity === "thinking" || activity === "researching" || activity === "drafting" || activity === "briefing";
  const left = Math.floor(x - CHAR / 2);

  return (
    <div
      ref={ref}
      data-state={activity}
      role="status"
      aria-label={`${name}: ${status}${detail ? ". " + detail : ""}`}
      className={
        night
          ? "relative h-[250px] shrink-0 overflow-hidden rounded-2xl bg-night transition-colors duration-500 sm:h-[300px]" /* ds-ok: stage height */
          : "relative h-[250px] shrink-0 overflow-hidden rounded-2xl bg-muted transition-colors duration-500 sm:h-[300px]" /* ds-ok: stage height */
      }
    >
      {/* name and status */}
      <div className="absolute left-5 top-4 z-10 flex max-w-[60%] flex-col gap-0.5">
        <div className={night ? "flex items-center gap-2 text-sm text-night-ink-2" : "flex items-center gap-2 text-sm text-ink-3"}>
          <span className={night ? "font-semibold text-night-ink" : "font-semibold text-ink"}>{name}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-2 font-mono text-xs">
            {working && <span className="size-1.5 rounded-full bg-accent animate-led" />}
            {status}
          </span>
        </div>
        {detail && (
          <div key={detail} className={night ? "animate-fade-in text-sm text-night-ink" : "animate-fade-in text-sm text-ink-2"}>
            {detail}
          </div>
        )}
      </div>

      {/* sources he is reading */}
      {(activity === "researching" || activity === "briefing") && (
        <div className="absolute top-4 right-5 z-10 hidden flex-col items-end gap-1.5 sm:flex">
          {sources.map((s, i) => (
            <div
              key={s.label}
              className="animate-chip flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-2 shadow-soft"
              style={{ animationDelay: `${i * 700}ms`, animationFillMode: "backwards" }}
            >
              <span className="font-mono text-ink-3">{s.kind}</span>
              {s.label}
            </div>
          ))}
        </div>
      )}

      {/* floor */}
      <div className={night ? "absolute inset-x-0 bottom-0 h-11 bg-night-2" : "absolute inset-x-0 bottom-0 h-11 bg-sunken"} />

      {/* the reminder note, pinned at the edge until he fetches it */}
      {activity === "fetching" && !grabbed && (
        <div
          aria-hidden="true"
          className={
            still
              ? "absolute left-4 z-0 flex h-14 w-12 flex-col gap-1.5 rounded-md border border-accent-line bg-accent-soft p-2"
              : "absolute left-4 z-0 flex h-14 w-12 animate-tilt flex-col gap-1.5 rounded-md border border-accent-line bg-accent-soft p-2 origin-bottom"
          }
          style={{ bottom: 52 }}
        >
          <span className="size-2 rounded-full bg-accent" />
          <span className="h-0.5 w-7 rounded bg-face/50" />
          <span className="h-0.5 w-4 rounded bg-face/30" />
        </div>
      )}

      {/* alert */}
      {alert && (
        <div
          aria-hidden="true"
          className="animate-chip absolute z-20 flex size-7 items-center justify-center rounded-full bg-accent text-base font-bold text-white"
          style={{ left: Math.floor(x + 28 * k), bottom: Math.round(214 * k) }}
        >
          !
        </div>
      )}

      {/* soft spotlight that follows him */}
      <div
        aria-hidden="true"
        className={night ? "absolute bottom-3 left-0 h-8 w-64 rounded-full bg-white/5 blur-md" : "absolute bottom-3 left-0 h-8 w-64 rounded-full bg-white/70 blur-md"}
        style={{
          transform: `translateX(${Math.floor(x - 128)}px)`,
          transition: dur ? `transform ${dur}ms linear` : undefined,
        }}
      />

      {/* paper plane on release */}
      {plane > 0 && !still && (
        <svg
          key={plane}
          width="34"
          height="26"
          viewBox="0 0 34 26"
          className="animate-plane pointer-events-none absolute z-20"
          style={{ left: Math.floor(x + 30 * k), bottom: Math.round(190 * k) }}
          aria-hidden="true"
        >
          <path d="M1 12 L33 1 L22 25 L16 15 Z" fill="#ffffff" stroke="#141518" strokeWidth="2" strokeLinejoin="round" />
          <path d="M16 15 L33 1" stroke="#141518" strokeWidth="2" />
        </svg>
      )}

      {/* Ola */}
      <button
        type="button"
        onClick={poke}
        aria-label={activity === "sleeping" ? `Wake ${name}` : `Poke ${name}`}
        className="absolute bottom-7 z-10 cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        style={{
          left: 0,
          transform: `translateX(${left}px)`,
          transition: dur ? `transform ${dur}ms linear` : undefined,
        }}
      >
        <div style={{ transform: `scaleX(${facing})`, transition: "transform 160ms ease-out" }}>
          <Agent pose={pose} look={look * facing} size={CHAR} still={still} night={night} carry={held} />
        </div>
      </button>
    </div>
  );
}
