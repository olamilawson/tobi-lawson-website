"""Outside services the agent can use as tools. Today: Exa web search.

Each connector names the settings the server must hold. A tool whose connector
is not set up, or that would send a restricted space's material to a provider
not approved for confidential work, refuses with a message that says why and
what to do. Keys live in the server's environment, never in config files.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass

import httpx

from personal_agent.clients import ClientScope
from personal_agent.config import Settings
from personal_agent.db import Database
from personal_agent.gateway.tools import ToolClass, ToolGateway, ToolSpec

# Tests replace this with a stand-in for the network.
TRANSPORT: httpx.BaseTransport | None = None


class ConnectorNotReady(Exception):
    """The tool cannot run, or the service refused or failed. The message says which, and what to do."""


@dataclass(frozen=True)
class ConnectorTool:
    name: str
    cls: ToolClass
    does: str


@dataclass(frozen=True)
class Connector:
    name: str  # also the name to list under approved_for_confidential
    label: str
    needs: tuple[str, ...]  # settings the server must hold
    tools: tuple[ConnectorTool, ...]

    def missing(self) -> list[str]:
        return [name for name in self.needs if not os.environ.get(name)]


CONNECTORS = (
    Connector(
        name="exa", label="Exa web search", needs=("EXA_API_KEY",),
        tools=(ConnectorTool("web_search", ToolClass.READ, "Searches the web and reads the text of the pages it finds."),),
    ),
)
EXA_API = "https://api.exa.ai/search"
WEB_RESULTS, WEB_PAGE_CHARS = 5, 3000
BY_NAME = {c.name: c for c in CONNECTORS}


def _why(response: httpx.Response) -> str:
    try:
        body = response.json()
        detail = body.get("message") or body.get("error") or body.get("detail") or ""
        if isinstance(detail, dict):
            detail = detail.get("message") or json.dumps(detail)
    except ValueError:
        detail = response.text
    return f"{response.status_code} {str(detail)[:300]}".strip()


def register(tools: ToolGateway, db: Database, settings: Settings) -> None:
    def guarded(connector: Connector, tool: ConnectorTool, fn):
        def call(payload: dict) -> dict:
            space = payload.get("client")
            if not space:
                raise ConnectorNotReady(f"{tool.name} was not run: the call names no space.")
            if db.is_restricted(space) and connector.name not in settings.confidential_providers:
                raise ConnectorNotReady(
                    f"{tool.name} was not run: {space} is restricted and {connector.label} is not approved for confidential work."
                )
            if connector.missing():
                raise ConnectorNotReady(
                    f"{tool.name} was not run: {connector.label} is not connected. The server has no {' or '.join(connector.missing())}."
                )
            return fn(payload, ClientScope(space))

        return call

    def web_search(payload: dict, scope: ClientScope) -> dict:
        """One Exa search, with each page's text. The query is the owner's own question."""
        query = str(payload.get("query") or "").strip()[:500]
        if not query:
            raise ConnectorNotReady("web_search was not run: it needs a query.")
        try:
            with httpx.Client(transport=TRANSPORT, timeout=60.0) as http:
                response = http.post(EXA_API, headers={"x-api-key": os.environ.get("EXA_API_KEY", "")}, json={
                    "query": query, "numResults": WEB_RESULTS, "type": "auto",
                    "contents": {"text": {"maxCharacters": WEB_PAGE_CHARS}},
                })
        except httpx.HTTPError as e:
            raise ConnectorNotReady(f"Exa could not be reached ({type(e).__name__})") from e
        if response.status_code == 402:
            raise ConnectorNotReady("Exa has no credit left on this account")
        if response.status_code != 200:
            raise ConnectorNotReady(f"Exa refused the search ({_why(response)})")
        body = response.json()
        results = [
            {"title": str(r.get("title") or r.get("url") or "")[:300], "url": str(r.get("url") or ""),
             "published": (str(r.get("publishedDate"))[:10] if r.get("publishedDate") else None),
             "text": str(r.get("text") or "")[:WEB_PAGE_CHARS]}
            for r in body.get("results") or [] if str(r.get("url") or "").startswith(("http://", "https://"))
        ]
        return {"query": query, "results": results, "cost_usd": (body.get("costDollars") or {}).get("total")}

    handlers = {"web_search": web_search}
    for connector in CONNECTORS:
        for tool in connector.tools:
            tools.register(ToolSpec(name=tool.name, cls=tool.cls, fn=guarded(connector, tool, handlers[tool.name])))


def status() -> list[dict]:
    """Each connector, and whether the server holds what it needs (names only, never values)."""
    return [{"name": c.name, "label": c.label, "connected": not c.missing(), "missing": c.missing(),
             "tools": [t.name for t in c.tools]} for c in CONNECTORS]
