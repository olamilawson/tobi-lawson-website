"""The JSON API: conversations with files, one answer at a time, sign-in, memory and spaces."""

from __future__ import annotations

import io

from docx import Document
from fastapi.testclient import TestClient

from personal_agent import auth
from personal_agent.api.app import create_app
from personal_agent.harness.models import RecordedGateway

FIRST = {"answer": "Start with the cash runway.", "caveats": []}
SECOND = {"answer": "Then the hiring plan.", "caveats": []}


class Heard(RecordedGateway):
    def __init__(self, responses):
        super().__init__(responses)
        self.contexts: list[str] = []

    def complete(self, contract, context, images=None, providers=None):
        if contract.node == "think":
            self.contexts.append(context)
        return RecordedGateway.complete(self, contract, context, images, providers)


def _client(settings, *answers) -> tuple[TestClient, Heard]:
    gateway = Heard({"think": list(answers)})
    return TestClient(create_app(settings, gateway=gateway)), gateway


def _docx(text: str) -> bytes:
    doc = Document()
    doc.add_paragraph(text)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def test_health_is_open(settings):
    assert _client(settings)[0].get("/health").json()["ok"] is True


def test_a_conversation_reads_its_files_and_its_earlier_turns(settings):
    client, gateway = _client(settings, FIRST, SECOND)
    sent = client.post("/chats", data={"message": "What should I look at first?"},
                       files=[("files", ("memo.docx", _docx("Runway is nine months."), "application/octet-stream"))])
    assert sent.status_code == 202
    chat = sent.json()["chat"]
    again = client.post(f"/chats/{chat}/messages", data={"message": "And then?"})
    assert again.status_code == 202
    assert '<untrusted_data source="attached file: memo.docx">' in gateway.contexts[0]
    assert 'source="this conversation so far"' in gateway.contexts[1] and "Start with the cash runway." in gateway.contexts[1]
    body = client.get(f"/chats/{chat}").json()
    assert [t["answer"] for t in body["turns"]] == [FIRST["answer"], SECOND["answer"]]
    assert body["files"][0]["name"] == "memo.docx" and body["state"] == "ready" and body["space"] == "Personal"
    assert client.get("/chats").json()[0]["title"] == "What should I look at first?"


def test_one_answer_at_a_time(settings):
    client, _ = _client(settings)
    engine = client.app.state.engine
    chat = engine.db.create_chat("Personal")
    run_id = engine.start_run("think", "Personal", {"question": "First?", "chat_id": chat}, work=False)
    assert client.post(f"/chats/{chat}/messages", data={"message": "Second?"}).status_code == 409
    assert client.get(f"/chats/{chat}/state").json() == {
        "chat": chat, "state": "waiting", "turns": 1, "last_turn": {"id": run_id, "status": "queued"}}


def test_a_file_the_agent_cannot_read_sends_nothing(settings):
    client, gateway = _client(settings, FIRST)
    sent = client.post("/chats", data={"message": "Read this."}, files=[("files", ("photo.png", b"x", "image/png"))])
    assert sent.status_code == 422 and "nothing was sent" in sent.json()["detail"]
    assert client.get("/chats").json() == [] and gateway.contexts == []


def test_an_empty_message_and_an_unknown_space_are_refused(settings):
    client, _ = _client(settings)
    assert client.post("/chats", data={"message": "  "}).status_code == 422
    assert client.post("/chats", data={"message": "x", "space": "Nowhere"}).status_code == 422


def test_memory_and_spaces(settings):
    client, _ = _client(settings)
    assert client.post("/spaces", json={"name": "Lawson Capital", "restricted": True, "retention_days": 90}).status_code == 201
    spaces = {s["name"]: s for s in client.get("/spaces").json()}
    assert spaces["Lawson Capital"] == {"name": "Lawson Capital", "restricted": True, "retention_days": 90}
    note = client.post("/memory", json={"space": "Lawson Capital", "text": "Prefers one-page memos."}).json()
    assert client.get("/memory?space=Lawson%20Capital").json()[0]["text"] == "Prefers one-page memos."
    assert client.delete(f"/memory/{note['id']}").status_code == 204
    assert client.get("/memory?space=Lawson%20Capital").json() == []


