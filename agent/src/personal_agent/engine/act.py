"""Acting for the owner: a reply by mail, a calendar invitation (PRD 1.5).

    mail:    draft (model) -> approval (editable) -> release send_mail -> done
    invite:  approval (editable note) -> release create_calendar_event -> done

Both start from a conversation (engine/follow.py), carry its chat_id so the
page shows them in that conversation, and stop for the owner before anything
leaves. The approval covers the exact content the tool will send, key for key:
the gateway refuses a release whose content hash differs from the approved one.
An edited body is approved, hashed and sent as the owner wrote it.
"""

from __future__ import annotations

from typing import TypedDict

from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

from personal_agent.engine.approval import make_approval_node
from personal_agent.gateway.tools import ApprovalLapsed, ApprovalRequired
from personal_agent.harness.budgets import BudgetTracker
from personal_agent.harness.context import build_context
from personal_agent.harness.contract import StepContract


class MailIn(BaseModel):
    to: str = Field(min_length=3)
    subject: str = ""
    instruction: str = Field(min_length=1)


class MailOut(BaseModel):
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1)


class ActState(TypedDict, total=False):
    run_id: str
    client: str
    inputs: dict
    usage: dict
    flags: list[str]
    subject: str
    body: str
    edited_body: str
    approval_error: str | None
    approved_hash: str
    released: dict
    fallback_used: bool
    error: str | None


def act_contracts() -> dict[str, StepContract]:
    return {
        "mail_draft": StepContract(
            node="mail_draft",
            tier="standard",
            allowed_tools=[],
            input_schema=MailIn,
            output_schema=MailOut,
            instruction=(
                "Write the email the owner asked for, to the recipient given, in the owner's voice and first "
                "person. Keep it as short as the instruction allows; no sign-off name, the mailbox adds it. "
                "Keep the given subject if there is one, otherwise write a plain one. Respond as a single JSON "
                "object with keys subject and body."
            ),
        ),
        "mail_send": StepContract(
            node="mail_send", tier="standard", allowed_tools=["send_mail"],
            input_schema=MailIn, output_schema=MailOut, instruction="",
        ),
        "invite_send": StepContract(
            node="invite_send", tier="standard", allowed_tools=["create_calendar_event"],
            input_schema=MailIn, output_schema=MailOut, instruction="",
        ),
    }


def _mail_payload(state: dict) -> dict:
    """The exact email: what the owner approves and what send_mail receives."""
    inputs = state.get("inputs") or {}
    payload = {"to": inputs["to"], "subject": state["subject"], "body": state["body"]}
    if inputs.get("in_reply_to"):
        payload["in_reply_to"] = inputs["in_reply_to"]
    return payload


def _invite_payload(state: dict) -> dict:
    """The exact event: what the owner approves and what create_calendar_event receives."""
    inputs = state.get("inputs") or {}
    return {"to": inputs["to"], "subject": inputs["subject"], "start": inputs["start"], "end": inputs["end"],
            "body": inputs.get("note") or ""}


def _release(h, tool: str, node: str, payload: dict, state: dict) -> dict:
    if state.get("edited_body") is not None:
        payload = {**payload, "body": state["edited_body"]}
    try:
        result = h.tools.call(state["run_id"], node, h.contracts[node].allowed_tools, tool, payload)
    except (ApprovalRequired, ApprovalLapsed) as e:
        return {"approval_error": str(e)}
    return {"released": result, "approval_error": None}


def _route(after: str):
    return lambda state: "approval" if state.get("approval_error") else after


def build_mail_graph(h):
    def draft(state: ActState) -> dict:
        inputs = state["inputs"] or {}
        tracker = BudgetTracker(h.settings.budgets)
        context, flags = build_context(
            h.role() + h.standing(state["client"]), "", [],
            [("what the owner said in the conversation", inputs.get("said", ""))] if inputs.get("said") else [],
            {"to": inputs.get("to"), "instruction": inputs.get("instruction"), "client": state["client"]},
        )
        runner = h.node_runner(tracker, state["run_id"])
        out = runner.run(
            h.contracts["mail_draft"],
            {"to": inputs.get("to", ""), "subject": inputs.get("subject", ""), "instruction": inputs.get("instruction", "")},
            context=context,
        )
        return {
            "subject": inputs.get("subject") or out["subject"], "body": out["body"],
            "flags": state.get("flags", []) + flags, "fallback_used": runner.fallback_used,
            "usage": {"tokens_in": tracker.tokens_in, "tokens_out": tracker.tokens_out, "cost_usd": tracker.cost_usd},
        }

    approval = make_approval_node(
        h.db, _mail_payload, about=lambda s: {"action": "send", "kind": "mail"}, editable=True,
    )

    def send(state: ActState) -> dict:
        return _release(h, "send_mail", "mail_send", _mail_payload(state), state)

    builder = StateGraph(ActState)
    builder.add_node("draft", draft)
    builder.add_node("approval", approval)
    builder.add_node("send", send)
    builder.add_edge(START, "draft")
    builder.add_edge("draft", "approval")
    builder.add_conditional_edges("approval", _route("send"), {"approval": "approval", "send": "send"})
    builder.add_conditional_edges("send", _route("end"), {"approval": "approval", "end": END})
    return builder


def build_invite_graph(h):
    approval = make_approval_node(
        h.db, _invite_payload, about=lambda s: {"action": "invite", "kind": "invite"}, editable=True,
    )

    def send(state: ActState) -> dict:
        return _release(h, "create_calendar_event", "invite_send", _invite_payload(state), state)

    builder = StateGraph(ActState)
    builder.add_node("approval", approval)
    builder.add_node("send", send)
    builder.add_edge(START, "approval")
    builder.add_conditional_edges("approval", _route("send"), {"approval": "approval", "send": "send"})
    builder.add_conditional_edges("send", _route("end"), {"approval": "approval", "end": END})
    return builder


def act_outputs(state: dict) -> dict | None:
    """What the page shows for the action: the content as it stands, and what happened to it."""
    inputs = state.get("inputs") or {}
    out = {"to": inputs.get("to"), "subject": state.get("subject") or inputs.get("subject")}
    body = state.get("edited_body") if state.get("edited_body") is not None else state.get("body", inputs.get("note"))
    if body is not None:
        out["body"] = body
    if inputs.get("start"):
        out["start"], out["end"] = inputs["start"], inputs.get("end")
    if state.get("released") is not None:
        out["released"] = state["released"]
    return out
