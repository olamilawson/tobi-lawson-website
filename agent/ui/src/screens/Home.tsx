// Home: the agent on its stage, today down the side, and one conversation.
//
// Everything shown comes from the API. The stage's activity is derived from
// the data in one place (deriveActivity in ../activity.ts). Polling:
//   /briefing every minute, /reminders every 30 s,
//   the open conversation every 1.5 s while the agent works on it, else every 15 s.

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUp, CalendarDays, CircleAlert, Globe, Loader2, Mail, Paperclip, Plus, RotateCw, X } from "lucide-react";
import Stage from "../components/Stage";
import Prose from "../components/Prose";
import { AgentText, ApprovalCard, MemoryCard, Problem, ReminderCard, buttons } from "../components/Cards";
import { type Activity, type Source, deriveActivity } from "../activity";
import {
  type Briefing,
  type Chat,
  type ChatSummary,
  type Task,
  dueLabel,
  hhmm,
  request,
} from "../api";
import { useMe } from "../session";
import { useResource } from "../useResource";
import Layout from "./Layout";

const WOKE_KEY = "desk.woke";
const readWoke = () => {
  try {
    return localStorage.getItem(WOKE_KEY) || "";
  } catch {
    return "";
  }
};
const saveWoke = (day: string) => {
  try {
    localStorage.setItem(WOKE_KEY, day);
  } catch {
    /* private window: waking lasts until the page closes */
  }
};

type Sending = { state: "idle" } | { state: "sending"; text: string } | { state: "failed"; text: string; message: string };
type ReminderPhase = { phase: "none" } | { phase: "fetching"; task: Task } | { phase: "delivering"; task: Task };

