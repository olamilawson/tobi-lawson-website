"""The agent's JSON API. No pages: the front end is designed separately and talks to this.

Run it:   uvicorn personal_agent.api.app:app --port 8200
On the server nginx serves it at https://tobilawson.com/api/agent/ (deploy/nginx-agent.conf),
so the routes below appear under that prefix to a browser.

Sign-in: with the owner's email, password hash and session secret set
(python -m personal_agent.auth), every route but /health and /session needs the
session cookie. With none set, a developer's machine serves open and a server
(PERSONAL_AGENT_REQUIRE_LOGIN=1) refuses every request.

State machines, readable by a front end or another agent:

  a conversation   GET /chats/{id}/state -> {state: ready | waiting, last_turn: {id, status}}
                   ready --POST message--> waiting --answer in or failed--> ready
                   one answer at a time: a message to a waiting conversation gets 409.
  a run            queued -> running -> waiting_for_approval | waiting_for_input -> running
                   -> done | failed | cancelled   (engine/runner.py)
  an approval      GET /approvals lists what waits; POST /runs/{id}/approval decides it.
                   A release (mail, a calendar invitation) happens only after an approval
                   whose hash matches the exact content (gateway/tools.py).
  a task           todo -> done (PATCH status); deleting removes it.
  a reminder       due -> delivered (POST /tasks/{id}/remind, once) -> due again only
                   after a snooze runs out (PATCH snooze_minutes). db.due_reminders holds the rule.
  a memory         open -> kept | dismissed (POST /memory/proposals/{id}), once; a second
  proposal         decision gets 409. Keeping writes the memory note with its conversation.
  the day          GET /briefing: approvals, reminders, tasks due, and calendar and inbox,
                   each ok | down (with the reason) | not_connected (engine/briefing.py).
"""

from __future__ import annotations

from datetime import datetime, timedelta
from urllib.parse import urlsplit

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from personal_agent import auth, connectors, costs, retention
from personal_agent.config import Settings, load_settings
from personal_agent.db import Database
from personal_agent.engine import briefing, think
from personal_agent.engine.runner import Engine
from personal_agent.harness.models import ModelGateway

DEFAULT_SPACE = "Personal"
WORKING = ("queued", "running")


class SignIn(BaseModel):
    email: str
    password: str
    code: str = ""


class Decision(BaseModel):
    decision: str  # approved | rejected | sent_back
    comment: str | None = None
    edited_body: str | None = None


class NewRun(BaseModel):
    workflow: str
    space: str | None = None
    client: str | None = None  # the engine's own word for a space; either is accepted
    inputs: dict = {}


class Answers(BaseModel):
    answers: str


class Note(BaseModel):
    space: str = DEFAULT_SPACE
    kind: str = "note"
    title: str = ""
    text: str


class NewTask(BaseModel):
    title: str
    due: str | None = None  # YYYY-MM-DDTHH:MM, the owner's local time
    space: str = DEFAULT_SPACE


class TaskChange(BaseModel):
    title: str | None = None
    due: str | None = None
    status: str | None = None  # todo | done
    snooze_minutes: int | None = None


class ProposalDecision(BaseModel):
    decision: str  # keep | dismiss
    text: str | None = None  # the owner's wording, when they changed it before keeping


class Space(BaseModel):
    name: str
    restricted: bool = False
    retention_days: int | None = None


