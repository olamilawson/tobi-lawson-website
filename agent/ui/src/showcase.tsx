// Ola's stage on the public site (the homepage and /ola/): a tour of what he
// does, played on the same stage and character the desk uses. Built as its own
// file (assets/showcase.js) and mounted into every [data-ola-stage] element,
// inside a shadow root so the stage's styles never touch the site's.
//
// It shows what Ola does, in general words. It never shows data: no names, no
// mail, no dates. Each step's line says what he is doing.
//
// The tour (one place, TOUR below):
//   asleep -> waking -> building the day -> standing by -> thinking -> drafting
//   -> waiting for a yes -> approved, sent -> reminder fetched -> delivered -> standing by -> (again)
// Pause stops it; it also stops while scrolled out of view. Clicking Ola while
// he sleeps wakes him; otherwise he hops or tumbles, as on the desk.

import { StrictMode, useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Pause, Play } from "lucide-react";
import Stage from "./components/Stage";
import type { Activity, Source } from "./activity";
import css from "./index.css?inline";

type Step = {
  activity: Activity;
  status: string;
  detail: string;
  ms: number; // how long the step lasts; 0 waits for the stage (the reminder fetch)
  waking?: boolean;
  send?: boolean; // the paper plane: the approved email leaves
};

const TOUR: Step[] = [
  { activity: "sleeping", status: "Asleep", detail: "Until the morning", ms: 3200 },
  { activity: "sleeping", waking: true, status: "Waking up…", detail: "", ms: 1200 },
  { activity: "briefing", status: "Setting out the day", detail: "Reading the calendar and the unread mail", ms: 5200 },
  { activity: "idle", status: "Standing by", detail: "The day is laid out for Tobi", ms: 4200 },
  { activity: "thinking", status: "Thinking…", detail: "Tobi has asked for an email", ms: 2600 },
  { activity: "drafting", status: "Drafting…", detail: "Writing it the way Tobi writes", ms: 3800 },
  { activity: "waiting", status: "Waiting for a yes", detail: "Nothing goes out until Tobi approves it", ms: 4800 },
  { activity: "idle", send: true, status: "Approved", detail: "The email goes out", ms: 3400 },
  { activity: "fetching", status: "Reminder due", detail: "Fetching it", ms: 0 },
  { activity: "delivering", status: "Reminder due", detail: "Brought to Tobi once, on time", ms: 3600 },
  { activity: "idle", status: "Standing by", detail: "", ms: 6500 },
];

const BRIEFING_SOURCES: Source[] = [
  { kind: "cal", label: "Calendar" },
  { kind: "mail", label: "Unread mail" },
  { kind: "task", label: "Tasks" },
];

function Tour() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [celebrate, setCelebrate] = useState(0);
  const [ping, setPing] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const step = TOUR[i];
  const running = !paused && visible;

  const next = useCallback(() => setI((n) => (n + 1) % TOUR.length), []);

  // The reminder step ends when Ola has fetched the note. If the tour is paused
  // by then, it moves on when play resumes.
  const fetched = useRef(false);
  const onFetched = () => {
    fetched.current = true;
    if (running) advanceFromFetch();
  };
  const advanceFromFetch = () => {
    if (!fetched.current) return;
    fetched.current = false;
    setI((n) => (TOUR[n].activity === "fetching" ? n + 1 : n));
  };
  useEffect(() => {
    if (running) advanceFromFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Play only while on screen.
  useEffect(() => {
    if (!box.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(box.current);
    return () => io.disconnect();
  }, []);

  // One timer per step; the reminder fetch waits for the stage instead.
  useEffect(() => {
    if (!running || step.ms === 0) return;
    const t = window.setTimeout(next, step.ms);
    return () => window.clearTimeout(t);
  }, [i, running, step.ms, next]);

  useEffect(() => {
    if (step.send) setCelebrate((c) => c + 1);
    if (step.activity === "briefing") {
      const a = window.setTimeout(() => setPing((p) => p + 1), 1600);
      const b = window.setTimeout(() => setPing((p) => p + 1), 3400);
      return () => {
        window.clearTimeout(a);
        window.clearTimeout(b);
      };
    }
  }, [i, step.send, step.activity]);

  return (
    <div ref={box} className="relative font-sans text-ink" data-state={step.activity} data-paused={paused ? "true" : "false"}>
      <Stage
        name="Ola"
        activity={step.activity}
        waking={!!step.waking}
        status={step.status}
        detail={step.detail || undefined}
        sources={BRIEFING_SOURCES}
        celebrateKey={celebrate}
        celebratePlane
        pingKey={ping}
        onWake={() => setI(1)}
        onFetched={onFetched}
        announce={false}
      />
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Play Ola's tour" : "Pause Ola's tour"}
        className={
          step.activity === "sleeping" && !step.waking
            ? "absolute right-3 bottom-3 z-20 flex size-9 cursor-pointer items-center justify-center rounded-full bg-night-2 text-night-ink hover:bg-night"
            : "absolute right-3 bottom-3 z-20 flex size-9 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-ink-2 shadow-soft hover:text-ink"
        }
      >
        {paused ? <Play size={15} /> : <Pause size={15} />}
      </button>
    </div>
  );
}

// Tailwind declares its --tw-* variables with @property, which browsers only
// honour at document level, never inside a shadow root. Register them there
// once; the site itself uses none of these names.
function registerProperties(text: string) {
  if (document.getElementById("ola-stage-properties")) return;
  const rules = text.match(/@property\s+--tw-[\w-]+\s*\{[^}]*\}/g);
  if (!rules) return;
  const style = document.createElement("style");
  style.id = "ola-stage-properties";
  style.textContent = rules.join("\n");
  document.head.appendChild(style);
}

// The stage's fonts: the site's own, so it sits in the page instead of beside it.
const SITE_FONTS = `:host{--font-sans:"Inter",ui-sans-serif,system-ui,sans-serif;--font-mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;display:block}`;

export function mount(host: HTMLElement) {
  if (host.shadowRoot) return;
  const text = String(css).replace(/@import\s+url\([^)]*\)\s*;|@import\s+"https?:[^"]*"\s*;/g, "");
  registerProperties(text);
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = text + SITE_FONTS;
  root.appendChild(style);
  const mountPoint = document.createElement("div");
  root.appendChild(mountPoint);
  host.dataset.olaStage = "live";
  createRoot(mountPoint).render(
    <StrictMode>
      <Tour />
    </StrictMode>,
  );
}

document.querySelectorAll<HTMLElement>("[data-ola-stage]").forEach(mount);
