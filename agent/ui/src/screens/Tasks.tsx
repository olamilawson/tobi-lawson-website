// The owner's tasks and reminders. A task with a due time is a reminder: Home
// brings it up once when it comes due (POST /tasks/{id}/remind), and a snooze
// brings it back.
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { type Briefing, type Task, dueLabel, request } from "../api";
import { Problem, buttons } from "../components/Cards";
import { useResource } from "../useResource";
import { Empty, Loading, Page } from "./Layout";

export default function Tasks() {
  const tasks = useResource<Task[]>("/tasks", 60_000);
  const day = useResource<Briefing>("/briefing");
  const today = day.status === "ready" ? day.data.now.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const [show, setShow] = useState<"open" | "done">("open");
  const list = tasks.status === "ready" ? tasks.data.filter((t) => (show === "done" ? t.status === "done" : t.status !== "done")) : [];

  return (
    <Page title="Tasks" lead="Things to do and to be reminded of. A time makes it a reminder.">
      <AddTask onAdded={tasks.reload} />
      <div role="tablist" aria-label="Which tasks" className="flex gap-1">
        {(["open", "done"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={show === k}
            onClick={() => setShow(k)}
            className={show === k ? "h-8 rounded-full bg-face px-4 text-sm font-medium text-white" : "h-8 rounded-full px-4 text-sm text-ink-2 hover:bg-muted"}
          >
            {k === "open" ? "To do" : "Done"}
          </button>
        ))}
      </div>
      {tasks.status === "loading" && <Loading label="Loading tasks" />}
      {tasks.status === "error" && <Problem title="Couldn't load your tasks" failure={tasks.failure} onRetry={tasks.reload} />}
      {tasks.status === "ready" && (
        <>
          {tasks.stale && <p role="status" className="font-mono text-xs text-ink-3">Couldn't refresh: {tasks.stale.message}</p>}
          {list.length === 0 ? (
            <Empty>{show === "open" ? "Nothing to do. Add one above, or ask in a conversation: “remind me to call Ada on Friday”." : "Nothing done yet."}</Empty>
          ) : (
            <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
              {list.map((t) => (
                <TaskRow key={t.id} t={t} today={today} now={day.status === "ready" ? day.data.now.slice(0, 16) : ""} onChanged={tasks.reload} />
              ))}
            </ul>
          )}
        </>
      )}
    </Page>
  );
}

/**
 *   idle ──type──> filled ──Add──> adding ──ok──> idle (cleared)
 *                                     └──fails──> filled, with the reason
 */
function AddTask({ onAdded }: { onAdded: () => void }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [adding, setAdding] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <form
      data-state={adding ? "adding" : title.trim() ? "filled" : "idle"}
      onSubmit={async (e) => {
        e.preventDefault();
        if (adding || !title.trim()) return;
        setAdding(true);
        setProblem(null);
        const r = await request<Task>("/tasks", { method: "POST", json: { title, due: due || null } });
        setAdding(false);
        if (!r.ok) return setProblem(r.message);
        setTitle("");
        setDue("");
        onAdded();
      }}
      className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 sm:flex-row sm:items-center"
    >
      <label htmlFor="task-title" className="sr-only">
        New task
      </label>
      <input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A new task" className="h-9 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-[15px] outline-none placeholder:text-ink-4" />
      <label htmlFor="task-due" className="sr-only">
        Due (optional)
      </label>
      <input id="task-due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="h-9 rounded-lg border border-line px-2 font-mono text-xs text-ink-2" />
      <button type="submit" disabled={adding || !title.trim()} className={buttons.primary}>
        {adding ? "Adding…" : "Add"}
      </button>
      {problem && <p role="alert" className="text-sm text-accent sm:basis-full">{problem}</p>}
    </form>
  );
}

/**
 *   idle ──tick──> saving ──> idle (moved to the other list)
 *   idle ──Delete──> confirming ──Delete for good──> deleting ──> (gone)
 *                        └──Keep──> idle
 */
function TaskRow({ t, today, now, onChanged }: { t: Task; today: string; now: string; onChanged: () => void }) {
  const [state, setState] = useState<"idle" | "saving" | "confirming" | "deleting">("idle");
  const [problem, setProblem] = useState<string | null>(null);
  const overdue = t.status !== "done" && !!t.due && !!now && t.due <= now;
  const snoozed = t.snoozed_until && now && t.snoozed_until > now;

  const change = async (json: object) => {
    setState("saving");
    setProblem(null);
    const r = await request(`/tasks/${t.id}`, { method: "PATCH", json });
    setState("idle");
    if (!r.ok) setProblem(r.message);
    onChanged();
  };
  const remove = async () => {
    setState("deleting");
    const r = await request(`/tasks/${t.id}`, { method: "DELETE" });
    if (!r.ok && r.kind !== "not_found") {
      setState("idle");
      setProblem(r.message);
      return;
    }
    onChanged();
  };

  return (
    <li data-state={state} data-status={t.status} className="flex flex-wrap items-center gap-3 px-4 py-3">
      <input
        type="checkbox"
        checked={t.status === "done"}
        disabled={state !== "idle"}
        onChange={() => change({ status: t.status === "done" ? "todo" : "done" })}
        aria-label={`${t.title}: ${t.status === "done" ? "mark not done" : "mark done"}`}
        className="size-4 accent-accent"
      />
      <span className={t.status === "done" ? "min-w-0 flex-1 truncate text-ink-4 line-through" : "min-w-0 flex-1 truncate"}>{t.title}</span>
      {t.due && (
        <span className={overdue ? "font-mono text-xs font-semibold text-accent" : "font-mono text-xs text-ink-3"}>
          {snoozed ? `snoozed to ${t.snoozed_until!.slice(11, 16)}` : dueLabel(t.due, today) + (t.due.slice(0, 10) === today ? "" : " " + t.due.slice(11, 16))}
        </span>
      )}
      {overdue && !snoozed && state === "idle" && (
        <button type="button" onClick={() => change({ snooze_minutes: 60 })} className="h-7 rounded-full border border-line-strong px-3 text-xs hover:bg-muted">
          Snooze 1 hour
        </button>
      )}
      {state === "confirming" ? (
        <span className="flex items-center gap-1 text-sm">
          <button type="button" onClick={remove} className="h-7 rounded-full bg-accent px-3 text-xs font-semibold text-white hover:bg-accent-hover">
            Delete for good
          </button>
          <button type="button" onClick={() => setState("idle")} className="h-7 rounded-full px-2 text-xs text-ink-2 hover:bg-muted">
            Keep
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setState("confirming")} disabled={state !== "idle"} aria-label={`Delete ${t.title}`} className="flex size-7 items-center justify-center rounded-full text-ink-4 hover:bg-muted hover:text-ink">
          <Trash2 size={14} />
        </button>
      )}
      {problem && <p role="alert" className="basis-full text-sm text-accent">{problem}</p>}
    </li>
  );
}
