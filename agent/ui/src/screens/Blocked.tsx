// The page can't talk to the agent: not running, not set up, or offline. Says
// which, in words, with a way to check again.
import { useState } from "react";
import { Loader2, RotateCw } from "lucide-react";
import Agent from "../components/Agent";
import { buttons } from "../components/Cards";

const COPY = {
  not_running: {
    title: "The agent isn't running",
    body: "The page loaded, but the agent's service on the server didn't answer. Once it's started, this page will work.",
  },
  not_set_up: {
    title: "Sign-in isn't set up yet",
    body: "The agent is running, but it has no owner sign-in configured, so it refuses every request. Set it up on the server, then check again.",
  },
  offline: {
    title: "You're offline",
    body: "The browser couldn't reach tobilawson.com. Check your connection.",
  },
} as const;

export default function Blocked({ kind, detail, onRetry }: { kind: keyof typeof COPY; detail: string; onRetry: () => void }) {
  const [checking, setChecking] = useState(false);
  return (
    <main data-state={kind} className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-canvas px-4 text-center font-sans text-ink">
      <div aria-hidden="true">
        <Agent pose={kind === "offline" ? "down" : "sleep"} size={120} />
      </div>
      <div className="flex max-w-[420px] flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">{COPY[kind].title}</h1>
        <p className="text-sm text-ink-2">{COPY[kind].body}</p>
        {detail && kind === "not_set_up" && <p className="font-mono text-xs text-ink-4">{detail}</p>}
      </div>
      <button
        type="button"
        disabled={checking}
        onClick={() => {
          setChecking(true);
          onRetry();
        }}
        className={`flex items-center gap-2 ${buttons.secondary}`}
      >
        {checking ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />} Check again
      </button>
    </main>
  );
}
