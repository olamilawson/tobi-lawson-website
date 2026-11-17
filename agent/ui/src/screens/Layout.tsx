import Rail from "../components/Rail";
import { useMe } from "../session";

/** Every signed-in screen: the rail, and the spend note when the month's cap is near. */
export default function Layout({ waiting, children }: { waiting?: number; children: React.ReactNode }) {
  const me = useMe();
  return (
    <div className="flex h-dvh min-h-[560px] bg-canvas font-sans text-ink">
      <Rail waiting={waiting} />
      <div className="flex min-w-0 flex-1 flex-col">
        {me.spend.state === "alert" && (
          <p data-state="spend_alert" className="bg-accent-soft px-4 py-1.5 text-center text-xs text-ink-2">
            Most of this month's spending cap is used. Settings shows the figures.
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

/** A plain page inside the layout: a heading, an optional line, and the content. */
export function Page({ title, lead, waiting, children, action }: { title: string; lead?: string; waiting?: number; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Layout waiting={waiting}>
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-24 sm:px-8 md:pb-10">
        <div className="mx-auto flex max-w-[760px] flex-col gap-6">
          <header className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {lead && <p className="text-sm text-ink-3">{lead}</p>}
            </div>
            {action}
          </header>
          {children}
        </div>
      </main>
    </Layout>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <div data-state="loading" aria-label={label} className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div data-state="empty" className="rounded-2xl border border-dashed border-line-strong px-5 py-8 text-center text-sm text-ink-3">
      {children}
    </div>
  );
}
