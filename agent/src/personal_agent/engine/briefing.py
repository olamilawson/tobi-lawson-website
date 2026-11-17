"""The owner's day at a glance: what the home page shows down its side.

Built from data only, never from a model, so it costs nothing and is never made up:

    approvals   runs waiting for the owner's yes
    reminders   tasks whose due time has come (db.due_reminders: one rule)
    due         open tasks due today
    calendar    today's events             } each source has a state:
    inbox       unread mail since midnight }   ok | down (reason) | not_connected
    awake       false between the character's sleep and wake times

A source that fails says so in words: an empty list never stands in for a
failed read.
"""

from __future__ import annotations

from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo


def _clock(text: str) -> time:
    h, m = text.split(":")
    return time(int(h), int(m))


def day_window(settings, now: datetime | None = None) -> dict:
    """Local now, whether the agent is awake, and when it next wakes."""
    hours = settings.character.hours
    tz = ZoneInfo(hours.timezone)
    now = (now or datetime.now(tz)).astimezone(tz)
    wake, sleep = _clock(hours.wake), _clock(hours.sleep)
    t = now.time()
    awake = wake <= t < sleep if wake < sleep else (t >= wake or t < sleep)
    next_wake = datetime.combine(now.date(), wake, tz)
    if next_wake <= now:
        next_wake += timedelta(days=1)
    return {"now": now, "tz": tz, "awake": awake, "next_wake": next_wake}


def _source(read) -> dict:
    try:
        return {"state": "ok", "items": read()}
    except Exception as e:  # a GraphError carries words for the owner; anything else, its type
        return {"state": "down", "reason": str(e)[:300] or type(e).__name__, "items": []}


def build(engine, now: datetime | None = None) -> dict:
    settings, db, mail = engine.settings, engine.db, engine.harness.mail
    w = day_window(settings, now)
    local, tz = w["now"], w["tz"]
    stamp = local.strftime("%Y-%m-%dT%H:%M")
    midnight = datetime.combine(local.date(), time(0, 0), tz)
    today = local.strftime("%Y-%m-%d")

    if mail is None:
        calendar = inbox = {"state": "not_connected", "items": []}
    else:
        calendar = _source(lambda: mail.events_between(midnight, midnight + timedelta(days=1)))
        inbox = _source(lambda: mail.unread(midnight))

    open_tasks = [t for t in db.list_tasks() if t["status"] != "done"]
    return {
        "agent": settings.agent_name,
        "owner": settings.owner_name,
        "now": local.isoformat(),
        "timezone": settings.character.hours.timezone,
        "awake": w["awake"],
        "wake": settings.character.hours.wake,
        "sleep": settings.character.hours.sleep,
        "next_wake": w["next_wake"].isoformat(),
        "approvals": [
            {"run_id": a["run_id"], "kind": a["kind"], "chat_id": a["chat_id"],
             "to": a["content"].get("to"), "subject": a["content"].get("subject"), "start": a["content"].get("start")}
            for a in engine.queue()
        ],
        "reminders": [_task(t) for t in db.due_reminders(stamp)],
        "due": sorted((_task(t) for t in open_tasks if (t["due"] or "").startswith(today)), key=lambda t: t["due"]),
        "proposals": len(db.list_proposals(status="open")),
        "calendar": calendar,
        "inbox": inbox,
    }


def _task(t: dict) -> dict:
    return {k: t.get(k) for k in ("id", "title", "status", "due", "reminded_at", "snoozed_until", "chat_id", "workstream", "created_at")}
