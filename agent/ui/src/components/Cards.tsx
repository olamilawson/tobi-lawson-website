import { useEffect, useId, useRef, useState } from "react";
import { Check, CircleAlert, Loader2, RotateCw } from "lucide-react";
import { type Failure, hhmm, request } from "../api";

const card = "flex max-w-[560px] flex-col gap-3 rounded-2xl border border-accent-line bg-surface p-4 shadow-soft";
const primary =
  "h-9 cursor-pointer rounded-full bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong";
const secondary =
  "h-9 cursor-pointer rounded-full border border-line-strong px-4 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

// --- small pieces ---------------------------------------------------------------------

export function AgentText({ children, at }: { children: React.ReactNode; at?: string }) {
  return (
    <div className="flex max-w-[85%] flex-col gap-1">
      {children}
      {at && <span className="font-mono text-xs text-ink-4">{at}</span>}
    </div>
  );
}

/** A failure in words, with a way to try again. */
export function Problem({ failure, onRetry, title, busy }: { failure: Failure | string; onRetry?: () => void; title?: string; busy?: boolean }) {
  const message = typeof failure === "string" ? failure : failure.message;
  return (
    <div role="alert" data-state="error" className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start gap-2.5">
        <CircleAlert size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent" />
        <div>
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          <p className="text-sm text-ink-2">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} disabled={busy} className={`flex w-fit items-center gap-2 ${secondary}`}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} strokeWidth={2} />}
          Try again
        </button>
      )}
    </div>
  );
}

export function Done({ children, at, dashed }: { children: React.ReactNode; at?: string; dashed?: boolean }) {
  return dashed ? (
    <div className="animate-fade-in flex max-w-[560px] items-center gap-3 rounded-2xl border border-dashed border-line-strong px-4 py-3 text-sm text-ink-3">
      {children}
    </div>
  ) : (
    <div className="animate-fade-in flex max-w-[560px] items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-face text-white">
        <Check size={14} strokeWidth={2.5} />
      </span>
      <span className="flex-1">{children}</span>
      {at && <span className="font-mono text-xs text-ink-3">{at}</span>}
    </div>
  );
}

// --- an email or invitation waiting for the owner's yes ----------------------------------

export type ApprovalItem = {
  run_id: string;
  kind: string; // mail | invite | another workflow's name
  status: string; // the run's status
  to?: string | null;
  subject?: string | null;
  body?: string | null;
  start?: string | null;
  end?: string | null;
  editable: boolean;
  held?: boolean;
  error?: string | null;
  approval_error?: string | null;
  decided_at?: string;
};

/**
 * One card's machine. The run's status on the server decides where it ends:
 *
 *   review ──Edit──> editing ──Save──> review (with the owner's version)
 *     │                └──Cancel──> review
 *     ├──Approve──> approving ──done──> sent | held     (waiting again: the reason, back to review)
 *     └──Discard──> discard_grace (5 s, Undo) ──> discarding ──> discarded
 *
 * One action at a time: while approving or discarding, nothing else can be
 * pressed. Approve refuses while an edit is unsaved and says why.
 */
type CardState = "review" | "editing" | "approving" | "discard_grace" | "discarding";

const DISCARD_GRACE_MS = 5000;

