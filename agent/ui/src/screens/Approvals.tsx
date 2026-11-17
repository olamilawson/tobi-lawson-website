// Everything waiting for the owner, from every conversation and workflow:
// approvals (GET /approvals) and questions a run asked (answered with POST /runs/{id}/input).
import { useState } from "react";
import { Link } from "react-router-dom";
import { type QueueItem, type Question, request } from "../api";
import { ApprovalCard, Problem, buttons } from "../components/Cards";
import { useMe } from "../session";
import { useResource } from "../useResource";
import { Empty, Loading, Page } from "./Layout";

export default function Approvals() {
  const me = useMe();
  const tz = me.character.hours.timezone;
  const queue = useResource<{ approvals: QueueItem[]; questions: Question[] }>("/approvals", 20_000);
  const waiting = queue.status === "ready" ? queue.data.approvals.length : undefined;

  return (
    <Page title="Approvals" lead={`Nothing leaves without your yes. ${me.character.name} drafts; you decide.`} waiting={waiting}>
      {queue.status === "loading" && <Loading label="Loading what's waiting" />}
      {queue.status === "error" && <Problem title="Couldn't load what's waiting" failure={queue.failure} onRetry={queue.reload} />}
      {queue.status === "ready" && (
        <>
          {queue.stale && <p role="status" className="font-mono text-xs text-ink-3">Couldn't refresh: {queue.stale.message}</p>}
          {queue.data.approvals.length === 0 && queue.data.questions.length === 0 && <Empty>Nothing waiting. Anything {me.character.name} drafts lands here first.</Empty>}
          {queue.data.approvals.map((a) => (
            <section key={a.run_id} className="flex flex-col gap-2" data-kind={a.kind}>
              <div className="flex items-center gap-2 font-mono text-xs text-ink-3">
                <span>{new Date(a.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: tz })}</span>
                <span>·</span>
                <span>{a.client}</span>
                {a.chat_id && (
                  <Link to={`/c/${a.chat_id}`} className="ml-auto text-accent hover:underline">
                    Open the conversation
                  </Link>
                )}
              </div>
              {a.notes.length > 0 && (
                <ul className="text-sm text-ink-2">
                  {a.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              )}
              <ApprovalCard
                item={{
                  run_id: a.run_id,
                  kind: a.kind,
                  status: "waiting_for_approval",
                  to: a.content.to,
                  subject: a.content.subject ?? a.content.message_subject,
                  body: a.content.body ?? a.content.message_body,
                  start: a.content.start,
                  end: a.content.end,
                  editable: a.editable,
                  approval_error: a.error,
                }}
                tz={tz}
                onChanged={queue.reload}
              />
            </section>
          ))}
          {queue.data.questions.map((q) => (
            <QuestionCard key={q.run_id} q={q} onAnswered={queue.reload} />
          ))}
        </>
      )}
    </Page>
  );
}

/**
 *   open ──Send answers──> sending ──ok──> (gone from the list)
 *                             └──fails──> open, with the reason
 */
function QuestionCard({ q, onAnswered }: { q: Question; onAnswered: () => void }) {
  const [text, setText] = useState("");
  const [state, setState] = useState<"open" | "sending">("open");
  const [problem, setProblem] = useState<string | null>(null);
  const submit = async () => {
    if (state !== "open" || !text.trim()) return;
    setState("sending");
    setProblem(null);
    const r = await request(`/runs/${q.run_id}/input`, { method: "POST", json: { answers: text } });
    setState("open");
    if (!r.ok) setProblem(r.message);
    else onAnswered();
  };
  return (
    <section data-state={state} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="font-mono text-xs text-ink-3">Questions · {q.client}</div>
      {q.goal && <p className="text-sm font-semibold">{q.goal}</p>}
      <ol className="ml-5 list-decimal text-sm text-ink-2">
        {q.questions.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ol>
      <label htmlFor={`answer-${q.run_id}`} className="sr-only">
        Your answers
      </label>
      <textarea id={`answer-${q.run_id}`} value={text} onChange={(e) => setText(e.target.value)} rows={4} className="rounded-lg border border-line-strong bg-canvas p-3 text-sm outline-none focus:border-ink-3" />
      {problem && <p role="alert" className="text-sm text-accent">{problem}</p>}
      <button type="button" onClick={submit} disabled={state !== "open" || !text.trim()} className={`w-fit ${buttons.primary}`}>
        {state === "sending" ? "Sending…" : "Send answers"}
      </button>
    </section>
  );
}
