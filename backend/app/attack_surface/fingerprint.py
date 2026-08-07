"""Fingerprint stage: live services -> interpreted identity.

The probe gathered raw facts (status codes, headers, a TLS cert). This stage
reads those facts and forms an opinion about *what the service is*: what tech
stack it runs, whether it looks like a login or admin surface, whether its TLS
is broken. It sends **no** network traffic -- it is a pure function of the
LiveService it's given.

That purity is the design point. Because interpretation is decoupled from
observation, we can add a new detector (say, "flags an exposed Kibana") and
re-run it over last month's stored probes to find exposures we didn't know to
look for then -- without re-probing a single host. Detection improves; the
target's peace is undisturbed.

Detectors are simple, explainable heuristics on headers/status/body-less
signals rather than a heavy fingerprint database. For an SME tool, a wrong
"you're running nginx" is cheap; the value is in the high-signal booleans
(admin panel exposed, cert expired) that feed scoring. Everything here is a
best-effort guess and is labelled as such downstream.
"""

from __future__ import annotations

from .types import Fingerprint, LiveService

# Header -> technology hints. Deliberately small and transparent: anyone can
# read why we claimed a technology, which matters when a human triages findings.
_SERVER_HINTS = ("server", "x-powered-by", "x-generator", "via")

# Paths/markers that suggest an authentication or admin surface. We only have
# the landing response (the probe hit "/"), so we lean on redirects and
# well-known header/title signals rather than crawling -- crawling is louder and
# out of scope for a visibility tool.
_LOGIN_MARKERS = ("login", "signin", "sign-in", "auth", "sso", "oauth")
_ADMIN_MARKERS = ("admin", "wp-admin", "dashboard", "console", "manager")


def _technologies(svc: LiveService) -> tuple:
    techs = []
    for h in _SERVER_HINTS:
        val = svc.headers.get(h)
        if val:
            techs.append(val.split()[0] if " " in val else val)
    return tuple(dict.fromkeys(techs))  # de-dup, preserve order


def _looks_like(markers: tuple, svc: LiveService) -> bool:
    # Signals available without a body fetch: the final URL after redirects
    # (surfaced via the Location header when the probe saw a redirect) and any
    # auth-flavoured response headers.
    haystack = " ".join(
        [
            svc.headers.get("location", ""),
            svc.headers.get("www-authenticate", ""),
            svc.headers.get("x-app", ""),
        ]
    ).lower()
    return any(m in haystack for m in markers)


def fingerprint(services: list[LiveService]) -> list[Fingerprint]:
    """Interpret each live service. Pure; no I/O."""
    out: list[Fingerprint] = []
    for svc in services:
        tls = svc.tls or {}
        out.append(
            Fingerprint(
                service=svc,
                technologies=_technologies(svc),
                is_login_portal=_looks_like(_LOGIN_MARKERS, svc),
                is_admin_panel=_looks_like(_ADMIN_MARKERS, svc),
                tls_expired=bool(tls.get("expired")),
                tls_self_signed=bool(tls.get("self_signed")),
                # A 200 on a directory-ish response with autoindex is the classic
                # open-listing signal; we approximate with a header the probe
                # would have captured. Conservative: only true on strong signal.
                publicly_listable="index of /" in svc.headers.get("x-title", "").lower(),
            )
        )
    return out
