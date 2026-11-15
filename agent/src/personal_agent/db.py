"""App state tables: runs, approvals, audit log, tool calls.

SQLAlchemy Core so the same code runs on SQLite (local tests) and Postgres
(VPS). The audit log is insert-only — nothing in this module ever updates or
deletes from it.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Float,
    Integer,
    MetaData,
    String,
    Table,
    create_engine,
    delete,
    func,
    insert,
    or_,
    select,
    update,
)
from sqlalchemy.types import JSON

metadata = MetaData()

runs = Table(
    "runs",
    metadata,
    Column("id", String, primary_key=True),
    Column("workflow", String, nullable=False),
    Column("client", String, nullable=False),
    Column("status", String, nullable=False, index=True),
    Column("inputs", JSON),
    Column("outputs", JSON),
    Column("error_reason", String),
    Column("skill_library_version", String),
    Column("tokens_in", Integer, default=0),
    Column("tokens_out", Integer, default=0),
    Column("cost_usd", Float, default=0.0),
    Column("fallback_used", Boolean, default=False),
    Column("flags", JSON, default=list),
    Column("created_at", String),
    Column("updated_at", String),
)

approvals = Table(
    "approvals",
    metadata,
    Column("id", String, primary_key=True),
    Column("run_id", String, nullable=False, index=True),
    Column("content_hash", String, nullable=False),
    Column("decision", String, nullable=False),  # approved | rejected | sent_back
    Column("comment", String),
    Column("decided_by", String, default="owner"),
    Column("lapsed", Boolean, default=False),
    Column("created_at", String),
)

audit_log = Table(
    "audit_log",
    metadata,
    Column("id", String, primary_key=True),
    Column("run_id", String, index=True),
    Column("action", String, nullable=False),
    Column("detail", JSON),
    Column("created_at", String),
)

tool_calls = Table(
    "tool_calls",
    metadata,
    Column("id", String, primary_key=True),
    Column("run_id", String, index=True),
    Column("node", String),
    Column("tool", String),
    Column("tool_class", String),
    Column("payload_hash", String),
    Column("idempotency_key", String, index=True),
    Column("outcome", String),  # executed | refused | awaiting_approval | replay | uncertain
    Column("detail", JSON),
    Column("created_at", String),
)


LEDGER_FIELDS = ("received_at", "sender", "organisation", "request", "amount", "route", "decision", "outcome")

# Approved mail held locally until Microsoft Graph is connected. Nothing in
# this table has been delivered to anyone.
outbox = Table(
    "outbox",
    metadata,
    Column("id", String, primary_key=True),
    Column("recipient", String, nullable=False),
    Column("subject", String),
    Column("body", String),
    Column("in_reply_to", String),
    Column("created_at", String),
)


# What the owner has set for a client. A client is its folder; this holds only
# the settings that are not files.
client_settings = Table(
    "client_settings",
    metadata,
    Column("name", String, primary_key=True),
    Column("retention_days", Integer),  # None: keep until the owner deletes
    Column("updated_at", String),
)


# Clients whose runs may only reach providers approved for confidential work.
# --- the owner's workspace: tasks, decisions, memory and the watchlist ---------------------
# These are the owner's own records. The agent reads workstream knowledge as
# context and writes none of them.
tasks = Table(
    "tasks",
    metadata,
    Column("id", String, primary_key=True),
    Column("workstream", String, nullable=False, index=True),
    Column("title", String, nullable=False),
    Column("detail", String),
    Column("status", String, nullable=False, index=True),  # todo | in_progress | awaiting_approval | done
    Column("risk", String),  # low | medium | high
    Column("owner", String),
    Column("due", String),  # the owner's local time, YYYY-MM-DDTHH:MM
    Column("decision", String),  # approved | changes | declined
    Column("created_at", String),
    Column("updated_at", String),
)


# Workstream knowledge (priority, brand rule, preference, lesson) and saved drafts.
memory_items = Table(
    "memory_items",
    metadata,
    Column("id", String, primary_key=True),
    Column("workstream", String, index=True),
    Column("kind", String, index=True),  # priority | brand_rule | preference | lesson | draft
    Column("title", String),
    Column("text", String),
    Column("created_at", String),
)


# Settings the owner changes on a screen, kept as one JSON value per key:
# her rules for requests, and the email templates she has approved to send on their own.
owner_settings = Table(
    "owner_settings",
    metadata,
    Column("key", String, primary_key=True),
    Column("value", JSON),
    Column("updated_at", String),
)

# A conversation on Think. Its turns are the think runs whose inputs carry its
# id; the workstream is fixed when it starts, as a run's client scope is.
chats = Table(
    "chats",
    metadata,
    Column("id", String, primary_key=True),
    Column("workstream", String, index=True),
    Column("created_at", String),
    Column("updated_at", String),
)

# A file the owner attached to a conversation. Only the text read from it is
# kept; the agent reads it as data on every later turn of that conversation.
chat_files = Table(
    "chat_files",
    metadata,
    Column("id", String, primary_key=True),
    Column("chat_id", String, index=True),
    Column("name", String),
    Column("kind", String),  # pdf | docx | text
    Column("size", Integer),  # bytes of the file as sent
    Column("text", String),
    Column("created_at", String),
)

# The owner's choice of model for a tier, made on the Settings screen. A row
# replaces that tier's line in config/route_table.yaml; no row leaves the file's.
model_routes = Table(
    "model_routes",
    metadata,
    Column("tier", String, primary_key=True),
    Column("primary", String, nullable=False),
    Column("fallback", String),
    Column("updated_at", String),
)

# A row means restricted; no row means not.
restricted_clients = Table(
    "restricted_clients",
    metadata,
    Column("name", String, primary_key=True),
    Column("since", String),
)

# The trace of a run (PRD: tracing in run tables). One row each time a graph
# node finishes, fails or stops to wait for the owner, in order.
run_steps = Table(
    "run_steps",
    metadata,
    Column("id", String, primary_key=True),
    Column("run_id", String, index=True),
    Column("seq", Integer),
    Column("node", String),
    Column("status", String),  # done | failed | waiting
    Column("output", JSON),  # what the node wrote to the run's state, long text shortened
    Column("error", String),
    Column("duration_ms", Integer),
    Column("created_at", String),
)

# One row per model call, including calls whose output was invalid and retried.
model_calls = Table(
    "model_calls",
    metadata,
    Column("id", String, primary_key=True),
    Column("run_id", String, index=True),
    Column("step_seq", Integer),  # the run step the call was made in
    Column("node", String),
    Column("attempt", Integer),
    Column("tier", String),
    Column("model", String),
    Column("fallback_used", Boolean),
    Column("prompt_version", String),  # hash of the node's instruction
    Column("tokens_in", Integer),
    Column("tokens_out", Integer),
    Column("cost_usd", Float),
    Column("outcome", String),  # ok | invalid output | provider error
    Column("error", String),
    Column("input", JSON),
    Column("output", JSON),
    Column("created_at", String),
)


# What the owner changed before approving: the draft and the approved version.
# The weekly learning review reads these; nothing else acts on them.
owner_edits = Table(
    "owner_edits",
    metadata,
    Column("id", String, primary_key=True),
    Column("run_id", String, index=True),
    Column("workflow", String, index=True),
    Column("stage", String),
    Column("before", String),
    Column("after", String),
    Column("created_at", String),
)


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _fine() -> str:
    """To the microsecond: conversations started in the same second still sort by which came last."""
    return datetime.now(timezone.utc).isoformat(timespec="microseconds")


def new_id() -> str:
    return uuid.uuid4().hex


class Database:
    def __init__(self, url: str):
        self.engine = create_engine(url)
        metadata.create_all(self.engine)

    # --- audit (append-only) -------------------------------------------------
    def audit(self, run_id: str | None, action: str, detail: dict | None = None) -> None:
        with self.engine.begin() as cx:
            cx.execute(
                insert(audit_log).values(
                    id=new_id(), run_id=run_id, action=action, detail=detail, created_at=now()
                )
            )

    def audited_since(self, action: str, since: str) -> bool:
        with self.engine.connect() as cx:
            return cx.execute(
                select(audit_log.c.id).where(audit_log.c.action == action, audit_log.c.created_at >= since).limit(1)
            ).first() is not None

    # --- runs ----------------------------------------------------------------
    def create_run(self, run_id: str, workflow: str, client: str, inputs: dict, library_version: str) -> None:
        with self.engine.begin() as cx:
            cx.execute(
                insert(runs).values(
                    id=run_id,
                    workflow=workflow,
                    client=client,
                    status="queued",
                    inputs=inputs,
                    skill_library_version=library_version,
                    tokens_in=0,
                    tokens_out=0,
                    cost_usd=0.0,
                    fallback_used=False,
                    flags=[],
                    created_at=now(),
                    updated_at=now(),
                )
            )

    def update_run(self, run_id: str, **fields) -> None:
        with self.engine.begin() as cx:
            cx.execute(update(runs).where(runs.c.id == run_id).values(**fields, updated_at=now()))

    def get_run(self, run_id: str) -> dict | None:
        with self.engine.connect() as cx:
            row = cx.execute(select(runs).where(runs.c.id == run_id)).mappings().first()
        return dict(row) if row else None

    def list_runs(self, status: str | None = None) -> list[dict]:
        stmt = select(runs).order_by(runs.c.created_at.desc())
        if status:
            stmt = stmt.where(runs.c.status == status)
        with self.engine.connect() as cx:
            return [dict(r) for r in cx.execute(stmt).mappings()]

    # --- approvals -----------------------------------------------------------
    def record_approval(self, run_id: str, content_hash: str, decision: str, comment: str | None,
                        decided_by: str = "owner") -> str:
        approval_id = new_id()
        with self.engine.begin() as cx:
            cx.execute(
                insert(approvals).values(
                    id=approval_id,
                    run_id=run_id,
                    content_hash=content_hash,
                    decision=decision,
                    comment=comment,
                    decided_by=decided_by,
                    lapsed=False,
                    created_at=now(),
                )
            )
        return approval_id

    def get_approval(self, approval_id: str) -> dict | None:
        with self.engine.connect() as cx:
            row = cx.execute(select(approvals).where(approvals.c.id == approval_id)).mappings().first()
        return dict(row) if row else None

    def lapse_approval(self, approval_id: str) -> None:
        with self.engine.begin() as cx:
            cx.execute(update(approvals).where(approvals.c.id == approval_id).values(lapsed=True))

    def latest_approval_for_hash(self, run_id: str, content_hash: str) -> dict | None:
        with self.engine.connect() as cx:
            row = (
                cx.execute(
                    select(approvals)
                    .where(
                        approvals.c.run_id == run_id,
                        approvals.c.content_hash == content_hash,
                        approvals.c.decision == "approved",
                        approvals.c.lapsed.is_(False),
                    )
                    .order_by(approvals.c.created_at.desc())
                )
                .mappings()
                .first()
            )
        return dict(row) if row else None

    # --- client settings, retention and deletion ---------------------------------
    def get_retention_days(self, client: str) -> int | None:
        with self.engine.connect() as cx:
            row = cx.execute(select(client_settings).where(client_settings.c.name == client)).mappings().first()
        return row["retention_days"] if row else None

    def set_retention_days(self, client: str, days: int | None) -> None:
        with self.engine.begin() as cx:
            cx.execute(delete(client_settings).where(client_settings.c.name == client))
            cx.execute(insert(client_settings).values(name=client, retention_days=days, updated_at=now()))

    # --- the owner's workspace -----------------------------------------------
    def _insert(self, table: Table, **fields) -> str:
        row_id = new_id()
        with self.engine.begin() as cx:
            cx.execute(insert(table).values(id=row_id, created_at=now(), **fields))
        return row_id

    def _rows(self, table: Table, **where) -> list[dict]:
        stmt = select(table).order_by(table.c.created_at.desc())
        for column, value in where.items():
            stmt = stmt.where(table.c[column] == value)
        with self.engine.connect() as cx:
            return [dict(r) for r in cx.execute(stmt).mappings()]

    def _remove(self, table: Table, row_id: str) -> None:
        with self.engine.begin() as cx:
            cx.execute(delete(table).where(table.c.id == row_id))

    def create_task(self, **fields) -> str:
        return self._insert(tasks, updated_at=now(), **fields)

    def update_task(self, task_id: str, **fields) -> None:
        with self.engine.begin() as cx:
            cx.execute(update(tasks).where(tasks.c.id == task_id).values(updated_at=now(), **fields))

    def get_task(self, task_id: str) -> dict | None:
        return next(iter(self._rows(tasks, id=task_id)), None)

    def list_tasks(self) -> list[dict]:
        return self._rows(tasks)

    def delete_task(self, task_id: str) -> None:
        self._remove(tasks, task_id)


    def add_memory(self, workstream: str, kind: str, title: str, text: str) -> str:
        return self._insert(memory_items, workstream=workstream, kind=kind, title=title, text=text)

    def list_memory(self, workstream: str | None = None) -> list[dict]:
        return self._rows(memory_items, **({"workstream": workstream} if workstream else {}))

    def delete_memory(self, item_id: str) -> None:
        self._remove(memory_items, item_id)


    # --- owner settings and request screening ------------------------------------
    def get_setting(self, key: str) -> dict | None:
        with self.engine.connect() as cx:
            row = cx.execute(select(owner_settings.c.value).where(owner_settings.c.key == key)).first()
        return row[0] if row else None

    def set_setting(self, key: str, value: dict) -> None:
        with self.engine.begin() as cx:
            cx.execute(delete(owner_settings).where(owner_settings.c.key == key))
            cx.execute(insert(owner_settings).values(key=key, value=value, updated_at=now()))


    def recent_audit(self, limit: int = 40) -> list[dict]:
        with self.engine.connect() as cx:
            return [dict(r) for r in cx.execute(
                select(audit_log).order_by(audit_log.c.created_at.desc()).limit(limit)
            ).mappings()]

    # --- conversations on Think ---------------------------------------------------
    def create_chat(self, workstream: str) -> str:
        chat_id = new_id()
        with self.engine.begin() as cx:
            cx.execute(insert(chats).values(id=chat_id, workstream=workstream, created_at=_fine(), updated_at=_fine()))
        return chat_id

    def get_chat(self, chat_id: str) -> dict | None:
        with self.engine.connect() as cx:
            row = cx.execute(select(chats).where(chats.c.id == chat_id)).mappings().first()
        return dict(row) if row else None

    def list_chats(self) -> list[dict]:
        with self.engine.connect() as cx:
            return [dict(r) for r in cx.execute(select(chats).order_by(chats.c.updated_at.desc())).mappings()]

    def delete_chat(self, chat_id: str) -> None:
        with self.engine.begin() as cx:
            cx.execute(delete(chat_files).where(chat_files.c.chat_id == chat_id))
            cx.execute(delete(chats).where(chats.c.id == chat_id))

    def adopt_into_chat(self, run: dict) -> str:
        """A question asked before conversations existed becomes a conversation of one turn.
        The run's times are left as they were, so retention still counts from its last activity."""
        chat_id = new_id()
        with self.engine.begin() as cx:
            cx.execute(insert(chats).values(id=chat_id, workstream=run["client"], created_at=run["created_at"],
                                            updated_at=run["updated_at"]))
            cx.execute(update(runs).where(runs.c.id == run["id"]).values(inputs={**run["inputs"], "chat_id": chat_id}))
        return chat_id

    def touch_chat(self, chat_id: str) -> None:
        with self.engine.begin() as cx:
            cx.execute(update(chats).where(chats.c.id == chat_id).values(updated_at=_fine()))

    def add_chat_file(self, chat_id: str, name: str, kind: str, size: int, text: str) -> str:
        file_id = new_id()
        with self.engine.begin() as cx:
            cx.execute(insert(chat_files).values(id=file_id, chat_id=chat_id, name=name, kind=kind, size=size,
                                                 text=text, created_at=now()))
        return file_id

    def list_chat_files(self, chat_id: str) -> list[dict]:
        with self.engine.connect() as cx:
            return [dict(r) for r in cx.execute(
                select(chat_files).where(chat_files.c.chat_id == chat_id).order_by(chat_files.c.created_at)
            ).mappings()]

    def delete_chats(self, workstream: str, older_than: str | None = None) -> int:
        """Remove a workstream's conversations and their files: all of them, or those idle since older_than."""
        stmt = select(chats.c.id).where(chats.c.workstream == workstream)
        if older_than:
            stmt = stmt.where(chats.c.updated_at < older_than)
        with self.engine.begin() as cx:
            ids = [r[0] for r in cx.execute(stmt)]
            if ids:
                cx.execute(delete(chat_files).where(chat_files.c.chat_id.in_(ids)))
                cx.execute(delete(chats).where(chats.c.id.in_(ids)))
        return len(ids)


    def model_routes(self) -> dict[str, dict]:
        with self.engine.connect() as cx:
            return {
                r["tier"]: {"primary": r["primary"], "fallback": r["fallback"]}
                for r in cx.execute(select(model_routes)).mappings()
            }

    def set_model_route(self, tier: str, primary: str, fallback: str | None) -> None:
        with self.engine.begin() as cx:
            cx.execute(delete(model_routes).where(model_routes.c.tier == tier))
            cx.execute(insert(model_routes).values(tier=tier, primary=primary, fallback=fallback, updated_at=now()))

    def is_restricted(self, client: str) -> bool:
        with self.engine.connect() as cx:
            return cx.execute(
                select(restricted_clients.c.name).where(restricted_clients.c.name == client)
            ).first() is not None

    def set_restricted(self, client: str, restricted: bool) -> None:
        with self.engine.begin() as cx:
            cx.execute(delete(restricted_clients).where(restricted_clients.c.name == client))
            if restricted:
                cx.execute(insert(restricted_clients).values(name=client, since=now()))

    def restricted_client_names(self) -> set[str]:
        with self.engine.connect() as cx:
            return {row[0] for row in cx.execute(select(restricted_clients.c.name))}

    def list_runs_for_client(self, client: str) -> list[dict]:
        with self.engine.connect() as cx:
            return [dict(r) for r in cx.execute(select(runs).where(runs.c.client == client)).mappings()]


    # --- trace: run steps and model calls ------------------------------------------
    def _next_seq(self, cx, run_id: str) -> int:
        return cx.execute(
            select(func.count()).select_from(run_steps).where(run_steps.c.run_id == run_id)
        ).scalar_one() + 1

    def record_step(self, run_id: str, node: str, status: str, output: dict | None,
                    duration_ms: int | None, error: str | None = None) -> None:
        with self.engine.begin() as cx:
            cx.execute(
                insert(run_steps).values(
                    id=new_id(), run_id=run_id, seq=self._next_seq(cx, run_id), node=node, status=status,
                    output=output, error=error, duration_ms=duration_ms, created_at=now(),
                )
            )

    def record_model_call(self, run_id: str, entry: dict) -> None:
        with self.engine.begin() as cx:
            # A call belongs to the step now running: the one after the last recorded.
            cx.execute(
                insert(model_calls).values(
                    id=new_id(), run_id=run_id, step_seq=self._next_seq(cx, run_id), created_at=now(), **entry
                )
            )

    def list_steps(self, run_id: str) -> list[dict]:
        with self.engine.connect() as cx:
            return [dict(r) for r in cx.execute(
                select(run_steps).where(run_steps.c.run_id == run_id).order_by(run_steps.c.seq)
            ).mappings()]

    def list_model_calls(self, run_id: str) -> list[dict]:
        with self.engine.connect() as cx:
            return [dict(r) for r in cx.execute(
                select(model_calls).where(model_calls.c.run_id == run_id)
                .order_by(model_calls.c.step_seq, model_calls.c.created_at, model_calls.c.attempt)
            ).mappings()]

    def list_tool_calls(self, run_id: str) -> list[dict]:
        with self.engine.connect() as cx:
            return [dict(r) for r in cx.execute(
                select(tool_calls).where(tool_calls.c.run_id == run_id).order_by(tool_calls.c.created_at)
            ).mappings()]

    # --- owner edits (for the learning loop) -------------------------------------
    def record_owner_edit(self, run_id: str, workflow: str, stage: str | None, before: str, after: str) -> None:
        with self.engine.begin() as cx:
            cx.execute(
                insert(owner_edits).values(
                    id=new_id(), run_id=run_id, workflow=workflow, stage=stage,
                    before=before, after=after, created_at=now(),
                )
            )

    def list_owner_edits(self, run_id: str | None = None) -> list[dict]:
        stmt = select(owner_edits).order_by(owner_edits.c.created_at)
        if run_id:
            stmt = stmt.where(owner_edits.c.run_id == run_id)
        with self.engine.connect() as cx:
            return [dict(r) for r in cx.execute(stmt).mappings()]

    def approvals_between(self, since: str, until: str) -> list[dict]:
        """Every owner decision in the period, with its run's workflow and client."""
        stmt = (
            select(approvals, runs.c.workflow, runs.c.client)
            .join(runs, runs.c.id == approvals.c.run_id)
            .where(approvals.c.created_at >= since, approvals.c.created_at < until)
            .order_by(approvals.c.created_at)
        )
        with self.engine.connect() as cx:
            return [dict(r) for r in cx.execute(stmt).mappings()]

    def owner_edits_between(self, since: str, until: str) -> list[dict]:
        stmt = (
            select(owner_edits)
            .where(owner_edits.c.created_at >= since, owner_edits.c.created_at < until)
            .order_by(owner_edits.c.created_at)
        )
        with self.engine.connect() as cx:
            return [dict(r) for r in cx.execute(stmt).mappings()]

    def runs_between(self, since: str, until: str) -> list[dict]:
        stmt = select(runs).where(runs.c.created_at >= since, runs.c.created_at < until)
        with self.engine.connect() as cx:
            return [dict(r) for r in cx.execute(stmt).mappings()]


    def find_run_by_message(self, workflow: str, message_id: str) -> dict | None:
        """The run already started for a mail, so a repeated delivery starts nothing."""
        for run in self.list_runs():
            if run["workflow"] == workflow and (run["inputs"] or {}).get("message_id") == message_id:
                return run
        return None

    # --- outbox (mail approved but not delivered) --------------------------------
    def add_to_outbox(self, recipient: str, subject: str, body: str, in_reply_to: str | None) -> str:
        outbox_id = new_id()
        with self.engine.begin() as cx:
            cx.execute(
                insert(outbox).values(
                    id=outbox_id, recipient=recipient, subject=subject, body=body,
                    in_reply_to=in_reply_to, created_at=now(),
                )
            )
        return outbox_id

    def list_outbox(self) -> list[dict]:
        with self.engine.connect() as cx:
            return [dict(r) for r in cx.execute(select(outbox).order_by(outbox.c.created_at.desc())).mappings()]

    # --- tool calls ------------------------------------------------------------
    def record_tool_call(
        self, run_id: str, node: str, tool: str, tool_class: str, payload_hash: str,
        idempotency_key: str | None, outcome: str, detail: dict | None
    ) -> None:
        with self.engine.begin() as cx:
            cx.execute(
                insert(tool_calls).values(
                    id=new_id(), run_id=run_id, node=node, tool=tool, tool_class=tool_class,
                    payload_hash=payload_hash, idempotency_key=idempotency_key,
                    outcome=outcome, detail=detail, created_at=now(),
                )
            )

    def find_tool_call(self, idempotency_key: str) -> dict | None:
        with self.engine.connect() as cx:
            row = cx.execute(
                select(tool_calls).where(tool_calls.c.idempotency_key == idempotency_key)
            ).mappings().first()
        return dict(row) if row else None

    def forget_client_settings(self, client: str) -> None:
        """A deleted space's conversations, tasks and notes go with it."""
        self.delete_chats(client)
        with self.engine.begin() as cx:
            for table in (tasks, memory_items):
                cx.execute(delete(table).where(table.c.workstream == client))
            cx.execute(delete(client_settings).where(client_settings.c.name == client))
            cx.execute(delete(restricted_clients).where(restricted_clients.c.name == client))

    def delete_run_payloads(self, run_id: str, marker: dict) -> None:
        """Remove what a run held of its space's material, everywhere it is kept.

        The run row stays, with its workflow, space, status, times, tokens and
        cost, so cost history still adds up. The audit log is append-only and is
        not touched.
        """
        with self.engine.begin() as cx:
            # An approved message held for sending is found through its tool call.
            held = [
                (row["detail"] or {}).get("outbox_id")
                for row in cx.execute(select(tool_calls.c.detail).where(tool_calls.c.run_id == run_id)).mappings()
                if isinstance(row["detail"], dict)
            ]
            for outbox_id in filter(None, held):
                cx.execute(delete(outbox).where(outbox.c.id == outbox_id))
            cx.execute(
                update(runs).where(runs.c.id == run_id)
                .values(inputs=None, outputs=marker, error_reason=None, flags=[], updated_at=now())
            )
            cx.execute(update(run_steps).where(run_steps.c.run_id == run_id).values(output=None, error=None))
            cx.execute(
                update(model_calls).where(model_calls.c.run_id == run_id).values(input=None, output=None, error=None)
            )
            cx.execute(update(tool_calls).where(tool_calls.c.run_id == run_id).values(detail=None))
            cx.execute(update(approvals).where(approvals.c.run_id == run_id).values(comment=None))
            cx.execute(delete(owner_edits).where(owner_edits.c.run_id == run_id))