export default function Home() {
  const me = useMe();
  const name = me.character.name;
  const tz = me.character.hours.timezone;
  const { chatId } = useParams();
  const navigate = useNavigate();

  const briefing = useResource<Briefing>("/briefing", 60_000);
  const chats = useResource<ChatSummary[]>("/chats", 60_000);
  const reminders = useResource<Task[]>("/reminders", 30_000);
  const [sending, setSending] = useState<Sending>({ state: "idle" });
  const [fast, setFast] = useState(false);
  const chat = useResource<Chat>(chatId ? `/chats/${chatId}` : null, fast ? 1500 : 15_000);

  const day = briefing.status === "ready" ? briefing.data.now.slice(0, 10) : "";
  const [woke, setWoke] = useState(readWoke);
  const [waking, setWaking] = useState(false);
  const [rebuilding, setRebuilding] = useState(false); // the briefing animation after waking
  const [reveal, setReveal] = useState(4);
  const [briefStep, setBriefStep] = useState(0);
  const [pingKey, setPingKey] = useState(0);
  const [celebrate, setCelebrate] = useState({ key: 0, plane: false });
  const [briefedAt, setBriefedAt] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [reminder, setReminder] = useState<ReminderPhase>({ phase: "none" });
  const [delivered, setDelivered] = useState<Task[]>([]); // reminder cards shown in this visit
  const handled = useRef(new Set<string>());
  const [flashId, setFlashId] = useState<string | null>(null);
  const [todayOpen, setTodayOpen] = useState(false); // phones: today as a sheet
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // With no conversation chosen, open the latest one from today, if any.
  useEffect(() => {
    if (chatId || chats.status !== "ready" || !day) return;
    const latest = chats.data[0];
    if (latest && latest.updated_at && new Date(latest.updated_at).toLocaleDateString("en-CA", { timeZone: tz }) === day) {
      navigate(`/c/${latest.id}`, { replace: true });
    }
  }, [chatId, chats, day, tz, navigate]);

  useEffect(() => {
    if (briefing.status === "ready" && !briefing.stale) setBriefedAt(hhmm(new Date().toISOString(), tz));
  }, [briefing, tz]);

  // The conversation's own state decides how often to look again.
  const chatData = chat.status === "ready" && chat.data.id === chatId ? chat.data : null;
  const lastTurn = chatData?.turns[chatData.turns.length - 1];
  const answering: "none" | "thinking" | "researching" =
    sending.state === "sending" || (lastTurn && (lastTurn.status === "queued" || lastTurn.status === "running"))
      ? lastTurn?.web && sending.state !== "sending"
        ? "researching"
        : "thinking"
      : "none";
  const draftingAction = chatData?.actions.find((a) => a.status === "queued" || a.status === "running");
  const waitingHere = chatData?.actions.filter((a) => a.status === "waiting_for_approval") ?? [];
  useEffect(() => {
    const busy = answering !== "none" || !!draftingAction || chatData?.state === "waiting";
    setFast(busy);
    if (!busy && chatData) briefing.reload(); // an answer may have added tasks or approvals
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answering, !!draftingAction, chatData?.state]);

  const b = briefing.status === "ready" ? briefing.data : null;
  const asleep = !!b && !b.awake && woke !== day;
  const outlookDown = !!b && (b.calendar.state === "down" || b.inbox.state === "down");

  // A reminder that came due: the agent fetches it, then it is marked delivered (once).
  useEffect(() => {
    if (reminder.phase !== "none" || asleep || waking || rebuilding || answering !== "none") return;
    const due = (reminders.status === "ready" ? reminders.data : []).find((t) => !handled.current.has(t.id));
    if (!due) return;
    handled.current.add(due.id);
    setReminder({ phase: "fetching", task: due });
  }, [reminders, reminder.phase, asleep, waking, rebuilding, answering]);

  const onFetched = async () => {
    if (reminder.phase !== "fetching") return;
    const task = reminder.task;
    await request(`/tasks/${task.id}/remind`, { method: "POST" });
    setDelivered((d) => (d.some((t) => t.id === task.id) ? d : [...d, task]));
    setReminder({ phase: "delivering", task });
  };
  const reminderSettled = (celebrateIt: boolean) => {
    setReminder({ phase: "none" });
    if (celebrateIt) setCelebrate((c) => ({ key: c.key + 1, plane: false }));
    reminders.reload();
    briefing.reload();
  };

  const activity: Activity = deriveActivity({
    waking,
    asleep,
    reminder: reminder.phase,
    briefing: rebuilding,
    answering,
    drafting: !!draftingAction,
    waitingHere: waitingHere.length,
    outlookDown,
  });

  // Waking: the stage wakes, then the briefing is read again, section by section.
  const wakeUp = () => {
    if (waking || !asleep) return;
    setWaking(true);
    later(async () => {
      setWaking(false);
      saveWoke(day);
      setWoke(day);
      setRebuilding(true);
      setReveal(0);
      setBriefStep(0);
      await briefing.reload();
      [1, 2, 3, 4].forEach((step, i) =>
        later(() => {
          setBriefStep(step);
          setReveal(step);
          setPingKey((k) => k + 1);
        }, 700 + i * 900),
      );
      later(() => setRebuilding(false), 700 + 4 * 900 + 300);
    }, 1100);
  };

  const retryOutlook = async () => {
    setRetrying(true);
    await briefing.reload();
    setRetrying(false);
  };

  const send = async (text: string, files: File[], web: boolean) => {
    const message = text.trim();
    if (!message || sending.state === "sending" || answering !== "none") return false;
    if (asleep) {
      saveWoke(day);
      setWoke(day);
    }
    setSending({ state: "sending", text: message });
    const form = new FormData();
    form.set("message", message);
    if (web) form.set("web", "1");
    files.forEach((f) => form.append("files", f));
    const r = await request<{ chat: string; run_id: string }>(chatId ? `/chats/${chatId}/messages` : "/chats", { method: "POST", body: form });
    if (!r.ok) {
      setSending({
        state: "failed",
        text: message,
        message: r.kind === "conflict" ? `${name} is still answering this conversation. Send it when the answer is in.` : r.message,
      });
      return false;
    }
    setDelivered([]); // reminder cards from earlier stay in Due and Tasks
    if (r.data.chat !== chatId) navigate(`/c/${r.data.chat}`);
    await chat.reload();
    chats.reload();
    setSending({ state: "idle" });
    return true;
  };

  const jumpTo = (runId: string, inChat: string | null) => {
    if (inChat && inChat !== chatId) {
      navigate(`/c/${inChat}`);
      later(() => jumpTo(runId, null), 600);
      return;
    }
    if (!inChat && !document.getElementById(`card-${runId}`)) {
      navigate("/approvals");
      return;
    }
    setTodayOpen(false);
    document.getElementById(`card-${runId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashId(null);
    requestAnimationFrame(() => setFlashId(runId));
  };

  // --- the stage's words ------------------------------------------------------------
  const lastMessage = sending.state === "sending" ? sending.text : lastTurn?.message || "";
  const stageCopy: Record<Activity, { status: string; detail?: string }> = {
    idle: {
      status: "Standing by",
      detail: !b
        ? undefined
        : b.calendar.state === "not_connected"
          ? "Outlook isn't connected yet"
          : briefedAt
            ? `Checked mail and calendar at ${briefedAt}`
            : undefined,
    },
    thinking: { status: "Thinking…", detail: lastMessage ? `“${clip(lastMessage, 60)}”` : undefined },
    researching: { status: "Researching…", detail: "Searching the web for your question" },
    drafting: { status: "Drafting…", detail: draftingAction ? `${draftingAction.kind === "invite" ? "An invitation" : "An email"} to ${draftingAction.to}` : undefined },
    waiting: {
      status: "Waiting for your yes",
      detail: waitingHere[0] ? `${waitingHere[0].kind === "invite" ? "Invitation" : "Email"} to ${waitingHere[0].to}, below` : undefined,
    },
    sleeping: { status: waking ? "Waking up…" : "Asleep", detail: waking || !b ? undefined : `Briefing at ${b.wake}` },
    down: {
      status: "Can't reach Outlook",
      detail: b?.calendar.state === "down" && b?.inbox.state === "down" ? "Calendar and mail are missing from today" : b?.calendar.state === "down" ? "Your calendar is missing from today" : "Your mail is missing from today",
    },
    briefing: {
      status: "Building your briefing…",
      detail: ["Counting what's waiting for your yes", "Reading your calendar", "Checking mail that needs a reply", "Listing what's due", "Wrapping up"][briefStep],
    },
    fetching: { status: "Reminder due", detail: "Fetching it for you…" },
    delivering: { status: "Reminder due", detail: reminder.phase === "delivering" ? reminder.task.title : undefined },
  };
  const sources: Source[] =
    activity === "briefing"
      ? [
          ...(b && b.calendar.state !== "not_connected"
            ? [
                { kind: "cal", label: "Outlook calendar" },
                { kind: "mail", label: "Outlook mail" },
              ]
            : []),
          { kind: "task", label: "Your tasks" },
        ]
      : [
          ...(chatData?.files || []).slice(0, 3).map((f) => ({ kind: "file", label: f.name })),
          ...(lastTurn?.web ? [{ kind: "web", label: "Web search" }] : []),
        ];

  const waitingCount = b?.approvals.length ?? 0;
  const today = (
    <Today
      name={name}
      tz={tz}
      briefing={briefing}
      reveal={reveal}
      asleep={asleep}
      waking={waking}
      briefedAt={briefedAt}
      ringing={reminder.phase !== "none" ? reminder.task.id : null}
      onWake={wakeUp}
      onJump={jumpTo}
      onRetryOutlook={retryOutlook}
      retrying={retrying}
    />
  );

  return (
    <Layout waiting={waitingCount}>
      <div className="flex min-h-0 flex-1">
        {/* Today: a column on wide screens, a sheet on phones */}
        <aside aria-label="Today" className="hidden w-[360px] shrink-0 flex-col gap-7 overflow-y-auto border-r border-line px-6 py-7 lg:flex">
          {today}
        </aside>
        {todayOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-canvas lg:hidden" role="dialog" aria-modal="true" aria-label="Today">
            <div className="flex items-center justify-end px-4 pt-4">
              <button type="button" onClick={() => setTodayOpen(false)} aria-label="Close today" className="flex size-10 items-center justify-center rounded-full hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-5 pb-10">{today}</div>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col px-4 pt-4 sm:px-8 sm:pt-6">
          <Stage
            name={name}
            activity={activity}
            waking={waking}
            status={stageCopy[activity].status}
            detail={stageCopy[activity].detail}
            sources={sources}
            celebrateKey={celebrate.key}
            celebratePlane={celebrate.plane}
            pingKey={pingKey}
            onWake={wakeUp}
            onFetched={onFetched}
          />

          <ConversationBar
            chats={chats.status === "ready" ? chats.data : []}
            current={chatId}
            title={chatData?.title}
            waiting={waitingCount}
            onOpenToday={() => setTodayOpen(true)}
          />

          <Feed
            name={name}
            tz={tz}
            chatId={chatId}
            chat={chat}
            chatData={chatData}
            sending={sending}
            delivered={delivered}
            day={day}
            flashId={flashId}
            onChanged={() => {
              chat.reload();
              briefing.reload();
            }}
            onSent={() => setCelebrate((c) => ({ key: c.key + 1, plane: true }))}
            onReminderSettled={reminderSettled}
            onResend={(text) => send(text, [], false)}
          />

          <Composer
            name={name}
            asleep={asleep}
            busy={answering !== "none"}
            sending={sending}
            spendStopped={me.spend.state === "stopped"}
            onSend={send}
            onDismissError={() => setSending({ state: "idle" })}
          />
        </main>
      </div>
    </Layout>
  );
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

// --- Today -----------------------------------------------------------------------------

function Today({
  name,
  tz,
  briefing,
  reveal,
  asleep,
  waking,
  briefedAt,
  ringing,
  onWake,
  onJump,
  onRetryOutlook,
  retrying,
}: {
  name: string;
  tz: string;
  briefing: ReturnType<typeof useResource<Briefing>>;
  reveal: number;
  asleep: boolean;
  waking: boolean;
  briefedAt: string;
  ringing: string | null;
  onWake: () => void;
  onJump: (runId: string, chatId: string | null) => void;
  onRetryOutlook: () => void;
  retrying: boolean;
}) {
  const b = briefing.status === "ready" ? briefing.data : null;
  const dateLine = b ? new Date(b.now).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: tz }) : "";
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="font-mono text-xs text-ink-3">
          {dateLine}
          {b && !asleep && reveal >= 4 && briefedAt ? ` · checked ${briefedAt}` : ""}
        </p>
      </div>

      {briefing.status === "loading" ? (
        <TodaySkeleton />
      ) : briefing.status === "error" ? (
        <Problem title="Couldn't load today" failure={briefing.failure} onRetry={briefing.reload} />
      ) : asleep && b ? (
        <section data-state="asleep" className="animate-fade-in flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface p-4">
          <div>
            <h2 className="text-sm font-semibold">No briefing yet</h2>
            <p className="text-sm text-ink-3">
              {name} builds it from your calendar and mail at {b.wake}.
              {b.approvals.length > 0 && ` ${b.approvals.length} waiting for your yes.`}
            </p>
          </div>
          <button type="button" onClick={onWake} disabled={waking} className={buttons.primary}>
            Wake {name}
          </button>
        </section>
      ) : (
        b && (
          <>
            {briefing.stale && (
              <p role="status" className="flex items-center gap-2 text-xs text-ink-3">
                <CircleAlert size={13} className="text-accent" /> Couldn't refresh: {briefing.stale.message}
              </p>
            )}
            {reveal >= 1 && (
              <section data-state={b.approvals.length ? "waiting" : "empty"} className="animate-chip rounded-2xl border border-accent-line bg-surface p-4 shadow-soft">
                <div className="mb-2 flex items-center gap-2">
                  <span className={b.approvals.length ? "size-2 rounded-full bg-accent" : "size-2 rounded-full bg-ink-4"} />
                  <h2 className="text-sm font-semibold">Waiting for your yes</h2>
                  <span className="ml-auto font-mono text-xs text-ink-3">{b.approvals.length}</span>
                </div>
                {b.approvals.length === 0 ? (
                  <p className="animate-fade-in py-1 text-sm text-ink-3">Nothing waiting. Anything I draft lands here first.</p>
                ) : (
                  <ul className="-mx-2 flex flex-col">
                    {b.approvals.map((a) => (
                      <li key={a.run_id} className="animate-fade-in">
                        <button
                          type="button"
                          onClick={() => onJump(a.run_id, a.chat_id)}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
                        >
                          {a.kind === "invite" ? (
                            <CalendarDays size={15} strokeWidth={1.75} className="shrink-0 text-ink-3" />
                          ) : (
                            <Mail size={15} strokeWidth={1.75} className="shrink-0 text-ink-3" />
                          )}
                          <span className="flex-1 truncate">
                            {a.kind === "invite"
                              ? `Invite ${a.to ?? ""}${a.start ? " · " + new Date(a.start).toLocaleDateString("en-GB", { weekday: "short", timeZone: tz }) + " " + hhmm(a.start, tz) : ""}`
                              : a.kind === "mail"
                                ? `Email to ${a.to ?? ""}`
                                : a.subject || a.kind}
                          </span>
                          <span className="text-xs font-medium text-accent">Review</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {reveal >= 2 && <OutlookPart b={b} tz={tz} reveal={reveal} onRetry={onRetryOutlook} retrying={retrying} />}

            {reveal >= 4 && <DueList b={b} ringing={ringing} onChanged={briefing.reload} />}
          </>
        )
      )}
    </>
  );
}

function OutlookPart({ b, tz, reveal, onRetry, retrying }: { b: Briefing; tz: string; reveal: number; onRetry: () => void; retrying: boolean }) {
  if (b.calendar.state === "not_connected") {
    return (
      <section data-state="not_connected" className="animate-chip flex flex-col gap-1 rounded-2xl border border-dashed border-line-strong p-4">
        <h2 className="text-sm font-semibold">Outlook isn't connected</h2>
        <p className="text-sm text-ink-3">Your calendar and the mail that needs a reply will show here once it is. Settings says what's missing.</p>
      </section>
    );
  }
  const down = [b.calendar.state === "down" ? "calendar" : "", b.inbox.state === "down" ? "mail" : ""].filter(Boolean);
  return (
    <>
      {down.length > 0 && (
        <section data-state="down" className="animate-chip flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-start gap-2.5">
            <CircleAlert size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <h2 className="text-sm font-semibold">Couldn't reach Outlook</h2>
              <p className="text-sm text-ink-3">
                Your {down.join(" and ")} {down.length > 1 ? "are" : "is"} left out until it's back.
              </p>
              <p className="mt-1 font-mono text-xs text-ink-4">
                {b.calendar.state === "down" ? b.calendar.reason : b.inbox.state === "down" ? b.inbox.reason : ""}
              </p>
            </div>
          </div>
          <button type="button" onClick={onRetry} disabled={retrying} className={`flex w-fit items-center gap-2 ${buttons.secondary}`}>
            {retrying ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} strokeWidth={2} />}
            Try again
          </button>
        </section>
      )}
      {b.calendar.state === "ok" && (
        <div className="animate-chip">
          <TodayGroup label="Calendar">
            {b.calendar.items.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-ink-3">Nothing in the calendar today.</p>
            ) : (
              b.calendar.items.map((c) => (
                <a
                  key={c.id}
                  href="https://outlook.office.com/calendar/view/day"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-baseline gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <span className="w-11 shrink-0 font-mono text-xs text-ink-2 tabular-nums">{c.all_day ? "all day" : hhmm(c.start, tz)}</span>
                  <span className="flex-1 truncate">{c.subject}</span>
                  <span className="text-xs text-ink-4 group-hover:text-ink-3">Outlook</span>
                </a>
              ))
            )}
          </TodayGroup>
        </div>
      )}
      {b.inbox.state === "ok" && reveal >= 3 && (
        <div className="animate-chip">
          <TodayGroup label="Needs a reply">
            {b.inbox.items.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-ink-3">No unread mail since midnight.</p>
            ) : (
              b.inbox.items.map((n) => (
                <a
                  key={n.id}
                  href={`https://outlook.office.com/mail/inbox/id/${encodeURIComponent(n.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-baseline gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <span className="flex-1 truncate">
                    <span className="font-medium">{n.from}</span>
                    <span className="text-ink-3"> · {n.subject}</span>
                  </span>
                  <span className="text-xs text-ink-4 group-hover:text-ink-3">Mail</span>
                </a>
              ))
            )}
          </TodayGroup>
        </div>
      )}
    </>
  );
}

