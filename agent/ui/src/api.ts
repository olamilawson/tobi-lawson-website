// Every call to the agent's API goes through request(). It never throws: it
// returns one of a fixed set of outcomes, so each screen can show the right
// state in words instead of guessing from an exception.
//
//   ok             the data
//   signed_out     401: the session ended; the app goes back to sign-in
//   not_running    the service did not answer as the API (nginx served a page,
//                  or 502/504): the agent is not running on the server
//   not_set_up     503 from the API: sign-in is not configured on the server
//   offline        the browser could not reach the site at all
//   spend_stopped  402: the month's spending cap stops new work
//   locked         429: too many failed sign-ins
//   conflict       409: someone (or another tab) already did this, or it is busy
//   not_found      404
//   invalid        422: the request was refused, with the reason
//   refused        403: the request came from another site
//   failed         anything else, with the status

export const API = "/api/agent";

export type Failure = {
  ok: false;
  kind:
    | "signed_out"
    | "not_running"
    | "not_set_up"
    | "offline"
    | "spend_stopped"
    | "locked"
    | "conflict"
    | "not_found"
    | "invalid"
    | "refused"
    | "failed";
  message: string;
  status?: number;
};
export type Result<T> = { ok: true; data: T } | Failure;

const KIND: Record<number, Failure["kind"]> = {
  401: "signed_out",
  402: "spend_stopped",
  403: "refused",
  404: "not_found",
  409: "conflict",
  422: "invalid",
  429: "locked",
  503: "not_set_up",
};

// Listeners told when any call finds the session gone, so the app can show sign-in.
const signedOutListeners = new Set<() => void>();
export const onSignedOut = (fn: () => void) => {
  signedOutListeners.add(fn);
  return () => {
    signedOutListeners.delete(fn);
  };
};

export async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<Result<T>> {
  const { json, ...rest } = init;
  const opts: RequestInit = { credentials: "same-origin", ...rest, headers: { Accept: "application/json", ...(rest.headers || {}) } };
  if (json !== undefined) {
    opts.body = JSON.stringify(json);
    opts.headers = { ...opts.headers, "Content-Type": "application/json" };
  }
  let res: Response;
  try {
    res = await fetch(API + path, opts);
  } catch {
    return { ok: false, kind: "offline", message: "Couldn't reach the site. Check your connection." };
  }
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  if (!isJson) {
    if (res.status === 204) return { ok: true, data: undefined as T };
    // Without the service, nginx answers with a page or a gateway error.
    return { ok: false, kind: "not_running", status: res.status, message: "The agent isn't running on the server." };
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    return { ok: false, kind: "not_running", status: res.status, message: "The agent sent back something unreadable." };
  }
  if (res.ok) return { ok: true, data: body as T };
  const detail = typeof (body as { detail?: unknown })?.detail === "string" ? (body as { detail: string }).detail : "";
  const kind = KIND[res.status] || "failed";
  // A wrong password at sign-in is not a lost session.
  if (kind === "signed_out" && path !== "/session") signedOutListeners.forEach((fn) => fn());
  return { ok: false, kind, status: res.status, message: sentence(detail) || `The agent refused the request (${res.status}).` };
}

function sentence(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) + (/[.!?]$/.test(s) ? "" : ".") : "";
}

// --- shapes the API returns ----------------------------------------------------------

export type Session = { signed_in: boolean; login_required: boolean; code_required?: boolean };

export type Me = {
  agent_name: string;
  owner_name: string;
  character: { name: string; about: string; hours: { timezone: string; wake: string; sleep: string } };
  models: Record<string, string>;
  mailbox_connected: boolean;
  connectors: { name: string; label: string; connected: boolean; missing: string[] }[];
  spend: { state: "none" | "ok" | "alert" | "stopped"; [k: string]: unknown };
};

export type Source<T> = { state: "ok"; items: T[] } | { state: "down"; reason: string; items: T[] } | { state: "not_connected"; items: T[] };
export type CalEvent = { id: string; subject: string; start: string; end: string; all_day: boolean; place: string; attendees: number };
export type Unread = { id: string; from: string; address: string; subject: string; preview: string; received_at: string; important: boolean };
export type Task = {
  id: string;
  title: string;
  status: "todo" | "done" | string;
  due: string | null;
  reminded_at: string | null;
  snoozed_until: string | null;
  chat_id: string | null;
  workstream: string;
  created_at?: string;
};
export type ApprovalBrief = { run_id: string; kind: string; chat_id: string | null; to?: string; subject?: string; start?: string };

export type Briefing = {
  agent: string;
  owner: string;
  now: string;
  timezone: string;
  awake: boolean;
  wake: string;
  sleep: string;
  next_wake: string;
  approvals: ApprovalBrief[];
  reminders: Task[];
  due: Task[];
  proposals: number;
  calendar: Source<CalEvent>;
  inbox: Source<Unread>;
};

export type ChatSummary = { id: string; space: string; title: string; updated_at: string; state: "ready" | "waiting" };

export type Turn = {
  run_id: string;
  status: string;
  created_at: string;
  message: string | null;
  answer: string | null;
  caveats: string[];
  sources: { title?: string; url?: string }[];
  error: string | null;
  web: boolean;
  forgotten: boolean;
};

export type Action = {
  run_id: string;
  kind: "mail" | "invite";
  status: string;
  created_at: string;
  to: string;
  subject: string;
  body: string | null;
  start: string | null;
  end: string | null;
  editable: boolean;
  approval_error: string | null;
  held: boolean;
  error: string | null;
};

export type Proposal = { id: string; text: string; status: "open" | "kept" | "dismissed"; chat_id: string | null; workstream: string; memory_id: string | null; created_at: string };

export type Chat = {
  id: string;
  space: string;
  title: string;
  state: "ready" | "waiting";
  last_turn: { id: string; status: string } | null;
  files: { name: string }[];
  turns: Turn[];
  actions: Action[];
  tasks: Task[];
  proposals: Proposal[];
};

export type QueueItem = {
  run_id: string;
  workflow: string;
  client: string;
  kind: string;
  chat_id: string | null;
  created_at: string;
  content: Record<string, string>;
  content_hash: string;
  error: string | null;
  action: string;
  notes: string[];
  editable: boolean;
};
export type Question = { run_id: string; workflow: string; client: string; goal: string; questions: string[] };

export type MemoryItem = { id: string; workstream: string; kind: string; title: string; text: string; created_at: string };

// --- small helpers -------------------------------------------------------------------

/** "07:00" from an ISO time, in the agent's time zone. */
export function hhmm(iso: string | null | undefined, tz?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(11, 16);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });
}

/** A task's due text: "08:00" today, "Fri" this week, "18 Nov" later. Due is local "YYYY-MM-DDTHH:MM". */
export function dueLabel(due: string | null, today: string) {
  if (!due) return "";
  const [day, time] = due.split("T");
  if (day === today) return time;
  const d = new Date(`${day}T12:00:00`);
  const t = new Date(`${today}T12:00:00`);
  const days = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (days > 0 && days < 7) return d.toLocaleDateString("en-GB", { weekday: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