def test_a_restricted_space_never_reaches_web_search(settings, monkeypatch):
    monkeypatch.setenv("EXA_API_KEY", "test-key")
    client, gateway = _client(settings, FIRST)
    client.post("/spaces", json={"name": "Private", "restricted": True})
    chat = client.post("/chats", data={"message": "Rates?", "space": "Private", "web": "on"}).json()["chat"]
    turn = client.get(f"/chats/{chat}").json()["turns"][0]
    assert any("is restricted" in c for c in turn["caveats"]) and turn["sources"] == []


def test_sign_in_guards_everything_but_health_and_session(settings):
    settings.owner_email = "owner@example.com"
    settings.owner_password_hash = auth.hash_password("a long enough password")
    settings.session_secret = "s" * 48
    client, _ = _client(settings)
    assert client.get("/chats").status_code == 401
    assert client.get("/session").json() == {"signed_in": False, "login_required": True, "code_required": False}
    assert client.post("/session", json={"email": "owner@example.com", "password": "wrong"}).status_code == 401
    assert client.post("/session", json={"email": "owner@example.com", "password": "a long enough password"}).status_code == 200
    assert client.get("/chats").status_code == 200
    # A change sent from another site, carrying the cookie, is refused.
    assert client.post("/memory", json={"text": "x"}, headers={"origin": "https://evil.example"}).status_code == 403
    client.delete("/session")
    assert client.get("/chats").status_code == 401


def test_a_server_without_sign_in_refuses_everything(settings):
    settings.require_login = True
    client, _ = _client(settings)
    assert client.get("/chats").status_code == 503 and client.get("/health").status_code == 200


def test_tasks_reminders_and_snooze(settings):
    client, _ = _client(settings)
    made = client.post("/tasks", json={"title": "Call Ada", "due": "2020-01-01T09:00"}).json()
    assert made["status"] == "todo"
    assert [t["id"] for t in client.get("/reminders").json()] == [made["id"]]
    first = client.post(f"/tasks/{made['id']}/remind").json()
    again = client.post(f"/tasks/{made['id']}/remind").json()
    assert first["delivered"] is True and again["delivered"] is False
    assert client.get("/reminders").json() == []
    snoozed = client.patch(f"/tasks/{made['id']}", json={"snooze_minutes": 30}).json()
    assert snoozed["snoozed_until"] and client.get("/reminders").json() == []
    done = client.patch(f"/tasks/{made['id']}", json={"status": "done"}).json()
    assert done["status"] == "done"
    assert client.patch(f"/tasks/{made['id']}", json={"status": "maybe"}).status_code == 422
    assert client.post("/tasks", json={"title": " "}).status_code == 422
    assert client.delete(f"/tasks/{made['id']}").status_code == 204
    assert client.patch(f"/tasks/{made['id']}", json={"status": "done"}).status_code == 404


def test_a_memory_suggestion_is_decided_once(settings):
    client, _ = _client(settings)
    db = client.app.state.engine.db
    pid = db.propose_memory("Personal", "You prefer morning calls.", None, None)
    assert [p["id"] for p in client.get("/memory/proposals").json()] == [pid]
    kept = client.post(f"/memory/proposals/{pid}", json={"decision": "keep", "text": "You prefer calls before noon."})
    assert kept.status_code == 200 and kept.json()["status"] == "kept"
    assert [m["text"] for m in client.get("/memory").json()] == ["You prefer calls before noon."]
    assert client.post(f"/memory/proposals/{pid}", json={"decision": "dismiss"}).status_code == 409
    assert client.get("/memory/proposals").json() == []


def test_the_briefing_says_when_nothing_is_connected(settings):
    client, _ = _client(settings)
    day = client.get("/briefing").json()
    assert day["calendar"] == {"state": "not_connected", "items": []} and day["inbox"]["state"] == "not_connected"
    assert day["approvals"] == [] and day["reminders"] == [] and isinstance(day["awake"], bool)
    assert client.get("/me").json()["character"]["name"]


def test_a_calendar_that_fails_says_why(settings):
    class Down:
        def events_between(self, *a):
            raise RuntimeError("Microsoft Graph could not be reached: ConnectTimeout")

        def unread(self, *a):
            return [{"id": "m1", "subject": "Hello"}]

    client = TestClient(create_app(settings, gateway=Heard({}), mail=Down()))
    day = client.get("/briefing").json()
    assert day["calendar"]["state"] == "down" and "could not be reached" in day["calendar"]["reason"]
    assert day["inbox"] == {"state": "ok", "items": [{"id": "m1", "subject": "Hello"}]}
