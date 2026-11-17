// What the agent remembers about the owner. Suggestions come from conversations
// (open -> kept | dismissed, once); notes can be added by hand and forgotten.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { type MemoryItem, type Proposal, request } from "../api";
import { MemoryCard, Problem, buttons } from "../components/Cards";
import { useMe } from "../session";
import { useResource } from "../useResource";
import { Empty, Loading, Page } from "./Layout";

export default function Memory() {
  const me = useMe();
  const proposals = useResource<Proposal[]>("/memory/proposals?status=open", 60_000);
  const notes = useResource<MemoryItem[]>("/memory");
  const changed = () => {
    proposals.reload();
    notes.reload();
  };
  const kept = notes.status === "ready" ? notes.data.filter((n) => n.kind !== "draft") : [];

  return (
    <Page title="Memory" lead={`What ${me.character.name} keeps in mind about you, read with every answer.`}>
      {proposals.status === "error" && <Problem title="Couldn't load suggestions" failure={proposals.failure} onRetry={proposals.reload} />}
      {proposals.status === "ready" && proposals.data.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-mono text-xs text-ink-3">Suggested from your conversations</h2>
          {proposals.data.map((p) => (
            <div key={p.id} className="flex flex-col gap-1">
              <MemoryCard id={p.id} text={p.text} status={p.status} onChanged={changed} />
              {p.chat_id && (
                <Link to={`/c/${p.chat_id}`} className="px-1 font-mono text-xs text-ink-4 hover:text-ink-2">
                  From a conversation
                </Link>
              )}
            </div>
          ))}
        </section>
      )}

      <AddNote onAdded={notes.reload} />

      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-xs text-ink-3">Remembered</h2>
        {notes.status === "loading" && <Loading label="Loading memory" />}
        {notes.status === "error" && <Problem title="Couldn't load memory" failure={notes.failure} onRetry={notes.reload} />}
        {notes.status === "ready" &&
          (kept.length === 0 ? (
            <Empty>Nothing remembered yet. Add a note above, or keep a suggestion from a conversation.</Empty>
          ) : (
            <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
              {kept.map((n) => (
                <NoteRow key={n.id} n={n} onChanged={notes.reload} />
              ))}
            </ul>
          ))}
      </section>
    </Page>
  );
}

function AddNote({ onAdded }: { onAdded: () => void }) {
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <form
      data-state={adding ? "adding" : "idle"}
      onSubmit={async (e) => {
        e.preventDefault();
        if (adding || !text.trim()) return;
        setAdding(true);
        setProblem(null);
        const r = await request("/memory", { method: "POST", json: { text } });
        setAdding(false);
        if (!r.ok) return setProblem(r.message);
        setText("");
        onAdded();
      }}
      className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3 sm:flex-row sm:items-center"
    >
      <label htmlFor="note" className="sr-only">
        Something to remember
      </label>
      <input id="note" value={text} onChange={(e) => setText(e.target.value)} placeholder="Something to remember, e.g. “You prefer calls after 2pm”" className="h-9 min-w-0 flex-1 bg-transparent px-2 text-[15px] outline-none placeholder:text-ink-4" />
      <button type="submit" disabled={adding || !text.trim()} className={buttons.primary}>
        {adding ? "Saving…" : "Remember"}
      </button>
      {problem && <p role="alert" className="text-sm text-accent sm:basis-full">{problem}</p>}
    </form>
  );
}

/**   idle ──Forget──> confirming ──Forget for good──> forgetting ──> (gone)   */
function NoteRow({ n, onChanged }: { n: MemoryItem; onChanged: () => void }) {
  const [state, setState] = useState<"idle" | "confirming" | "forgetting">("idle");
  const [problem, setProblem] = useState<string | null>(null);
  const forget = async () => {
    setState("forgetting");
    const r = await request(`/memory/${n.id}`, { method: "DELETE" });
    if (!r.ok) {
      setState("idle");
      setProblem(r.message);
      return;
    }
    onChanged();
  };
  return (
    <li data-state={state} className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="min-w-0 flex-1 text-sm">{n.text}</span>
      <span className="font-mono text-xs text-ink-4">{n.workstream}</span>
      {state === "confirming" ? (
        <span className="flex items-center gap-1">
          <button type="button" onClick={forget} className="h-7 rounded-full bg-accent px-3 text-xs font-semibold text-white hover:bg-accent-hover">
            Forget for good
          </button>
          <button type="button" onClick={() => setState("idle")} className="h-7 rounded-full px-2 text-xs text-ink-2 hover:bg-muted">
            Keep
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setState("confirming")} disabled={state !== "idle"} aria-label={`Forget: ${n.text}`} className="flex size-7 items-center justify-center rounded-full text-ink-4 hover:bg-muted hover:text-ink">
          <Trash2 size={14} />
        </button>
      )}
      {problem && <p role="alert" className="basis-full text-sm text-accent">{problem}</p>}
    </li>
  );
}
