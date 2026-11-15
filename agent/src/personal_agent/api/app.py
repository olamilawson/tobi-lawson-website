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
"""

from __future__ import annotations

from urllib.parse import urlsplit

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from personal_agent import auth, connectors, costs, retention
from personal_agent.config import Settings, load_settings
from personal_agent.db import Database
from personal_agent.engine import think
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
        return {"ok": True, "agent": settings.agent_name}

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

    def _state(chat_id: str) -> dict:
        chat_turns = think.turns(db, chat_id)
        last = chat_turns[-1] if chat_turns else None
        return {"chat": chat_id, "state": "waiting" if last and last["status"] in WORKING else "ready",
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

    # --- memory and spaces ------------------------------------------------------------------
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
