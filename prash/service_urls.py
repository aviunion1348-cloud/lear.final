"""Cross-service URL resolution.

Lear runs in three very different topologies and every one of them needs a
different answer to "where is the other half of the app?":

    1. Local dev       backend on :8000, Vite UI on :1420 (two localhost ports)
    2. Tauri desktop   backend on :8000, UI served in-process by the shell
    3. Vercel services  backend and UI are separate services behind one domain

Historically the notification paths (``prash/email_service.py``,
``prash/slack_service.py``, ``prash/admin_panel.py``) hardcoded
``http://localhost:1420`` and ``http://localhost:8000`` when building the
"open this incident in Lear" deep-links. Those links are correct on a laptop
and broken everywhere else -- a Slack alert from a deployed instance pointed
the on-call engineer at their own machine.

This module centralises the lookup. On Vercel, a *service binding* declared on
the calling service injects the target's base URL into an environment
variable; we read it here. Everywhere else we fall back to the localhost
defaults, so local development is completely unchanged.

Binding contract (see ``vercel.json``):

    services.app.bindings[] = {
        "type": "service", "service": "desktop",
        "format": "url", "env": "DESKTOP_URL"
    }

Vercel sets ``DESKTOP_URL`` at runtime. Never set it by hand in project env
vars -- the platform owns it.
"""

from __future__ import annotations

import os

# Fallbacks used for local dev and the Tauri desktop shell.
DEFAULT_DESKTOP_URL = "http://localhost:1420"
DEFAULT_API_URL = "http://localhost:8000"


def _clean(value: str | None) -> str | None:
    """Normalise an env value: strip blanks, add a scheme, drop trailing slash.

    Vercel injects bare hostnames for some binding formats, so a value like
    ``lear-desktop.vercel.app`` has to become a usable absolute URL. A blank
    string is treated as "not configured" (the same rule ``.env`` uses
    everywhere else in Lear).
    """
    if not value:
        return None
    value = value.strip()
    if not value:
        return None
    if not value.startswith(("http://", "https://")):
        value = f"https://{value}"
    return value.rstrip("/")


def desktop_url() -> str:
    """Base URL of the frontend (the ``desktop`` service).

    Resolution order:
      1. ``DESKTOP_URL``       -- injected by the Vercel service binding
      2. ``LEAR_DESKTOP_URL``  -- manual override for self-hosted deploys
      3. ``http://localhost:1420`` -- local dev / Tauri
    """
    return (
        _clean(os.getenv("DESKTOP_URL"))
        or _clean(os.getenv("LEAR_DESKTOP_URL"))
        or DEFAULT_DESKTOP_URL
    )


def api_url() -> str:
    """Public base URL of this backend (the ``app`` service).

    On Vercel the whole project shares one domain, so ``VERCEL_URL`` is the
    right public origin for links we hand to humans.
    """
    return (
        _clean(os.getenv("LEAR_API_URL"))
        or _clean(os.getenv("VERCEL_PROJECT_PRODUCTION_URL"))
        or _clean(os.getenv("VERCEL_URL"))
        or DEFAULT_API_URL
    )


def chat_deeplink(session_id: str, tab: str = "chat") -> str:
    """Build the canonical 'open this incident in Lear' link."""
    return f"{desktop_url()}/?tab={tab}&session={session_id}"
