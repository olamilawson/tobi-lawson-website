# State machines

Every flow that has more than "loading, then done" is written down here: its
states, the one place its transitions happen, and how a person or an agent can
see which state it is in.

## The agent (server: `agent/`)

| Machine | States | Transitions live in | Observe it |
|---|---|---|---|
| Run | `queued` → `running` → `waiting_for_approval` / `waiting_for_input` → `running` → `done` / `failed` / `cancelled` | `agent/src/personal_agent/engine/runner.py` | `GET /api/agent/runs/{id}` |
| Conversation | `ready` ⇄ `waiting` (an answer is being written, or an email it asked for is being drafted; one message at a time, 409 otherwise) | `api/app.py` `_state` | `GET /api/agent/chats/{id}/state` |
| Approval | pending → approved / rejected / sent back; an approval whose content hash no longer matches lapses and is asked again | `engine/approval.py`, `gateway/tools.py` | `GET /api/agent/approvals`, the audit log |
| Email / invitation from a conversation | draft (model) → waiting for approval (editable) → sent, held (no mailbox: kept in the outbox), discarded (`cancelled`) or failed | `engine/act.py` | `actions` in `GET /api/agent/chats/{id}` |
| Follow-through | after each answer: nothing, or tasks, memory suggestions, and email/invitation runs; a failure is audited as `follow_through_skipped` and never fails the answer | `engine/follow.py` | the audit log (`follow_through`) |
| Task / reminder | `todo` ⇄ `done`; a reminder is due → delivered (once) → due again only after a snooze runs out | `db.py` `_reminder_due` (the one rule) | `GET /api/agent/reminders`, `GET /api/agent/tasks` |
| Memory suggestion | `open` → `kept` / `dismissed`, once (409 after) | `db.py` `decide_proposal` | `GET /api/agent/memory/proposals` |
| Outlook in the day | `ok`, `down` (with the reason), `not_connected` | `engine/briefing.py` | `calendar.state`, `inbox.state` in `GET /api/agent/briefing` |
| Monthly spend | `none`, `ok`, `alert` (80%), `stopped` (only the owner's own messages start work) | `costs.py`, `Engine.check_monthly_cap` | `spend` in `GET /api/agent/me` |
| Health | the service answers, or it does not | `api/app.py` | `GET /api/agent/health` → `{"ok": true, "service": "personal-agent"}` |

## The desk (page: `agent/ui/` → `/desk/`)

| Machine | States | Transitions live in | Observe it |
|---|---|---|---|
| Session | `checking` → `signed_out` / `loading_me` → `ready`; or `not_running`, `not_set_up`, `offline` (each with Check again); any 401 returns to `signed_out` | `agent/ui/src/session.tsx` (reducer) | `<body data-session="…">` |
| Sign-in form | `idle` → `checking` → wrong / locked / failed, or signed in | `screens/SignIn.tsx` | `<main data-state>` |
| Any data on a screen | `loading` → `ready` (with `stale` when a refresh failed: the last good data stays) or `error` (reason and Try again). A failed read never shows as empty. | `agent/ui/src/useResource.ts` | `data-state` on lists and panels |
| The stage (what the agent is doing) | `idle`, `thinking`, `researching`, `drafting`, `waiting`, `sleeping`, `down`, `briefing`, `fetching`, `delivering` | `agent/ui/src/activity.ts` `deriveActivity` (derived from data, never set by a click) | `data-state` on the stage, which is also a `role="status"` region |
| Approval card | `review` ⇄ `editing`; `review` → `approving` → sent / held; `review` → `discard_grace` (5 s, Undo) → `discarding` → discarded. One action at a time; Approve refuses an unsaved edit and says why (`aria-describedby`). | `components/Cards.tsx` `ApprovalCard` | `data-state` on the card |
| Memory card | `open` → `saving` → `kept` / `dismissed` | `components/Cards.tsx` `MemoryCard` | `data-state` |
| Reminder card | `open` → `saving` → `done` / `snoozed` | `components/Cards.tsx` `ReminderCard` | `data-state` |
| Composer | `ready`, `busy` (an answer is being written), `sending`, send failed (the text is kept) | `screens/Home.tsx` `Composer` | `<form data-state>`, the send button's `aria-describedby` |
| Asleep / awake | asleep outside the agent's hours until woken (per day, remembered in this browser); a message also wakes | `screens/Home.tsx` (`asleep`, `wakeUp`) | the stage's `data-state="sleeping"` |
| Task row, memory row | `idle` → `confirming` → `deleting` / `forgetting` (deleting asks first) | `screens/Tasks.tsx`, `screens/Memory.tsx` | `data-state` on the row |

## Ola on the public site (homepage and /ola/)

| Machine | States | Transitions live in | Observe it |
|---|---|---|---|
| Stage tour | asleep → waking → setting out the day → standing by → thinking → drafting → waiting for a yes → approved → reminder fetched → delivered → standing by → (again); paused stops it, and it stops while off screen | `agent/ui/src/showcase.tsx` (`TOUR`) | `[data-ola-stage="live"]`; inside its shadow root, `data-state` and `data-paused` |
| Loading the stage | still picture → live (when the stage comes near the screen; stays the still picture if scripts fail) | `app.js` `initOlaStage` | `[data-ola-stage]` is empty, or `"live"` |