def create_app(settings: Settings | None = None, gateway: ModelGateway | None = None, mail=None) -> FastAPI:
    settings = settings or load_settings()
    db = Database(settings.database_url)
    engine = Engine(settings, db, gateway=gateway, mail=mail)
    engine.harness.clients.ensure(DEFAULT_SPACE)
    app = FastAPI(title=f"{settings.agent_name} API", version="0.1.0")
    app.state.engine = engine

    guard = (
        auth.LoginGuard(settings.owner_email, settings.owner_password_hash, settings.session_secret,
                        totp_secret=settings.totp_secret, session_hours=settings.session_hours)
        if settings.owner_email and settings.owner_password_hash and settings.session_secret else None
    )

    @app.middleware("http")
    async def require_session(request: Request, call_next):
        if request.url.path in ("/health", "/session"):
            return await call_next(request)
        if guard is None:
            if settings.require_login:
                return JSONResponse({"detail": "sign-in is not set up on this server: run python -m personal_agent.auth"},
                                    status_code=503)
            return await call_next(request)
        if not guard.valid_session(request.cookies.get(auth.SESSION_COOKIE)):
            return JSONResponse({"detail": "sign in first"}, status_code=401)
        # A change must come from a page on this site, never from another site holding the cookie.
        origin = request.headers.get("origin")
        if request.method not in ("GET", "HEAD", "OPTIONS") and origin and urlsplit(origin).netloc != request.headers.get("host"):
            return JSONResponse({"detail": "this request came from another site, so the agent refused it"}, status_code=403)
        return await call_next(request)

    # --- health and sign-in ------------------------------------------------------------
    @app.get("/health")
    def health() -> dict:
        return {"ok": True, "agent": settings.agent_name, "service": "personal-agent"}

    @app.get("/session")
    def session(request: Request) -> dict:
        signed_in = guard is None or guard.valid_session(request.cookies.get(auth.SESSION_COOKIE))
        return {"signed_in": signed_in, "login_required": guard is not None, "code_required": bool(guard and guard.totp_secret)}

    @app.post("/session")
    def sign_in(body: SignIn):
        if guard is None:
            return {"signed_in": True, "login_required": False}
        if guard.locked():
            raise HTTPException(429, "five failed attempts locked sign-in; try again in 15 minutes")
        if not guard.check(body.email, body.password, body.code):
            db.audit(None, "login_failed", {"locked": guard.locked()})
            raise HTTPException(401, "the email, password or code did not match")
        db.audit(None, "login_succeeded", None)
        response = JSONResponse({"signed_in": True})
        response.set_cookie(auth.SESSION_COOKIE, guard.new_session(), max_age=settings.session_hours * 3600,
                            httponly=True, samesite="lax", secure=settings.require_login, path="/")
        return response

    @app.delete("/session")
    def sign_out():
        response = JSONResponse({"signed_in": False})
        response.delete_cookie(auth.SESSION_COOKIE, path="/")
        return response

    @app.get("/me")
    def me() -> dict:
        return {
            "agent_name": settings.agent_name, "owner_name": settings.owner_name,
            "character": {"name": settings.character.name, "about": settings.character.about,
                          "hours": settings.character.hours.model_dump()},
            "models": {tier: route.primary for tier, route in settings.route_table.items()},
            "mailbox_connected": engine.harness.mail is not None,
            "connectors": connectors.status(),
            "spend": costs.current_cap(db, settings),
        }

    # --- conversations -----------------------------------------------------------------
    def _turn(r: dict) -> dict:
        inputs, out = r["inputs"] or {}, r["outputs"] or {}
        return {
            "run_id": r["id"], "status": r["status"], "created_at": r["created_at"],
            "message": inputs.get("question"), "files": inputs.get("files") or [],
            "mode": inputs.get("mode"), "depth": inputs.get("depth"), "web": bool(inputs.get("web")),
            "answer": out.get("answer"), "caveats": out.get("caveats", []), "sources": out.get("sources", []),
            "error": r["error_reason"] if r["status"] == "failed" else None, "cost_usd": r["cost_usd"],
            "forgotten": inputs.get("question") is None,
        }

    def _actions(chat_id: str) -> list[dict]:
        """Mail and invitations the conversation asked for (engine/act.py), oldest first."""
        out = []
        for r in sorted((r for r in db.list_runs() if r["workflow"] in ("mail", "invite")
                         and (r["inputs"] or {}).get("chat_id") == chat_id), key=lambda r: r["created_at"]):
            inputs, outputs = r["inputs"] or {}, r["outputs"] or {}
            content = dict(outputs)
            pending = None
            if r["status"] == "waiting_for_approval":
                try:
                    pending = engine.pending_approval(r["id"])
                    content = dict(pending["content"])
                except ValueError:
                    pass
            released = outputs.get("released") or {}
            out.append({
                "run_id": r["id"], "kind": r["workflow"], "status": r["status"], "created_at": r["created_at"],
                "to": content.get("to") or inputs.get("to"), "subject": content.get("subject") or inputs.get("subject"),
                "body": content.get("body"), "start": content.get("start") or inputs.get("start"),
                "end": content.get("end") or inputs.get("end"),
                "editable": bool(pending and pending.get("editable")), "approval_error": pending and pending.get("error"),
                # Sent through the mailbox, or held in the local outbox because none is connected.
                "held": r["status"] == "done" and released.get("sent") is False,
                "error": r["error_reason"] if r["status"] in ("failed", "cancelled") else None,
            })
        return out

    def _state(chat_id: str) -> dict:
        chat_turns = think.turns(db, chat_id)
        last = chat_turns[-1] if chat_turns else None
        # Busy while an answer is being written, or a mail it asked for is being drafted.
        drafting = any(r["status"] in WORKING for r in db.list_runs() if r["workflow"] in ("mail", "invite")
                       and (r["inputs"] or {}).get("chat_id") == chat_id)
        busy = bool(last and last["status"] in WORKING) or drafting
        return {"chat": chat_id, "state": "waiting" if busy else "ready",
                "turns": len(chat_turns), "last_turn": {"id": last["id"], "status": last["status"]} if last else None}

    def _title(chat_turns: list[dict]) -> str:
        first = next((str(t["inputs"]["question"]) for t in chat_turns if (t["inputs"] or {}).get("question")), "")
        first = " ".join(first.split())
        return (first[:60] + "…" if len(first) > 60 else first) or "Conversation"

    async def _send(request: Request, background: BackgroundTasks, chat: dict | None) -> dict:
        """One message: checked, its files read, its run started. Raises HTTPException with the reason."""
        form = await request.form()
        message = str(form.get("message") or "").strip()
        if not message:
            raise HTTPException(422, "the message is empty")
        if chat:
            space = chat["workstream"]  # fixed for the conversation, as a run's scope is
            if _state(chat["id"])["state"] == "waiting":
                raise HTTPException(409, "the agent is still answering this conversation")
        else:
            space = str(form.get("space") or "").strip() or DEFAULT_SPACE
            if space not in engine.harness.clients.list_clients():
                raise HTTPException(422, f"no space named {space!r}")
        uploads = [u for u in form.getlist("files") if getattr(u, "filename", "")]
        if len(uploads) > think.MAX_FILES_PER_MESSAGE:
            raise HTTPException(422, f"attach up to {think.MAX_FILES_PER_MESSAGE} files to one message")
        read = []
        for upload in uploads:
            data = await upload.read()
            try:
                kind, text = think.read_attachment(upload.filename, data)
            except think.Unreadable as e:
                raise HTTPException(422, f"nothing was sent: {e}")
            read.append((upload.filename, kind, len(data), text))
        depth, mode = str(form.get("depth") or ""), str(form.get("mode") or "")
        new_chat = chat is None
        chat_id = chat["id"] if chat else db.create_chat(space)
        inputs = {
            "question": message[:8000], "material": str(form.get("material") or "").replace("\r\n", "\n")[:100_000],
            "depth": depth if depth in think.DEPTHS else "considered", "mode": mode if mode in think.MODES else "ask",
            "web": str(form.get("web") or "").lower() in ("1", "true", "on", "yes"),
            "chat_id": chat_id, "files": [name for name, *_ in read],
        }
        try:
            run_id = engine.start_run("think", space, inputs, work=False)
        except costs.MonthlyCapReached as e:
            if new_chat:
                db.delete_chat(chat_id)
            raise HTTPException(402, str(e))
        for name, kind, size, text in read:
            db.add_chat_file(chat_id, name, kind, size, text)
        db.touch_chat(chat_id)
        background.add_task(engine.work, run_id)
        return {"chat": chat_id, "run_id": run_id, "state": "waiting"}

    @app.get("/chats")
    def chats() -> list[dict]:
        out = []
        for ch in db.list_chats():
            chat_turns = think.turns(db, ch["id"])
            if chat_turns:
                out.append({"id": ch["id"], "space": ch["workstream"], "title": _title(chat_turns),
                            "updated_at": ch["updated_at"], **{k: v for k, v in _state(ch["id"]).items() if k != "chat"}})
        return out

    @app.post("/chats", status_code=202)
    async def new_chat(request: Request, background: BackgroundTasks) -> dict:
        """multipart/form-data: message, files (up to 5), space, mode, depth, web, material."""
        return await _send(request, background, None)

    @app.get("/chats/{chat_id}")
    def chat(chat_id: str) -> dict:
        ch = db.get_chat(chat_id)
        if not ch:
            raise HTTPException(404, "no such conversation")
        chat_turns = think.turns(db, chat_id)
        return {"id": chat_id, "space": ch["workstream"], "title": _title(chat_turns),
                "files": [{"name": f["name"], "kind": f["kind"], "size": f["size"], "added_at": f["created_at"]}
                          for f in db.list_chat_files(chat_id)],
                "turns": [_turn(r) for r in chat_turns],
                "actions": _actions(chat_id),
                "tasks": [briefing._task(t) for t in db.tasks_for_chat(chat_id)],
                "proposals": [_proposal(p) for p in db.list_proposals(chat_id=chat_id)],
                **{k: v for k, v in _state(chat_id).items() if k not in ("chat", "turns")}}

    @app.post("/chats/{chat_id}/messages", status_code=202)
    async def follow_up(chat_id: str, request: Request, background: BackgroundTasks) -> dict:
        ch = db.get_chat(chat_id)
        if not ch:
            raise HTTPException(404, "no such conversation")
        return await _send(request, background, ch)

    @app.get("/chats/{chat_id}/state")
    def chat_state(chat_id: str) -> dict:
        if not db.get_chat(chat_id):
            raise HTTPException(404, "no such conversation")
        return _state(chat_id)

    # --- approvals and questions ---------------------------------------------------------
    @app.get("/approvals")
    def approvals() -> dict:
        return {"approvals": engine.queue(), "questions": engine.input_requests()}

    @app.post("/runs/{run_id}/approval")
    def decide(run_id: str, body: Decision) -> dict:
        if body.decision not in ("approved", "rejected", "sent_back"):
            raise HTTPException(422, "decision is approved, rejected or sent_back")
        try:
            return engine.approve(run_id, body.decision, body.comment, body.edited_body)
        except KeyError:
            raise HTTPException(404, "run not found")
        except ValueError as e:
            raise HTTPException(409, str(e))

    @app.post("/runs/{run_id}/input")
    def answer(run_id: str, body: Answers) -> dict:
        try:
            return engine.provide_input(run_id, body.answers)
        except KeyError:
            raise HTTPException(404, "run not found")
        except ValueError as e:
            raise HTTPException(409, str(e))

    # --- runs, the trail of what the agent did ----------------------------------------------
    @app.post("/runs", status_code=201)
    def start(body: NewRun) -> dict:
        """Start a named workflow (engine/runner.py: WORKFLOWS) in a space. It works until it
        finishes, fails, or stops for the owner's approval or answers."""
        space = body.space or body.client or DEFAULT_SPACE
        try:
            run_id = engine.start_run(body.workflow, space, body.inputs)
        except costs.MonthlyCapReached as e:
            raise HTTPException(402, str(e))
        except ValueError as e:  # an unknown workflow, or a space name the folder rules refuse
            raise HTTPException(422, str(e))
        return {"run_id": run_id, "status": db.get_run(run_id)["status"]}

    @app.get("/runs")
    def runs(status: str | None = None) -> list[dict]:
        return db.list_runs(status=status)

    @app.get("/runs/{run_id}")
    def run(run_id: str) -> dict:
        found = db.get_run(run_id)
        if not found:
            raise HTTPException(404, "run not found")
        return {**found, "model_calls": db.list_model_calls(run_id)}

    @app.get("/audit")
    def audit(limit: int = 50) -> list[dict]:
        return db.recent_audit(max(1, min(500, limit)))

    # --- the day, tasks and reminders ---------------------------------------------------------
    @app.get("/briefing")
    def day() -> dict:
        return briefing.build(engine)

    def _local_stamp(minutes: int = 0) -> str:
        w = briefing.day_window(settings)
        return (w["now"] + timedelta(minutes=minutes)).strftime("%Y-%m-%dT%H:%M")

    def _due(text: str | None) -> str | None:
        if not text:
            return None
        try:
            return datetime.fromisoformat(text.strip()).strftime("%Y-%m-%dT%H:%M")
        except ValueError:
            raise HTTPException(422, "due is a local date and time, YYYY-MM-DDTHH:MM")

    def _task_or_404(task_id: str) -> dict:
        found = db.get_task(task_id)
        if not found:
            raise HTTPException(404, "no such task")
        return found

    @app.get("/tasks")
    def task_list(status: str | None = None) -> list[dict]:
        found = [briefing._task(t) for t in db.list_tasks() if not status or t["status"] == status]
        # Open first, then by due time (undated last).
        return sorted(found, key=lambda t: (t["status"] == "done", t["due"] or "9999", t["title"]))

    @app.post("/tasks", status_code=201)
    def add_task(body: NewTask) -> dict:
        if not body.title.strip():
            raise HTTPException(422, "the task has no title")
        engine.harness.clients.ensure(body.space)
        task_id = db.create_task(workstream=body.space, title=body.title.strip()[:200], status="todo",
                                 owner="owner", due=_due(body.due))
        return briefing._task(db.get_task(task_id))

    @app.patch("/tasks/{task_id}")
    def change_task(task_id: str, body: TaskChange) -> dict:
        _task_or_404(task_id)
        fields = {}
        if body.title is not None:
            if not body.title.strip():
                raise HTTPException(422, "the task has no title")
            fields["title"] = body.title.strip()[:200]
        if body.due is not None:
            fields["due"] = _due(body.due)
            fields["reminded_at"] = None  # a new time is a new reminder
            fields["snoozed_until"] = None
        if body.status is not None:
            if body.status not in ("todo", "done"):
                raise HTTPException(422, "status is todo or done")
            fields["status"] = body.status
        if body.snooze_minutes is not None:
            if not 1 <= body.snooze_minutes <= 7 * 24 * 60:
                raise HTTPException(422, "snooze between a minute and a week")
            fields["snoozed_until"] = _local_stamp(body.snooze_minutes)
        if fields:
            db.update_task(task_id, **fields)
        return briefing._task(db.get_task(task_id))

    @app.delete("/tasks/{task_id}", status_code=204)
    def remove_task(task_id: str) -> None:
        _task_or_404(task_id)
        db.delete_task(task_id)

    @app.get("/reminders")
    def reminders() -> list[dict]:
        return [briefing._task(t) for t in db.due_reminders(_local_stamp())]

    @app.post("/tasks/{task_id}/remind")
    def remind(task_id: str) -> dict:
        """Mark a due reminder delivered. Safe to repeat: only the first call delivers."""
        _task_or_404(task_id)
        delivered = db.mark_reminded(task_id, _local_stamp())
        return {"delivered": delivered, "task": briefing._task(db.get_task(task_id))}

    # --- memory and spaces ------------------------------------------------------------------
    def _proposal(p: dict) -> dict:
        return {k: p.get(k) for k in ("id", "text", "status", "chat_id", "workstream", "memory_id", "created_at", "decided_at")}

    @app.get("/memory/proposals")
    def proposals(status: str | None = "open") -> list[dict]:
        return [_proposal(p) for p in db.list_proposals(status=status or None)]

    @app.post("/memory/proposals/{proposal_id}")
    def decide_proposal(proposal_id: str, body: ProposalDecision) -> dict:
        found = db.get_proposal(proposal_id)
        if not found:
            raise HTTPException(404, "no such suggestion")
        if body.decision not in ("keep", "dismiss"):
            raise HTTPException(422, "decision is keep or dismiss")
        if found["status"] != "open":
            raise HTTPException(409, f"this suggestion was already {found['status']}")
        memory_id = None
        if body.decision == "keep":
            text = (body.text or found["text"]).strip()
            if not text:
                raise HTTPException(422, "the note is empty")
            memory_id = db.add_memory(found["workstream"], "note", text[:60], text, source_chat_id=found["chat_id"])
        if not db.decide_proposal(proposal_id, "kept" if memory_id else "dismissed", memory_id):
            if memory_id:  # decided elsewhere in the meantime: undo this one's note
                db.delete_memory(memory_id)
            raise HTTPException(409, "this suggestion was already decided")
        return _proposal(db.get_proposal(proposal_id))

    @app.get("/memory")
    def memory(space: str | None = None) -> list[dict]:
        return db.list_memory(space)

    @app.post("/memory", status_code=201)
    def remember(body: Note) -> dict:
        if not body.text.strip():
            raise HTTPException(422, "the note is empty")
        engine.harness.clients.ensure(body.space)
        return {"id": db.add_memory(body.space, body.kind, body.title or body.text[:60], body.text.strip())}

    @app.delete("/memory/{item_id}", status_code=204)
    def forget(item_id: str) -> None:
        db.delete_memory(item_id)

    @app.get("/spaces")
    def spaces() -> list[dict]:
        return [{"name": n, "restricted": db.is_restricted(n), "retention_days": db.get_retention_days(n)}
                for n in engine.harness.clients.list_clients()]

    @app.post("/spaces", status_code=201)
    def add_space(body: Space) -> dict:
        try:
            scope = engine.harness.clients.ensure(body.name)
        except Exception as e:
            raise HTTPException(422, str(e))
        db.set_restricted(scope.name, body.restricted)
        if body.retention_days is not None:
            retention.set_retention(engine, scope.name, body.retention_days)
        return {"name": scope.name, "restricted": body.restricted, "retention_days": body.retention_days}

    @app.get("/costs")
    def spend(month: str | None = None) -> dict:
        return costs.summary(db, settings, month)

    return app


def __getattr__(name: str):
    # `uvicorn personal_agent.api.app:app` builds the app on first use, from the environment.
    if name == "app":
        globals()["app"] = create_app()
        return globals()["app"]
    raise AttributeError(name)
