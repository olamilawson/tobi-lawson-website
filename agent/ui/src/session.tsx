// The session machine: whether the page can talk to the agent at all.
//
//   checking ──GET /session──> signed_out ──POST /session ok──> loading_me ──GET /me──> ready
//      │                          ▲  │                                                   │
//      │                          │  └─ 429 ─> (SignIn shows "locked"; still signed_out) │
//      │                          └──────────── any 401 from any call, or sign out ──────┘
//      ├─ not_running   the service did not answer as the API      } each has a
//      ├─ not_set_up    503: sign-in is not configured on the server } screen with
//      └─ offline       the browser could not reach the site         } "Try again"
//
// Transitions happen only in the reducer below. The current state is on
// <body data-session="..."> for anyone (or any agent) reading the page.

import { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import { type Me, type Session, onSignedOut, request } from "./api";

export type SessionState =
  | { state: "checking" }
  | { state: "not_running"; message: string }
  | { state: "not_set_up"; message: string }
  | { state: "offline"; message: string }
  | { state: "signed_out"; codeRequired: boolean; ended: boolean }
  | { state: "loading_me" }
  | { state: "ready"; me: Me; loginRequired: boolean };

type Event =
  | { type: "check" }
  | { type: "unreachable"; kind: "not_running" | "not_set_up" | "offline"; message: string }
  | { type: "signed_out"; codeRequired: boolean; ended?: boolean }
  | { type: "signed_in" }
  | { type: "me"; me: Me; loginRequired: boolean };

function reduce(_: SessionState, e: Event): SessionState {
  switch (e.type) {
    case "check":
      return { state: "checking" };
    case "unreachable":
      return { state: e.kind, message: e.message };
    case "signed_out":
      return { state: "signed_out", codeRequired: e.codeRequired, ended: !!e.ended };
    case "signed_in":
      return { state: "loading_me" };
    case "me":
      return { state: "ready", me: e.me, loginRequired: e.loginRequired };
  }
}

type Ctx = {
  session: SessionState;
  recheck: () => void;
  signedIn: () => void;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
};
const SessionContext = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, dispatch] = useReducer(reduce, { state: "checking" });

  const load = useCallback(async () => {
    const s = await request<Session>("/session");
    if (!s.ok) {
      const kind = s.kind === "not_set_up" || s.kind === "offline" ? s.kind : "not_running";
      dispatch({ type: "unreachable", kind, message: s.message });
      return;
    }
    if (!s.data.signed_in) {
      dispatch({ type: "signed_out", codeRequired: !!s.data.code_required });
      return;
    }
    const me = await request<Me>("/me");
    if (me.ok) dispatch({ type: "me", me: me.data, loginRequired: s.data.login_required });
    else if (me.kind === "signed_out") dispatch({ type: "signed_out", codeRequired: !!s.data.code_required, ended: true });
    else dispatch({ type: "unreachable", kind: me.kind === "not_set_up" || me.kind === "offline" ? me.kind : "not_running", message: me.message });
  }, []);

  useEffect(() => {
    load();
    return onSignedOut(() => dispatch({ type: "signed_out", codeRequired: false, ended: true }));
  }, [load]);

  useEffect(() => {
    document.body.dataset.session = session.state;
  }, [session.state]);

  const ctx: Ctx = {
    session,
    recheck: () => {
      dispatch({ type: "check" });
      load();
    },
    signedIn: () => {
      dispatch({ type: "signed_in" });
      load();
    },
    signOut: async () => {
      await request("/session", { method: "DELETE" });
      dispatch({ type: "signed_out", codeRequired: false });
      load();
    },
    refreshMe: async () => {
      const me = await request<Me>("/me");
      if (me.ok && session.state === "ready") dispatch({ type: "me", me: me.data, loginRequired: session.loginRequired });
    },
  };
  return <SessionContext.Provider value={ctx}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const c = useContext(SessionContext);
  if (!c) throw new Error("useSession outside SessionProvider");
  return c;
}

/** The signed-in owner's view of the agent. Only call inside a ready session. */
export function useMe(): Me {
  const { session } = useSession();
  if (session.state !== "ready") throw new Error("useMe before the session is ready");
  return session.me;
}