function DueList({ b, ringing, onChanged }: { b: Briefing; ringing: string | null; onChanged: () => void }) {
  const today = b.now.slice(0, 10);
  const seen = new Set<string>();
  const items = [...b.reminders, ...b.due].filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
  const [saving, setSaving] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const toggle = async (t: Task) => {
    if (saving) return;
    setSaving(t.id);
    setProblem(null);
    const r = await request(`/tasks/${t.id}`, { method: "PATCH", json: { status: t.status === "done" ? "todo" : "done" } });
    setSaving(null);
    if (!r.ok) setProblem(r.message);
    onChanged();
  };
  return (
    <div className="animate-chip">
      <TodayGroup label="Due">
        {items.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-ink-3">Nothing due today.</p>
        ) : (
          items.map((t) => (
            <label key={t.id} data-state={saving === t.id ? "saving" : t.status} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
              <input type="checkbox" checked={t.status === "done"} disabled={!!saving} onChange={() => toggle(t)} className="size-4 accent-accent" />
              <span className={t.status === "done" ? "flex-1 truncate text-ink-4 line-through" : "flex-1 truncate"}>{t.title}</span>
              <span className={ringing === t.id || (t.due && t.due <= b.now.slice(0, 16)) ? "font-mono text-xs font-semibold text-accent" : "font-mono text-xs text-ink-3"}>
                {dueLabel(t.due, today)}
              </span>
            </label>
          ))
        )}
        {problem && <p role="alert" className="px-2 text-sm text-accent">{problem}</p>}
      </TodayGroup>
    </div>
  );
}

function TodayGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="mb-1 font-mono text-xs text-ink-3">{label}</h2>
      <div className="-mx-2 flex flex-col">{children}</div>
    </section>
  );
}

function TodaySkeleton() {
  return (
    <div className="flex flex-col gap-7" data-state="loading" aria-label="Loading today">
      <div className="h-28 animate-pulse rounded-2xl bg-muted" />
      {[3, 2, 2].map((n, i) => (
        <div key={i} className="flex flex-col gap-2.5">
          <div className="h-3 w-20 rounded bg-muted" />
          {Array.from({ length: n }).map((_, j) => (
            <div key={j} className="h-4 rounded bg-muted" style={{ width: `${88 - j * 14}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// --- choosing a conversation ------------------------------------------------------------

function ConversationBar({
  chats,
  current,
  title,
  waiting,
  onOpenToday,
}: {
  chats: ChatSummary[];
  current?: string;
  title?: string;
  waiting: number;
  onOpenToday: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="mx-auto mt-3 flex w-full max-w-[720px] items-center gap-2">
      <button
        type="button"
        onClick={onOpenToday}
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line-strong px-3 text-sm font-medium hover:bg-muted lg:hidden"
      >
        Today
        {waiting > 0 && <span className="rounded-full bg-accent px-1.5 font-mono text-[10px] text-white">{waiting}</span>}
      </button>
      <label htmlFor="conversation" className="sr-only">
        Conversation
      </label>
      <select
        id="conversation"
        value={current || ""}
        onChange={(e) => navigate(e.target.value ? `/c/${e.target.value}` : "/")}
        className="h-8 min-w-0 flex-1 truncate rounded-full border border-line bg-transparent px-3 text-sm text-ink-2 outline-none hover:border-line-strong"
      >
        <option value="">{current ? "New conversation" : "New conversation"}</option>
        {current && !chats.some((c) => c.id === current) && <option value={current}>{title || "This conversation"}</option>}
        {chats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      {current && (
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-sm text-ink-2 hover:bg-muted"
          aria-label="Start a new conversation"
        >
          <Plus size={14} /> New
        </button>
      )}
    </div>
  );
}

// --- the conversation -------------------------------------------------------------------

type FeedItem =
  | { at: string; order: number; key: string; render: () => React.ReactNode };

function Feed({
  name,
  tz,
  chatId,
  chat,
  chatData,
  sending,
  delivered,
  day,
  flashId,
  onChanged,
  onSent,
  onReminderSettled,
  onResend,
}: {
  name: string;
  tz: string;
  chatId?: string;
  chat: ReturnType<typeof useResource<Chat>>;
  chatData: Chat | null;
  sending: Sending;
  delivered: Task[];
  day: string;
  flashId: string | null;
  onChanged: () => void;
  onSent: () => void;
  onReminderSettled: (celebrate: boolean) => void;
  onResend: (text: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  const items = useMemo<FeedItem[]>(() => {
    const out: FeedItem[] = [];
    if (!chatData) return out;
    for (const t of chatData.turns) {
      if (t.forgotten) {
        out.push({ at: t.created_at, order: 0, key: `f-${t.run_id}`, render: () => <p className="text-sm text-ink-3">This message was removed under the space's keep-for rule.</p> });
        continue;
      }
      out.push({
        at: t.created_at,
        order: 0,
        key: `q-${t.run_id}`,
        render: () => (
          <div className="animate-fade-in flex justify-end" data-state="sent">
            <div className="flex max-w-[80%] flex-col items-end gap-1">
              <div className="rounded-[20px] rounded-br-md bg-face px-4 py-2.5 text-[15px] whitespace-pre-wrap text-white">{t.message}</div>
              {(t.web || false) && <span className="font-mono text-xs text-ink-4">with web search</span>}
            </div>
          </div>
        ),
      });
      if (t.status === "done" && t.answer) {
        out.push({
          at: t.created_at,
          order: 1,
          key: `a-${t.run_id}`,
          render: () => (
            <div className="animate-fade-in" data-state="answered">
              <AgentText at={hhmm(t.created_at, tz)}>
                <Prose text={t.answer!} />
                {t.sources.length > 0 && (
                  <ul className="mt-1 flex flex-col gap-0.5 text-sm">
                    {t.sources.map((s, i) => (
                      <li key={i}>
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-accent underline-offset-2 hover:underline">
                          {s.title || s.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {t.caveats.length > 0 && (
                  <details className="text-sm text-ink-3">
                    <summary className="cursor-pointer font-mono text-xs">What {name} assumed or couldn't check ({t.caveats.length})</summary>
                    <ul className="mt-1 ml-4 list-disc space-y-0.5">
                      {t.caveats.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </AgentText>
            </div>
          ),
        });
      } else if (t.status === "failed") {
        out.push({
          at: t.created_at,
          order: 1,
          key: `e-${t.run_id}`,
          render: () => (
            <div className="max-w-[560px]">
              <Problem title={`${name} couldn't answer`} failure={t.error || "The answer failed."} onRetry={() => t.message && onResend(t.message)} />
            </div>
          ),
        });
      } else if (t.status === "queued" || t.status === "running") {
        out.push({
          at: t.created_at,
          order: 1,
          key: `w-${t.run_id}`,
          render: () => (
            <div data-state="answering" className="flex items-center gap-1.5 py-1" aria-label={`${name} is answering`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-1.5 animate-dot rounded-full bg-ink-3" style={{ animationDelay: `${i * 160}ms` }} />
              ))}
            </div>
          ),
        });
      }
    }
    for (const a of chatData.actions) {
      out.push({
        at: a.created_at,
        order: 2,
        key: `x-${a.run_id}`,
        render: () => <ApprovalCard item={a} tz={tz} flash={flashId === a.run_id} onChanged={onChanged} onSent={onSent} />,
      });
    }
    for (const t of chatData.tasks) {
      out.push({
        at: t.created_at || "",
        order: 3,
        key: `t-${t.id}`,
        render: () => (
          <p className="flex items-center gap-2 text-sm text-ink-3" data-state="task_added">
            <span className="size-1.5 rounded-full bg-ink-4" />
            Added to your tasks: <span className="text-ink">{t.title}</span>
            {t.due && <span className="font-mono text-xs">· {dueLabel(t.due, day)}</span>}
          </p>
        ),
      });
    }
    for (const p of chatData.proposals) {
      out.push({ at: p.created_at, order: 4, key: `m-${p.id}`, render: () => <MemoryCard id={p.id} text={p.text} status={p.status} onChanged={onChanged} /> });
    }
    return out.sort((x, y) => (x.at === y.at ? x.order - y.order : x.at < y.at ? -1 : 1));
  }, [chatData, tz, name, flashId, day, onChanged, onSent, onResend]);

  const count = items.length + delivered.length + (sending.state === "sending" ? 1 : 0);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [count]);

  const pendingShown = sending.state === "sending" && !chatData?.turns.some((t) => t.message === sending.text && (t.status === "queued" || t.status === "running"));

  return (
    <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto" data-state={!chatId ? "new" : chat.status === "ready" ? "ready" : chat.status}>
      <div className="mx-auto flex max-w-[720px] flex-col gap-4 py-5">
        {chatId && chat.status === "loading" && (
          <div className="flex flex-col gap-3" aria-label="Loading the conversation">
            <div className="ml-auto h-10 w-2/5 animate-pulse rounded-[20px] bg-muted" />
            <div className="h-16 w-3/4 animate-pulse rounded-xl bg-muted" />
          </div>
        )}
        {chatId && chat.status === "error" && (
          <Problem
            title={chat.failure.kind === "not_found" ? "That conversation isn't here" : "Couldn't load the conversation"}
            failure={chat.failure.kind === "not_found" ? "It may have been deleted. Start a new one below." : chat.failure}
            onRetry={chat.failure.kind === "not_found" ? undefined : chat.reload}
          />
        )}
        {chatId && chat.status === "ready" && chat.stale && (
          <p role="status" className="text-center font-mono text-xs text-ink-3">
            Couldn't refresh: {chat.stale.message}
          </p>
        )}
        {!chatId && sending.state !== "sending" && (
          <div data-state="empty" className="py-6 text-center text-sm text-ink-3">
            Ask {name} something, or ask for an email, an invitation or a reminder. Nothing leaves without your yes.
          </div>
        )}
        {items.map((it) => (
          <div key={it.key}>{it.render()}</div>
        ))}
        {pendingShown && (
          <div className="animate-fade-in flex justify-end" data-state="sending">
            <div className="max-w-[80%] rounded-[20px] rounded-br-md bg-face/80 px-4 py-2.5 text-[15px] whitespace-pre-wrap text-white">{sending.text}</div>
          </div>
        )}
        {delivered.map((t) => (
          <ReminderCard
            key={`r-${t.id}`}
            task={t}
            tz={tz}
            dueText={dueLabel(t.due, day)}
            onChanged={() => onReminderSettled(false)}
            onDone={() => onReminderSettled(true)}
          />
        ))}
      </div>
    </div>
  );
}

