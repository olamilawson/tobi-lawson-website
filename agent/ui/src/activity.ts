// What the agent is doing, as the stage shows it. Derived from the data in one
// place (deriveActivity), never set by hand from a click.

export type Activity =
  | "idle"
  | "thinking"
  | "researching"
  | "drafting"
  | "waiting"
  | "sleeping"
  | "down"
  | "briefing"
  | "fetching"
  | "delivering";

export type Source = { kind: string; label: string };

export type ActivityInput = {
  waking: boolean;
  asleep: boolean; // outside the agent's hours, and not woken today
  reminder: "none" | "fetching" | "delivering";
  briefing: boolean; // the briefing is being rebuilt after waking
  answering: "none" | "thinking" | "researching"; // a message is being answered
  drafting: boolean; // a mail or invitation the conversation asked for is being written
  waitingHere: number; // approvals waiting in this conversation
  outlookDown: boolean;
};

/**
 *  sleeping ──wake──> briefing ──> idle
 *  idle ──send──> thinking | researching ──answer──> idle
 *                                         └─mail asked──> drafting ──> waiting ──approve/discard──> idle
 *  idle ──reminder due──> fetching ──> delivering ──done/snooze──> idle
 *  idle ──Outlook fails──> down ──retry ok──> idle
 * Work in progress wins over a reminder; a reminder wins over waiting and down.
 */
export function deriveActivity(i: ActivityInput): Activity {
  if (i.waking) return "sleeping";
  if (i.answering !== "none") return i.answering;
  if (i.drafting) return "drafting";
  if (i.briefing) return "briefing";
  if (i.reminder !== "none") return i.reminder;
  if (i.asleep) return "sleeping";
  if (i.waitingHere > 0) return "waiting";
  if (i.outlookDown) return "down";
  return "idle";
}
