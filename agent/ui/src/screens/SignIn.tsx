// The signed-out desk. A stranger who lands here sees what it is and where to
// read about Ola; the owner is one click from the form.
//
//   intro ──Sign in──> idle ──submit──> checking ──ok──> (session: loading_me)
//     ▲                 │                  ├──401──> wrong (the reason; try again)
//     └──Back───────────┘                  ├──429──> locked (sign-in paused; no form)
//                                          └──other──> failed (the reason; try again)
// A session that ended skips the intro: the owner was here a moment ago.
import { useEffect, useRef, useState } from "react";
import { AgentPortrait } from "../components/Agent";
import { request } from "../api";
import { useSession } from "../session";
import { buttons } from "../components/Cards";

type State =
  | { state: "intro" }
  | { state: "idle" }
  | { state: "checking" }
  | { state: "wrong"; message: string }
  | { state: "locked"; message: string }
  | { state: "failed"; message: string };

export default function SignIn({ codeRequired, ended }: { codeRequired: boolean; ended: boolean }) {
  const { signedIn } = useSession();
  const [s, setS] = useState<State>({ state: ended ? "idle" : "intro" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const emailField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (s.state === "idle") emailField.current?.focus();
  }, [s.state]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (s.state === "checking" || s.state === "locked") return;
    setS({ state: "checking" });
    const r = await request("/session", { method: "POST", json: { email, password, code } });
    if (r.ok) return signedIn();
    if (r.kind === "locked") return setS({ state: "locked", message: r.message });
    setPassword("");
    setS(r.kind === "signed_out" ? { state: "wrong", message: r.message } : { state: "failed", message: r.message });
  };

  const field = "h-10 w-full rounded-xl border border-line-strong bg-surface px-3 text-[15px] outline-none focus:border-ink-3";
  return (
    <main data-state={s.state} className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-4 font-sans text-ink">
      <AgentPortrait size={s.state === "intro" ? 112 : 80} />

      {s.state === "intro" ? (
        <div className="flex max-w-[380px] flex-col items-center gap-5 text-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Tobi's desk</h1>
            <p className="text-[15px] text-ink-2">A private workspace for working with Ola, Tobi's personal agent.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a href="/ola/" className={`${buttons.secondary} inline-flex items-center`}>
              Read about Ola
            </a>
            <button type="button" onClick={() => setS({ state: "idle" })} className={buttons.primary}>
              Sign in
            </button>
          </div>
        </div>
      ) : (
        <div className="flex w-full max-w-[340px] flex-col gap-4">
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">Sign in to the desk</h1>
            {ended && s.state === "idle" && <p className="text-sm text-ink-3">Your session ended. Sign in again.</p>}
          </div>
          {s.state === "locked" ? (
            <p role="alert" className="rounded-xl bg-accent-soft p-3 text-center text-sm text-ink-2">
              {s.message}
            </p>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Email
                <input ref={emailField} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Password
                <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
              </label>
              {codeRequired && (
                <label className="flex flex-col gap-1 text-sm">
                  Code from your authenticator
                  <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required value={code} onChange={(e) => setCode(e.target.value)} className={field} />
                </label>
              )}
              {(s.state === "wrong" || s.state === "failed") && (
                <p role="alert" className="text-sm text-accent">
                  {s.message}
                </p>
              )}
              <button type="submit" disabled={s.state === "checking"} className={`${buttons.primary} h-10`}>
                {s.state === "checking" ? "Checking…" : "Sign in"}
              </button>
            </form>
          )}
          <button type="button" onClick={() => setS({ state: "intro" })} className="text-sm text-ink-3 hover:text-ink">
            Back
          </button>
        </div>
      )}
    </main>
  );
}