// --- the composer -----------------------------------------------------------------------

const READABLE = ".pdf,.docx,.txt,.md,.csv";

function Composer({
  name,
  asleep,
  busy,
  sending,
  spendStopped,
  onSend,
  onDismissError,
}: {
  name: string;
  asleep: boolean;
  busy: boolean;
  sending: Sending;
  spendStopped: boolean;
  onSend: (text: string, files: File[], web: boolean) => Promise<boolean>;
  onDismissError: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [web, setWeb] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const reasonId = "composer-reason";

  useEffect(() => {
    if (sending.state === "failed") setDraft((d) => d || sending.text); // keep what was written
  }, [sending]);

  const reason =
    sending.state === "sending" ? "Sending…" : busy ? `Wait for ${name} to finish this answer.` : !draft.trim() ? "Write a message first." : null;

  return (
    <div className="pb-safe mx-auto mb-16 flex w-full max-w-[720px] shrink-0 flex-col gap-2 md:mb-6">
      {spendStopped && (
        <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-ink-2">
          This month's spending cap is reached. Your own messages still go through; nothing starts on its own until next month.
        </p>
      )}
      {sending.state === "failed" && (
        <div role="alert" data-state="send_failed" className="flex items-start gap-2 rounded-xl border border-accent-line bg-surface px-3 py-2 text-sm">
          <CircleAlert size={15} className="mt-0.5 shrink-0 text-accent" />
          <span className="flex-1">Not sent. {sending.message}</span>
          <button type="button" onClick={onDismissError} aria-label="Dismiss" className="text-ink-3 hover:text-ink">
            <X size={15} />
          </button>
        </div>
      )}
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pr-1.5 pl-3 text-xs text-ink-2">
              {f.name}
              <button type="button" onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} className="text-ink-4 hover:text-ink">
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        data-state={sending.state === "sending" ? "sending" : busy ? "busy" : "ready"}
        onSubmit={async (e) => {
          e.preventDefault();
          if (reason) return;
          const text = draft;
          setDraft("");
          const ok = await onSend(text, files, web);
          if (ok) {
            setFiles([]);
            setWeb(false);
          }
        }}
        className="flex w-full items-center gap-1 rounded-[22px] border border-line bg-surface py-2 pr-2 pl-2 shadow-soft focus-within:border-line-strong"
      >
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={READABLE}
          className="hidden"
          onChange={(e) => {
            const picked = Array.from(e.target.files || []);
            setFiles((fs) => [...fs, ...picked].slice(0, 5));
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          aria-label="Attach files (PDF, Word, text, Markdown or CSV, up to 5)"
          title="Attach files"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-muted hover:text-ink"
        >
          <Paperclip size={17} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => setWeb((w) => !w)}
          aria-pressed={web}
          aria-label="Search the web for this message"
          title={web ? "Web search on" : "Search the web"}
          className={web ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent" : "flex size-9 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-muted hover:text-ink"}
        >
          <Globe size={17} strokeWidth={1.75} />
        </button>
        <label htmlFor="composer" className="sr-only">
          Message {name}
        </label>
        <input
          id="composer"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={asleep ? `${name} is asleep. A message wakes him.` : `Message ${name}`}
          autoComplete="off"
          className="h-9 min-w-0 flex-1 bg-transparent px-2 text-[15px] outline-none placeholder:text-ink-4"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!!reason}
          aria-describedby={reason ? reasonId : undefined}
          title={reason || undefined}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong"
        >
          {sending.state === "sending" ? <Loader2 size={17} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={2} />}
        </button>
        <span id={reasonId} className="sr-only">
          {reason}
        </span>
      </form>
    </div>
  );
}

