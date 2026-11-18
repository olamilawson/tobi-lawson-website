// Development only (#/poses on the dev server): every pose of the character
// side by side, by day and by night, for design work. Not in the built page.
import Agent, { AgentPortrait, type Pose } from "../components/Agent";

const POSES: Pose[] = ["idle", "think", "research", "draft", "wait", "cheer", "sleep", "wake", "down", "walk"];

export default function Poses() {
  return (
    <main className="min-h-dvh bg-canvas p-8 font-sans text-ink">
      <div className="mb-6 flex items-center gap-4">
        <AgentPortrait size={64} />
        <AgentPortrait size={42} />
        <AgentPortrait size={28} />
      </div>
      {[false, true].map((night) => (
        <div key={String(night)} className={night ? "mt-6 grid grid-cols-5 gap-4 rounded-2xl bg-night p-6" : "grid grid-cols-5 gap-4 rounded-2xl bg-muted p-6"}>
          {POSES.map((p) => (
            <figure key={p} className="flex flex-col items-center gap-1">
              <Agent pose={p} size={130} night={night} still carry={p === "idle" && night} />
              <figcaption className={night ? "font-mono text-xs text-night-ink-2" : "font-mono text-xs text-ink-3"}>{p}</figcaption>
            </figure>
          ))}
        </div>
      ))}
    </main>
  );
}
