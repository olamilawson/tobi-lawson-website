// Sign-in. Its own small machine:
//   idle ──submit──> checking ──ok──> (session: loading_me)
//                       ├──401──> wrong (the reason; try again)
//                       ├──429──> locked (sign-in paused; no form)
//                       └──other──> failed (the reason; try again)
import { useState } from "react";
import Agent from "../components/Agent";
import { request } from "../api";
import { useSession } from "../session";
import { buttons } from "../components/Cards";

type State = { state: "idle" } | { state: "checking" } | { state: "wrong"; message: string } | { state: "locked"; message: string } | { state: "failed"; message: string };

export default function SignIn({ codeRequired, ended }: { codeRequired: boolean; ended: boolean }) {
  const { signedIn } = useSession();
  const [s, setS] = useState<State>({ state: "idle" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

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
      <div aria-hidden="true">
        <Agent pose={s.state === "locked" ? "down" : s.state === "checking" ? "think" : "idle"} size={120} />
      </div>
      <div className="flex w-full max-w-[340px] flex-col gap-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">Sign in to your desk</h1>
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
              <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
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
      </div>
    </main>
  );
}
