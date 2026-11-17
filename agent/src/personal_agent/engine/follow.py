"""Follow-through: what the owner's latest message asks for beyond the answer.

    think (answer) -> follow (model, cheap tier) -> END
    then, in Engine.work: apply() writes tasks, memory proposals, and starts a
    mail or invite run for each action (engine/act.py), which stops for approval.

The step reads only the owner's own message. It never invents an address or a
time: an action without a recipient, or an invitation without a start, is left
out. A failure here never fails the answer; the conversation simply gets no
follow-through for that message.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Literal
from zoneinfo import ZoneInfo

from pydantic import BaseModel, Field

from personal_agent import costs
from personal_agent.harness.budgets import BudgetTracker
from personal_agent.harness.context import build_context
from personal_agent.harness.contract import StepContract

MAX_TASKS, MAX_FACTS, MAX_ACTIONS = 3, 3, 2


class FollowIn(BaseModel):
    message: str = Field(min_length=1)
    now: str
    remembered: list[str] = []


class Task(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    due: str = ""  # YYYY-MM-DDTHH:MM, the owner's local time; empty: no time given


class Action(BaseModel):
    kind: Literal["mail", "invite"]
    to: str = ""
    subject: str = ""
    instruction: str = ""  # mail: what the email should say
    start: str = ""  # invite: YYYY-MM-DDTHH:MM local
    end: str = ""
    note: str = ""


class FollowOut(BaseModel):
    tasks: list[Task] = []
    facts: list[str] = []
    actions: list[Action] = []


def follow_contracts() -> dict[str, StepContract]:
    return {
        "follow": StepContract(
            node="follow",
            tier="cheap",
            allowed_tools=[],
            input_schema=FollowIn,
            output_schema=FollowOut,
            instruction=(
                "Read the owner's message and list only what it explicitly asks for, as a single JSON object "
                "with keys tasks, facts and actions. "
                "tasks: things the owner asks to be reminded of or to do, each {title, due}; due is "
                "YYYY-MM-DDTHH:MM in the owner's local time, worked out from the current time given, 09:00 when "
                "only a day is named, empty when no time is named. "
                "facts: lasting preferences or facts about the owner that the owner states (\"I prefer…\", "
                "\"I never…\"), written as one short sentence in the second person (\"You prefer…\"); leave out "
                "anything already remembered, and anything about other people. "
                "actions: an email the owner asks to send, {kind: \"mail\", to, subject, instruction}, or a "
                "meeting invitation, {kind: \"invite\", to, subject, start, end, note}. Use only an email address "
                "written in the message; with none, leave the action out. An invitation needs a start; end "
                "defaults to 30 minutes later. "
                "Empty lists are the usual answer. Never add anything the message does not ask for."
            ),
        )
    }


def local_now(settings) -> datetime:
    return datetime.now(ZoneInfo(settings.character.hours.timezone))


def _when(text: str, tz: ZoneInfo) -> datetime | None:
    try:
        moment = datetime.fromisoformat(text.strip())
    except (ValueError, AttributeError):
        return None
    return moment if moment.tzinfo else moment.replace(tzinfo=tz)


def run_step(h, state: dict) -> dict:
    """The graph node's work. Returns {"follow": FollowOut-dict} or {"follow": None}."""
    inputs = state.get("inputs") or {}
    message = (inputs.get("question") or "").strip()
    if not message:
        return {"follow": None}
    now = local_now(h.settings)
    remembered = [m["text"] for m in h.db.list_memory(state["client"]) if m["kind"] != "draft"][:40]
    tracker = BudgetTracker(h.settings.budgets)
    prior = state.get("usage") or {}
    tracker.add_usage(prior.get("tokens_in", 0), prior.get("tokens_out", 0), prior.get("cost_usd", 0.0))
    try:
        context, _ = build_context(
            h.role(), "", [], [],
            {"message": message, "now": now.strftime("%A %d %B %Y, %H:%M"), "timezone": h.settings.character.hours.timezone},
        )
        out = h.node_runner(tracker, state["run_id"]).run(
            h.contracts["follow"],
            {"message": message, "now": now.strftime("%Y-%m-%dT%H:%M"), "remembered": remembered},
            context=context,
        )
    except Exception as e:  # never fail the answer over its follow-through
        h.db.audit(state["run_id"], "follow_through_skipped", {"reason": f"{type(e).__name__}: {str(e)[:200]}"})
        return {"follow": None}
    return {
        "follow": out,
        "usage": {"tokens_in": tracker.tokens_in, "tokens_out": tracker.tokens_out, "cost_usd": tracker.cost_usd},
    }


def apply(engine, run: dict, follow: dict | None) -> dict:
    """Write what the follow-through found. Returns counts, for the audit log."""
    if not follow:
        return {}
    db, settings = engine.db, engine.settings
    tz = ZoneInfo(settings.character.hours.timezone)
    inputs = run["inputs"] or {}
    chat_id, space = inputs.get("chat_id"), run["client"]
    made = {"tasks": 0, "facts": 0, "actions": 0, "skipped": []}

    for task in (follow.get("tasks") or [])[:MAX_TASKS]:
        due = _when(task.get("due") or "", tz)
        db.create_task(workstream=space, title=task["title"].strip(), status="todo", owner="owner",
                       due=due.strftime("%Y-%m-%dT%H:%M") if due else None, chat_id=chat_id)
        made["tasks"] += 1

    for fact in (follow.get("facts") or [])[:MAX_FACTS]:
        if fact.strip():
            db.propose_memory(space, fact.strip(), chat_id, run["id"])
            made["facts"] += 1

    for action in (follow.get("actions") or [])[:MAX_ACTIONS]:
        to = (action.get("to") or "").strip()
        if "@" not in to:
            made["skipped"].append(f"{action.get('kind')}: no email address in the message")
            continue
        try:
            if action["kind"] == "mail":
                engine.start_run("mail", space, {
                    "to": to, "subject": action.get("subject") or "", "chat_id": chat_id,
                    "instruction": action.get("instruction") or inputs.get("question", ""),
                    "said": inputs.get("question", ""),
                })
            else:
                start = _when(action.get("start") or "", tz)
                if not start:
                    made["skipped"].append("invite: no start time in the message")
                    continue
                end = _when(action.get("end") or "", tz) or start + timedelta(minutes=30)
                engine.start_run("invite", space, {
                    "to": to, "subject": action.get("subject") or "Meeting", "chat_id": chat_id,
                    "start": start.isoformat(), "end": end.isoformat(), "note": action.get("note") or "",
                })
            made["actions"] += 1
        except costs.MonthlyCapReached as e:
            made["skipped"].append(str(e))
    db.audit(run["id"], "follow_through", made)
    return made
