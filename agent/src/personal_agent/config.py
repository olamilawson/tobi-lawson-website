"""Settings and configuration loading.

Route table and budgets are version-controlled files under config/; secrets are
never in them. Database and data locations come from the environment, so the
same code runs on SQLite locally and on Postgres on the server, with the data
outside the website's folder.
"""

from __future__ import annotations

import os
from pathlib import Path

import yaml
from pydantic import BaseModel

REPO_ROOT = Path(__file__).resolve().parents[2]


class TierRoute(BaseModel):
    primary: str
    fallback: str | None = None


class ModelChoice(BaseModel):
    """One model offered for a tier (config/models.yaml)."""

    id: str
    label: str
    key: str | None = None  # the setting the server needs before this model can answer
    open: bool = False  # open-weight


class CoreSettings(BaseModel):
    """The owner's standard (config/core.yaml)."""

    principles: list[str] = []
    lens: list[str] = []


class Budgets(BaseModel):
    max_total_tokens: int = 200_000
    max_tool_calls: int = 20
    max_cost_usd: float = 5.0
    max_elapsed_seconds: int = 600
    # Across all runs in a calendar month. None: no cap. The owner sets it.
    monthly_cap_usd: float | None = None


class Settings(BaseModel):
    database_url: str
    checkpoint_path: Path
    route_table: dict[str, TierRoute]
    budgets: Budgets
    # One folder per space (personal, work, a company): files the agent may read, kept apart.
    clients_dir: Path
    # Providers approved for confidential work; a restricted space's runs use only these.
    confidential_providers: list[str] = []
    # Microsoft Graph mail (graph_mail.py). All four set: approved mail is sent through
    # this mailbox. Any missing: approved mail is held in the local outbox.
    graph_tenant_id: str | None = None
    graph_client_id: str | None = None
    graph_client_secret: str | None = None
    graph_mailbox: str | None = None
    graph_calendar: str | None = None
    # The owner's principles, sent with every model step.
    core: CoreSettings = CoreSettings()
    # The models offered for each tier's route.
    model_catalogue: list[ModelChoice] = []
    # The agent's name, and the name it calls the owner.
    agent_name: str = "Agent"
    owner_name: str = "Tobi"
    # Owner sign-in (see auth.py). Email, password hash and session secret all
    # set: every request needs a session. A TOTP secret adds a one-time code.
    owner_email: str | None = None
    owner_password_hash: str | None = None
    totp_secret: str | None = None
    session_secret: str | None = None
    session_hours: int = 12
    # On a server: with the login not set up, refuse every request instead of serving open.
    require_login: bool = False


def load_settings() -> Settings:
    env = os.environ.get
    data = Path(env("PERSONAL_AGENT_DATA_DIR") or REPO_ROOT / "data")
    db = env("PERSONAL_AGENT_DATABASE_URL") or f"sqlite:///{(data / 'app.db').as_posix()}"
    ckpt = Path(env("PERSONAL_AGENT_CHECKPOINT_DB") or data / "checkpoints.sqlite")
    if db.startswith("sqlite:///"):
        Path(db.removeprefix("sqlite:///")).parent.mkdir(parents=True, exist_ok=True)
    ckpt.parent.mkdir(parents=True, exist_ok=True)

    def from_yaml(variable: str, filename: str) -> dict:
        path = Path(env(variable) or REPO_ROOT / "config" / filename)
        return (yaml.safe_load(path.read_text(encoding="utf-8")) or {}) if path.exists() else {}

    providers = from_yaml("PERSONAL_AGENT_PROVIDERS", "providers.yaml")
    return Settings(
        database_url=db,
        checkpoint_path=ckpt,
        route_table={tier: TierRoute(**r) for tier, r in from_yaml("PERSONAL_AGENT_ROUTE_TABLE", "route_table.yaml").items()},
        budgets=Budgets(**from_yaml("PERSONAL_AGENT_BUDGETS", "budgets.yaml")),
        clients_dir=Path(env("PERSONAL_AGENT_CLIENTS_DIR") or data / "spaces"),
        confidential_providers=[str(p).lower() for p in providers.get("approved_for_confidential") or []],
        core=CoreSettings(**from_yaml("PERSONAL_AGENT_CORE", "core.yaml")),
        model_catalogue=[ModelChoice(**m) for m in from_yaml("PERSONAL_AGENT_MODELS", "models.yaml").get("models", [])],
        agent_name=env("PERSONAL_AGENT_NAME") or "Agent",
        owner_name=env("PERSONAL_AGENT_OWNER_NAME") or "Tobi",
        graph_tenant_id=env("MS_GRAPH_TENANT_ID") or None,
        graph_client_id=env("MS_GRAPH_CLIENT_ID") or None,
        graph_client_secret=env("MS_GRAPH_CLIENT_SECRET") or None,
        graph_mailbox=env("MS_GRAPH_MAILBOX") or None,
        graph_calendar=env("MS_GRAPH_CALENDAR") or None,
        owner_email=env("PERSONAL_AGENT_OWNER_EMAIL") or None,
        owner_password_hash=env("PERSONAL_AGENT_OWNER_PASSWORD_HASH") or None,
        totp_secret=env("PERSONAL_AGENT_TOTP_SECRET") or None,
        session_secret=env("PERSONAL_AGENT_SESSION_SECRET") or None,
        session_hours=int(env("PERSONAL_AGENT_SESSION_HOURS") or 12),
        require_login=(env("PERSONAL_AGENT_REQUIRE_LOGIN") or "").lower() in ("1", "true", "yes"),
    )
