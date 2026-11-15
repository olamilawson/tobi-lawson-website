# Personal agent: product requirements

Owner: Tobi Lawson · Status: draft · Last updated: 15 November 2026

## 1. Summary

A personal agent for one person, Tobi, that knows him, talks like a person,
does real work on his behalf, and never sends, spends or publishes anything
without his yes. The engine exists (ported from the Ijeoma.Pro agent, see
[README.md](README.md)). This document says what to build on it, in what order.

Tobi designs the interface himself. The agent serves a JSON API at
`tobilawson.com/api/agent/`.

## 2. Who it is for

Tobi Lawson, an investor and builder based in Lagos. One user. No accounts for
anyone else, no team features.

## 3. The problem

The tools that help are general (a chatbot that forgets you between sessions)
or narrow (a mail client, a calendar, a notes app). Each one has to be told the
same context again. Work that needs several of them (prepare for a meeting,
follow up after it, keep an eye on a company) falls to Tobi.

## 4. What "like Muse, Hermes and OpenClaw" means here

Those products differ, but the ones worth copying share five traits. This
agent adopts each, in the order below.

1. **It knows you.** Memory that persists, grows from conversations, and that
   you can read, correct and delete.
2. **It has a character.** A name, a voice and a manner that stay the same
   from one conversation to the next.
3. **It does the work.** Mail, calendar, research and documents, with the
   result in hand, not a description of what you could do.
4. **It takes initiative.** It brings things to you (a morning briefing, a
   follow-up due, a change in a company you watch) without being asked.
5. **It is where you are.** On the web first; later in a messaging app and by
   voice.

One rule overrides all five: anything that leaves the system (a message, an
invitation, a payment, a post) waits for Tobi's approval of the exact content.

## 5. Where we start (works today)

- Conversations with attached files, follow-ups and optional web research.
- Approval gate on every release, matched to the exact content; each release
  runs once.
- Notes per space; principles in `config/core.yaml` sent with every step.
- Spaces kept apart; restricted spaces go only to approved providers.
- Outlook mail and calendar connector (send, read free and busy times, create
  and change events), approval-gated.
- Sign-in with a one-time code, spending caps, a full trail of every run.

## 6. Phase 1: a personal agent on the web

| # | Requirement | Done when |
|---|---|---|
| 1.1 | **Character.** The agent's name, voice and manner live in one owner-written file and reach every step. | Two conversations a week apart read as the same agent. Changing the file changes the next answer. |
| 1.2 | **Memory that learns.** After a conversation the agent proposes facts worth keeping ("You prefer one-page memos"). Tobi accepts, edits or dismisses each. Accepted facts reach every later step. | No fact enters memory without Tobi's yes. Every fact shows where it came from and can be deleted. |
| 1.3 | **Morning briefing.** Each morning: today's calendar, mail that needs a reply, approvals waiting, tasks due. Built from the data; the model only summarises. | Every line links to its source. A connector that is down says so in the briefing, never silently. |
| 1.4 | **Tasks from conversation.** "Remind me to call Ada on Friday" becomes a task with a time; the agent brings it up when due. | Tasks are listed, editable and closable; a reminder never fires twice. |
| 1.5 | **Mail and calendar on your behalf.** Draft replies, propose meeting times from free and busy periods, send invitations, all through the approval gate. | Nothing is sent before approval; an edited draft is what goes. |
| 1.6 | **The front end.** Tobi's design, on the API. Every state has a screen: loading, empty, waiting, failed with a retry, done. | No state shows sample data or a blank screen. |

## 7. Phase 2: initiative

| # | Requirement | Done when |
|---|---|---|
| 2.1 | **A heartbeat.** A scheduled job wakes the agent (every 30 minutes, set by Tobi) to check what changed and decide whether anything is worth raising. | Each wake-up is logged with what it checked and why it stayed quiet or spoke. A daily limit caps how often it interrupts. |
| 2.2 | **Watchlists.** Companies, people, markets and topics Tobi follows; the agent reads sources he names and reports what changed, with links. | Reports cite every claim; nothing is reported twice. |
| 2.3 | **Goals.** Tobi sets a goal ("raise the next fund by Q3"); the agent breaks it into steps, tracks them, and asks for what it cannot do. | Each goal shows its steps, their state and the next action. |

## 8. Phase 3: messaging and voice

| # | Requirement | Done when |
|---|---|---|
| 3.1 | **A messaging app.** Talk to the agent and approve its actions from WhatsApp or Telegram (choose one first). | An approval in the app is the same approval as on the web, bound to the same content hash. |
| 3.2 | **Voice.** Send a voice note; hear the answer. | Transcripts are kept with the conversation; voice never bypasses the approval gate. |

## 9. Phase 4: hands

| # | Requirement | Done when |
|---|---|---|
| 4.1 | **A browser of its own.** The agent completes web tasks (a form, a booking) in an isolated browser Tobi can watch and take over. | Payment and sign-in steps always stop for Tobi. |
| 4.2 | **New tools.** When a task needs a tool that does not exist, the agent writes one in a sandbox and asks before adding it. | Every new tool is reviewed, versioned and removable. |

## 10. Not in scope

- Other users, teams or a public product.
- Trading, investing or moving money on Tobi's behalf. The agent may research
  and prepare; Tobi acts.
- Posting to social media without approval of the exact post.

## 11. Guardrails that never change

- Every release (send, invite, publish, pay) waits for approval of the exact
  content, and runs once.
- Material from outside (mail, files, web pages) is data, never instruction.
- Memory changes only with Tobi's yes.
- A restricted space never goes to a provider Tobi has not approved.
- Spending stops at the monthly cap.

## 12. How we will know it works

Measures to track from the first week of Phase 1; Tobi sets the targets once a
baseline exists.

- Messages a week, and the share answered without a failure.
- Share of drafts approved as written, edited, or rejected.
- Memory proposals accepted versus dismissed.
- Briefings opened, and briefing lines acted on.
- Monthly model and search spend.

## 13. Open questions

1. The agent's name and character: Tobi to write them.
2. Which messaging app first, WhatsApp or Telegram?
3. Which mailbox and calendar: Microsoft 365 (supported today) or Google
   (a new connector)?
4. Which model provider for the strong tier, and which providers are approved
   for restricted spaces?
5. Where Tobi's own notes live today (Notion, Apple Notes, documents), and
   whether the agent should read them.
