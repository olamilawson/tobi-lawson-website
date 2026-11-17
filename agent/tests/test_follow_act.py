"""Follow-through from a conversation: tasks, memory proposals, and mail or an
invitation that stops for the owner and sends exactly what the owner approved."""

from __future__ import annotations

from datetime import datetime

from personal_agent.db import Database
from personal_agent.engine.runner import Engine
from personal_agent.harness.models import RecordedGateway

ANSWER = {"answer": "Done.", "caveats": []}


class FakeCalendar:
    def __init__(self):
        self.events = []

    def create_event(self, subject, start, end, to, note, transaction_id=None, online=False):
        self.events.append({"subject": subject, "start": start, "end": end, "to": to, "note": note})
        return {"created": True, "id": "evt-1"}


def _engine(settings, responses, mail=None) -> Engine:
    return Engine(settings, Database(settings.database_url), gateway=RecordedGateway(responses), mail=mail)


def _ask(engine, question):
    chat = engine.db.create_chat("Personal")
    run_id = engine.start_run("think", "Personal", {"question": question, "chat_id": chat})
    return chat, run_id


def test_a_message_with_nothing_to_do_makes_nothing(settings):
    engine = _engine(settings, {"think": [ANSWER], "follow": [{}]})
    chat, run_id = _ask(engine, "What is runway?")
    assert engine.db.get_run(run_id)["status"] == "done"
    assert engine.db.tasks_for_chat(chat) == [] and engine.db.list_proposals() == [] and engine.queue() == []


def test_follow_through_failing_never_fails_the_answer(settings):
    engine = _engine(settings, {"think": [ANSWER]})  # no follow response: the step errors
    _, run_id = _ask(engine, "Remind me to call Ada tomorrow.")
    run = engine.db.get_run(run_id)
    assert run["status"] == "done" and run["outputs"]["answer"] == "Done."


def test_tasks_and_facts_become_tasks_and_proposals(settings):
    follow = {"tasks": [{"title": "Call Ada", "due": "2026-11-16T09:00"}], "facts": ["You prefer morning calls."]}
    engine = _engine(settings, {"think": [ANSWER], "follow": [follow]})
    chat, run_id = _ask(engine, "Remind me to call Ada tomorrow. I prefer morning calls.")
    [task] = engine.db.tasks_for_chat(chat)
    assert task["title"] == "Call Ada" and task["due"] == "2026-11-16T09:00" and task["status"] == "todo"
    [proposal] = engine.db.list_proposals(chat_id=chat)
    assert proposal["status"] == "open" and proposal["text"] == "You prefer morning calls."
    # Decided once: a second decision changes nothing.
    assert engine.db.decide_proposal(proposal["id"], "dismissed") is True
    assert engine.db.decide_proposal(proposal["id"], "kept") is False
    assert engine.db.get_proposal(proposal["id"])["status"] == "dismissed"


def test_an_action_without_an_address_is_left_out(settings):
    follow = {"actions": [{"kind": "mail", "to": "Ada", "instruction": "Say thanks"}]}
    engine = _engine(settings, {"think": [ANSWER], "follow": [follow]})
    _ask(engine, "Email Ada to say thanks.")
    assert engine.queue() == []


def test_mail_waits_for_approval_and_sends_the_edited_body(settings):
    follow = {"actions": [{"kind": "mail", "to": "ada@example.com", "subject": "", "instruction": "Thank her"}]}
    draft = {"subject": "Thank you", "body": "Thank you for yesterday."}
    engine = _engine(settings, {"think": [ANSWER], "follow": [follow], "mail_draft": [draft]})
    chat, _ = _ask(engine, "Email ada@example.com to thank her for yesterday.")
    [item] = engine.queue()
    assert item["kind"] == "mail" and item["chat_id"] == chat and item["editable"] is True
    assert item["content"] == {"to": "ada@example.com", "subject": "Thank you", "body": "Thank you for yesterday."}

    done = engine.approve(item["run_id"], "approved", None, edited_body="Thanks for yesterday, Ada.")
    assert done["status"] == "done", done.get("error_reason")
    [held] = engine.db.list_outbox()  # no mailbox connected: held, not sent
    assert held["body"] == "Thanks for yesterday, Ada." and held["recipient"] == "ada@example.com"
    assert done["outputs"]["body"] == "Thanks for yesterday, Ada."
    assert engine.queue() == []


def test_invite_waits_for_approval_and_creates_the_event(settings):
    follow = {"actions": [{"kind": "invite", "to": "ada@example.com", "subject": "Catch-up",
                           "start": "2026-11-17T10:00", "end": "", "note": "Quick catch-up"}]}
    calendar = FakeCalendar()
    engine = _engine(settings, {"think": [ANSWER], "follow": [follow]}, mail=calendar)
    _ask(engine, "Invite ada@example.com to a catch-up Tuesday at 10.")
    [item] = engine.queue()
    assert item["kind"] == "invite" and item["content"]["start"].startswith("2026-11-17T10:00")
    assert item["content"]["end"].startswith("2026-11-17T10:30")
    done = engine.approve(item["run_id"], "approved", None)
    assert done["status"] == "done", done.get("error_reason")
    [event] = calendar.events
    assert event["to"] == "ada@example.com" and event["note"] == "Quick catch-up"
    assert event["start"] == datetime.fromisoformat(item["content"]["start"])


def test_a_reminder_fires_once_until_snoozed(settings):
    db = Database(settings.database_url)
    task_id = db.create_task(workstream="Personal", title="Call Ada", status="todo", owner="owner",
                             due="2026-11-16T09:00", chat_id=None)
    assert db.mark_reminded(task_id, "2026-11-16T09:01") is True
    assert db.mark_reminded(task_id, "2026-11-16T09:02") is False
    db.update_task(task_id, snoozed_until="2026-11-16T10:00")
    assert db.mark_reminded(task_id, "2026-11-16T09:30") is False
    assert db.mark_reminded(task_id, "2026-11-16T10:00") is True
