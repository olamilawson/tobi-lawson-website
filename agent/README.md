# The personal agent

The engine behind Tobi's personal agent, served as a JSON API at
`https://tobilawson.com/api/agent/`. It has no pages: the front end is designed
separately and calls this API. What it is for, and what comes next, is in
[PRD.md](PRD.md).

The engine is ported from the Ijeoma.Pro agent (Chidimma Okoli's), keeping the
parts any personal agent needs and leaving out her client business.

## What it does today

- **Conversations with files.** A message starts or continues a conversation.
  Each answer reads the earlier turns and every file attached to the
  conversation (PDF, Word, text, Markdown, CSV; up to five files of 10 MB a
  message). One answer at a time.
- **Web research.** With `web` on, the agent searches the web through Exa first
  and cites each page it used.
- **Nothing leaves without your yes.** Sending mail or a calendar invitation
  waits for an approval that matches the exact content (a hash); change one
  character and it asks again. Each release runs once, under an idempotency key.
- **Memory.** Notes you keep per space travel with every step the agent takes in
  that space, with your principles from `config/core.yaml`.
- **Spaces.** Personal, a company, a project: each has its own files and notes.
  A restricted space only goes to model providers you approve in
  `config/providers.yaml`, and never to web search unless you approve Exa there.
- **A trail.** Every run, model call, tool call and approval is recorded; the
  audit log is append-only.
- **Spending caps.** A cap per run (`config/budgets.yaml`) and an optional
  monthly cap.
- **Instructions inside material are data.** Files, web pages and pasted text
  travel to the model inside marked blocks; text in them that reads like an
  order is flagged and never obeyed.

## Run it on your computer

```bash
cd agent
uv venv && uv pip install -e ".[dev]"
.venv/Scripts/python -m pytest -q          # Windows; .venv/bin/python elsewhere
GROQ_API_KEY=... .venv/Scripts/uvicorn personal_agent.api.app:app --port 8200
```

Without the sign-in settings, the API serves open on your own machine. Data goes
to `agent/data/` (ignored by git). Open http://localhost:8200/docs for the
interactive API reference.

## The API

All routes but `/health` and `/session` need the session cookie once sign-in is
set up. Changes must come from a page on the same site.

| Route | Does |
|---|---|
| `GET /health` | `{ok, agent}` |
| `GET /session` · `POST /session` · `DELETE /session` | Sign-in state, sign in (`{email, password, code}`), sign out |
| `GET /me` | Names, model routes, mailbox and connector status (names only, never keys), this month's spend |
| `GET /chats` | Conversations, newest first, each with `state` |
| `POST /chats` | multipart: `message`, `files`, `space`, `mode` (ask, research, create, analyse, plan), `depth` (quick, considered, deep), `web`, `material`. Returns 202 `{chat, run_id, state}` |
| `GET /chats/{id}` | The conversation: turns, files, state |
| `POST /chats/{id}/messages` | A follow-up; 409 while the agent is still answering |
| `GET /chats/{id}/state` | `{state: ready or waiting, turns, last_turn: {id, status}}`: poll this while waiting |
| `GET /approvals` | What waits on you: `{approvals, questions}` |
| `POST /runs/{id}/approval` | `{decision: approved, rejected or sent_back, comment, edited_body}` |
| `POST /runs/{id}/input` | `{answers}` for a run that asked questions |
| `POST /runs` | Start a named workflow: `{workflow, space, inputs}` |
| `GET /runs` · `GET /runs/{id}` | Runs, and one run with its model calls |
| `GET /audit` | The latest audit entries |
| `GET /memory` · `POST /memory` · `DELETE /memory/{id}` | Notes per space |
| `GET /spaces` · `POST /spaces` | Spaces, with `restricted` and `retention_days` |
| `GET /costs` | The month's spend by workflow and model |

### State machines

| Machine | States | Where it moves | How to see it |
|---|---|---|---|
| Conversation | `ready`, `waiting` | `api/app.py` (`_send`, `_state`) | `GET /chats/{id}/state` |
| Run | `queued`, `running`, `waiting_for_approval`, `waiting_for_input`, `done`, `failed`, `cancelled` | `engine/runner.py` | `GET /runs/{id}` |
| Approval | pending, approved, rejected, sent back, lapsed | `engine/approval.py`, `gateway/tools.py` | `GET /approvals`, the audit log |
| Monthly spend | `none` (no cap), `ok`, `alert` (80%), `stopped` | `costs.py` | `GET /me` → `spend` |

## Deploy on the VPS

The website's deploy already copies `agent/` to the server
(`/var/www/tobilawson.com/agent`). nginx never serves it
(`deploy/nginx.conf` returns 404 for `/agent/`) and passes `/api/agent/` to the
service. The service's data lives in `/var/lib/tobi-agent`, outside the web folder.

Once, as root, in the Hostinger terminal:

```bash
useradd --system --home /var/lib/tobi-agent --shell /usr/sbin/nologin tobi-agent
mkdir -p /var/lib/tobi-agent && chown tobi-agent:tobi-agent /var/lib/tobi-agent
python3 -m venv /opt/tobi-agent/venv
/opt/tobi-agent/venv/bin/pip install -e /var/www/tobilawson.com/agent
cp /var/www/tobilawson.com/agent/deploy/env.example /etc/tobi-agent.env && chmod 600 /etc/tobi-agent.env
/opt/tobi-agent/venv/bin/python -m personal_agent.auth --with-code
```

Paste the lines it prints, and your provider keys, into `/etc/tobi-agent.env`
with `nano /etc/tobi-agent.env`. Then add the two agent blocks from
`deploy/nginx.conf` to the site's server block, and:

```bash
cp /var/www/tobilawson.com/agent/deploy/tobi-agent.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now tobi-agent
nginx -t && systemctl reload nginx
curl -s https://tobilawson.com/api/agent/health
```

The last line should print `{"ok":true,...}`. Port 8200 must be free on the VPS:
`ss -ltn | grep 8200` should print nothing before the first start.

After each website deploy that changes `agent/`:

```bash
/opt/tobi-agent/venv/bin/pip install -e /var/www/tobilawson.com/agent && systemctl restart tobi-agent
```

## What came from the Ijeoma.Pro agent, and what did not

Ported as it was: the model harness (`harness/`: routes with fallbacks, step
contracts, budgets, marked untrusted material), the tool gateway and approval
node, the chat engine with attachments, Exa web search, the Microsoft Graph
mail and calendar connector, sign-in with a one-time code, cost caps, tracing,
retention, and per-space folders.

Trimmed: settings, database tables and the runner, to the general parts.

Left out: client enquiries, brief evaluation, sponsorship triage, agency
dispatch, creative review, strategy drafting, the skill library and learning
review, Canva and Higgsfield, the signal feed, and all of the Ijeoma.Pro pages.
