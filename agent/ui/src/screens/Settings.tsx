// What the agent is, what it can reach, and what it has spent. Read-only here:
// these are set on the server (agent/config and the service's environment).
import { useState } from "react";
import { Check, CircleAlert, LogOut } from "lucide-react";
import { useMe, useSession } from "../session";
import { useResource } from "../useResource";
import { Problem, buttons } from "../components/Cards";
import { Page } from "./Layout";

type Costs = { month: string; total_usd: number; runs: number; cap: { cap_usd: number | null; used: number | null; state: string } };
type Space = { name: string; restricted: boolean; retention_days: number | null };

export default function Settings() {
  const me = useMe();
  const { session, signOut } = useSession();
  const costs = useResource<Costs>("/costs");
  const spaces = useResource<Space[]>("/spaces");
  const [leaving, setLeaving] = useState(false);
  const c = me.character;

  return (
    <Page
      title="Settings"
      lead="Set on the server; shown here so you can see what's in place."
      action={
        session.state === "ready" && session.loginRequired ? (
          <button
            type="button"
            disabled={leaving}
            onClick={async () => {
              setLeaving(true);
              await signOut();
            }}
            className={`flex items-center gap-2 ${buttons.secondary}`}
          >
            <LogOut size={14} /> {leaving ? "Signing out…" : "Sign out"}
          </button>
        ) : undefined
      }
    >
      <Section title={c.name}>
        <Row label="Who">{c.about || "No description in character.yaml yet."}</Row>
        <Row label="Hours">
          Awake {c.hours.wake}–{c.hours.sleep}, {c.hours.timezone.replace("_", " ")}
        </Row>
        <Row label="Works for">{me.owner_name}</Row>
      </Section>

      <Section title="Connections">
        <Row label="Outlook">
          <Status ok={me.mailbox_connected} yes="Connected: mail, calendar and invitations" no="Not connected. Approved emails are held in the agent's outbox; calendar and invitations are off." />
        </Row>
        {me.connectors.map((k) => (
          <Row key={k.name} label={k.label}>
            <Status ok={k.connected} yes="Connected" no={`Missing ${k.missing.join(", ")}`} />
          </Row>
        ))}
      </Section>

      <Section title="Models">
        {Object.entries(me.models).map(([tier, model]) => (
          <Row key={tier} label={tier}>
            <span className="font-mono text-xs">{model}</span>
          </Row>
        ))}
      </Section>

      <Section title="Spending this month">
        {costs.status === "loading" && <p className="text-sm text-ink-3">Loading…</p>}
        {costs.status === "error" && <Problem failure={costs.failure} onRetry={costs.reload} />}
        {costs.status === "ready" && (
          <>
            <Row label="Spent">
              <span className="font-mono">${costs.data.total_usd.toFixed(2)}</span> across {costs.data.runs} runs
            </Row>
            <Row label="Cap">
              {costs.data.cap.cap_usd == null ? (
                "No monthly cap set."
              ) : (
                <span data-state={costs.data.cap.state}>
                  <span className="font-mono">${costs.data.cap.cap_usd.toFixed(2)}</span>, {Math.round((costs.data.cap.used || 0) * 100)}% used
                  {costs.data.cap.state === "stopped" && ". Reached: only your own messages start work."}
                </span>
              )}
            </Row>
          </>
        )}
      </Section>

      <Section title="Spaces">
        {spaces.status === "error" && <Problem failure={spaces.failure} onRetry={spaces.reload} />}
        {spaces.status === "ready" &&
          spaces.data.map((s) => (
            <Row key={s.name} label={s.name}>
              {s.restricted ? "Restricted" : "Open"}
              {s.retention_days ? `, kept for ${s.retention_days} days` : ""}
            </Row>
          ))}
      </Section>
    </Page>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-1 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5 text-sm sm:flex-row sm:gap-4">
      <span className="w-32 shrink-0 font-mono text-xs text-ink-3 capitalize sm:pt-0.5">{label}</span>
      <span className="text-ink-2">{children}</span>
    </div>
  );
}

function Status({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span data-state={ok ? "connected" : "not_connected"} className="flex items-start gap-1.5">
      {ok ? <Check size={14} className="mt-0.5 shrink-0 text-ink" /> : <CircleAlert size={14} className="mt-0.5 shrink-0 text-accent" />}
      {ok ? yes : no}
    </span>
  );
}