export function ApprovalCard({
  item,
  tz,
  flash,
  onChanged,
  onSent,
}: {
  item: ApprovalItem;
  tz: string;
  flash?: boolean;
  onChanged: () => void; // refetch whatever holds this item
  onSent?: () => void; // celebrate
}) {
  const [state, setState] = useState<CardState>("review");
  const [saved, setSaved] = useState<string | null>(null); // the owner's version of the body
  const [text, setText] = useState(item.body || "");
  const [problem, setProblem] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<null | "sent" | "held" | "discarded">(null);
  const graceTimer = useRef<number>();
  const reasonId = useId();
  useEffect(() => () => window.clearTimeout(graceTimer.current), []);

  const isInvite = item.kind === "invite";
  const canEdit = item.editable && item.kind === "mail";
  const body = saved ?? item.body ?? "";
  const when = item.start ? `${new Date(item.start).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: tz })}, ${hhmm(item.start, tz)}–${hhmm(item.end, tz)}` : "";

  // Where the server already says it ended.
  const settled =
    outcome ??
    (item.status === "done" ? (item.held ? "held" : "sent") : item.status === "cancelled" ? "discarded" : item.status === "failed" ? "failed" : null);

  if (item.status === "queued" || item.status === "running") {
    return (
      <div data-state="drafting" className="flex max-w-[560px] items-center gap-3 rounded-2xl border border-dashed border-line-strong px-4 py-3 text-sm text-ink-3">
        <Loader2 size={14} className="animate-spin" /> {isInvite ? "Preparing the invitation" : "Writing the email"} to {item.to}…
      </div>
    );
  }
  if (settled === "sent")
    return (
      <div data-state="sent">
        <Done>
          {isInvite ? "Invitation sent" : "Email sent"} to <span className="font-medium">{item.to}</span>
        </Done>
      </div>
    );
  if (settled === "held")
    return (
      <div data-state="held">
        <Done dashed>
          Approved, but no mailbox is connected, so the email to {item.to} is held in the agent's outbox. Nothing was sent.
        </Done>
      </div>
    );
  if (settled === "discarded")
    return (
      <div data-state="discarded">
        <Done dashed>Draft discarded. Nothing was sent.</Done>
      </div>
    );
  if (settled === "failed")
    return (
      <div data-state="failed" className="max-w-[560px]">
        <Problem title={isInvite ? "The invitation didn't go out" : "The email didn't go out"} failure={item.error || "The agent stopped before sending. Nothing was sent."} />
      </div>
    );

  const approve = async () => {
    if (state !== "review") return;
    setState("approving");
    setProblem(null);
    const edited = saved !== null && saved !== item.body ? saved : undefined;
    const r = await request<{ status: string; error_reason?: string; outputs?: { released?: { sent?: boolean } } }>(`/runs/${item.run_id}/approval`, {
      method: "POST",
      json: { decision: "approved", ...(edited !== undefined ? { edited_body: edited } : {}) },
    });
    if (!r.ok) {
      setState("review");
      setProblem(r.kind === "conflict" ? "This was already decided, maybe in another tab. Showing where it stands now." : r.message);
      onChanged();
      return;
    }
    if (r.data.status === "done") {
      setOutcome(r.data.outputs?.released?.sent === false ? "held" : "sent");
      onSent?.();
      onChanged();
      setState("review");
      return;
    }
    setState("review");
    setProblem(r.data.status === "failed" ? r.data.error_reason || "It failed while sending." : "The content changed before it was approved. Read it again and approve.");
    onChanged();
  };

  const startDiscard = () => {
    if (state !== "review") return;
    setState("discard_grace");
    graceTimer.current = window.setTimeout(async () => {
      setState("discarding");
      const r = await request(`/runs/${item.run_id}/approval`, { method: "POST", json: { decision: "rejected", comment: "discarded from the desk" } });
      if (!r.ok && r.kind !== "conflict") {
        setState("review");
        setProblem(r.message);
        return;
      }
      setOutcome("discarded");
      onChanged();
    }, DISCARD_GRACE_MS);
  };
  const undoDiscard = () => {
    window.clearTimeout(graceTimer.current);
    setState("review");
  };

  if (state === "discard_grace" || state === "discarding") {
    return (
      <div data-state={state} className="animate-fade-in flex max-w-[560px] items-center gap-3 rounded-2xl border border-dashed border-line-strong px-4 py-3 text-sm text-ink-3">
        <span className="flex-1">{state === "discarding" ? "Discarding…" : "Discarding the draft. Nothing will be sent."}</span>
        {state === "discard_grace" && (
          <button type="button" onClick={undoDiscard} className="cursor-pointer font-medium text-ink underline-offset-2 hover:underline">
            Undo
          </button>
        )}
      </div>
    );
  }

  const blocked = state === "editing" ? "Save or cancel your edit first." : state === "approving" ? "Sending…" : null;
  return (
    <div
      id={`card-${item.run_id}`}
      key={flash ? "flash" : "still"}
      data-state={state}
      className={flash ? `animate-flash ${card}` : card}
    >
      <div className="flex items-center gap-2 font-mono text-xs text-ink-3">
        <span className="size-1.5 rounded-full bg-accent" />
        {isInvite ? "Invitation" : item.kind === "mail" ? "Email" : "Draft"} · to {item.to}
      </div>
      <div className="text-sm font-semibold">{item.subject}</div>
      {when && <div className="font-mono text-xs text-ink-2">{when}</div>}
      {state === "editing" ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={`edit-${item.run_id}`} className="sr-only">
            Edit the email
          </label>
          <textarea
            id={`edit-${item.run_id}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={Math.min(12, Math.max(4, text.split("\n").length + 1))}
            className="w-full resize-y rounded-lg border border-line-strong bg-canvas p-3 text-sm leading-relaxed outline-none focus:border-ink-3"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSaved(text.trim() ? text : item.body || "");
                setState("review");
              }}
              className="h-8 cursor-pointer rounded-full bg-face px-4 text-sm font-medium text-white hover:bg-ink-2"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => {
                setText(body);
                setState("review");
              }}
              className="h-8 cursor-pointer rounded-full px-3 text-sm text-ink-2 hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        body && <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink-2">{body}</p>
      )}
      {saved !== null && saved !== item.body && state !== "editing" && <p className="font-mono text-xs text-ink-3">Edited by you. This version is what will be sent.</p>}
      {(problem || item.approval_error) && (
        <p role="alert" className="text-sm text-accent">
          {problem || item.approval_error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="button" onClick={approve} disabled={!!blocked} aria-describedby={blocked ? reasonId : undefined} className={primary}>
          {state === "approving" ? "Sending…" : isInvite ? "Approve and invite" : "Approve and send"}
        </button>
        {canEdit && state === "review" && (
          <button
            type="button"
            onClick={() => {
              setText(body);
              setState("editing");
            }}
            className={secondary}
          >
            Edit draft
          </button>
        )}
        <button
          type="button"
          onClick={startDiscard}
          disabled={state !== "review"}
          className="ml-auto h-9 cursor-pointer px-2 text-sm text-ink-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          Discard
        </button>
        {blocked && (
          <span id={reasonId} className={state === "editing" ? "basis-full font-mono text-xs text-ink-3" : "sr-only"}>
            {blocked}
          </span>
        )}
      </div>
    </div>
  );
}

// --- something worth remembering ----------------------------------------------------------

/**
 *   open ──Keep──> saving ──> kept
 *     └──Dismiss──> saving ──> dismissed      (409: already decided elsewhere; refetch)
 */
export function MemoryCard({ id, text, status, onChanged }: { id: string; text: string; status: "open" | "kept" | "dismissed"; onChanged: () => void }) {
  const [saving, setSaving] = useState<null | "keep" | "dismiss">(null);
  const [problem, setProblem] = useState<string | null>(null);

  const decide = async (decision: "keep" | "dismiss") => {
    if (saving) return;
    setSaving(decision);
    setProblem(null);
    const r = await request(`/memory/proposals/${id}`, { method: "POST", json: { decision } });
    setSaving(null);
    if (!r.ok && r.kind !== "conflict") setProblem(r.message);
    onChanged();
  };

  if (status === "dismissed") {
    return (
      <div data-state="dismissed" className="animate-fade-in flex max-w-[560px] items-center gap-3 px-1 text-sm text-ink-3">
        Not saved to memory
      </div>
    );
  }
  return (
    <div data-state={saving ? "saving" : status} className="animate-fade-in flex max-w-[560px] flex-wrap items-center gap-3 rounded-2xl border border-dashed border-line-strong px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="font-mono text-xs text-ink-3">{status === "kept" ? "Saved to memory" : "Worth remembering?"}</div>
        <div className="text-sm">{text}</div>
        {problem && <p role="alert" className="text-sm text-accent">{problem}</p>}
      </div>
      {status === "open" && (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => decide("keep")} disabled={!!saving} className="h-8 cursor-pointer rounded-full border border-line-strong px-3 text-sm font-medium hover:bg-muted disabled:opacity-50">
            {saving === "keep" ? "Saving…" : "Keep"}
          </button>
          <button type="button" onClick={() => decide("dismiss")} disabled={!!saving} className="h-8 cursor-pointer px-2 text-sm text-ink-3 hover:text-ink disabled:opacity-50">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

// --- a reminder that came due ------------------------------------------------------------

/**
 *   open ──Mark done──> saving ──> done
 *     └──Snooze 1 hour──> saving ──> snoozed (until the time the server set)
 */
export function ReminderCard({
  task,
  dueText,
  tz,
  onChanged,
  onDone,
}: {
  task: { id: string; title: string; status: string; snoozed_until: string | null };
  dueText: string;
  tz: string;
  onChanged: () => void;
  onDone?: () => void;
}) {
  const [state, setState] = useState<"open" | "saving" | "done" | "snoozed">(task.status === "done" ? "done" : "open");
  const [until, setUntil] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  void tz;

  const act = async (change: { status: "done" } | { snooze_minutes: number }) => {
    if (state !== "open") return;
    setState("saving");
    setProblem(null);
    const r = await request<{ snoozed_until: string | null; status: string }>(`/tasks/${task.id}`, { method: "PATCH", json: change });
    if (!r.ok) {
      setState("open");
      setProblem(r.message);
      return;
    }
    if ("status" in change) {
      setState("done");
      onDone?.();
    } else {
      setUntil(r.data.snoozed_until);
      setState("snoozed");
    }
    onChanged();
  };

  if (state === "done") return <div data-state="done"><Done><span className="font-medium">{task.title}</span> marked done</Done></div>;
  if (state === "snoozed")
    return (
      <div data-state="snoozed">
        <Done dashed>Snoozed until {until ? until.slice(11, 16) : "later"}</Done>
      </div>
    );
  return (
    <div data-state={state} className={`animate-fade-in ${card}`}>
      <div className="flex items-center gap-2 font-mono text-xs text-ink-3">
        <span className="size-1.5 rounded-full bg-accent" />
        Reminder · due {dueText}
      </div>
      <div className="text-[15px] font-semibold">{task.title}</div>
      {problem && <p role="alert" className="text-sm text-accent">{problem}</p>}
      <div className="flex items-center gap-2 pt-1">
        <button type="button" onClick={() => act({ status: "done" })} disabled={state !== "open"} className={primary}>
          Mark done
        </button>
        <button type="button" onClick={() => act({ snooze_minutes: 60 })} disabled={state !== "open"} className={secondary}>
          Snooze 1 hour
        </button>
      </div>
    </div>
  );
}

export const buttons = { primary, secondary };
