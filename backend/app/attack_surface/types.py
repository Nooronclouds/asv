"""Data contracts passed between pipeline stages.

Why plain dataclasses instead of the SQLAlchemy models in `models.py`?

Because a stage should be a pure function: `discover(seeds) -> [Asset]`,
`probe(assets) -> [LiveService]`. If stages passed ORM objects around they
would drag a live DB session through the whole async fan-out (ORM instances
are bound to a session and are not safe to share across tasks/threads), and
you could not unit-test `probe()` without standing up a database.

So the network stages traffic in these frozen, session-free structs. Only the
orchestrator translates them to/from ORM rows at the persistence boundary.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class AssetKind(str, Enum):
    DOMAIN = "domain"
    SUBDOMAIN = "subdomain"
    IP = "ip"
    BUCKET = "bucket"


class Severity(str, Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass(frozen=True)
class Seed:
    """An authorized starting point for a scan."""
    value: str
    kind: AssetKind


@dataclass(frozen=True)
class Asset:
    """Something discovered that may be worth probing.

    `source` records *how* we found it (e.g. "crt.sh", "dns", "bruteforce")
    because provenance matters for trust: a name from Certificate Transparency
    is evidence of a real cert; a name from guessing is only a hypothesis until
    the probe stage confirms it resolves and responds.
    """
    value: str
    kind: AssetKind
    source: str
    resolved_ip: Optional[str] = None


@dataclass(frozen=True)
class LiveService:
    """A confirmed reachable service on an asset."""
    asset: Asset
    ip: str
    port: int
    scheme: str            # "http" | "https"
    # Raw observations the fingerprint stage will interpret. Kept as loose data
    # on purpose -- the probe reports facts, it does not judge them.
    status_code: Optional[int] = None
    headers: dict = field(default_factory=dict)
    tls: dict = field(default_factory=dict)         # cert subject, expiry, issuer
    latency_ms: Optional[float] = None
    error: Optional[str] = None                     # set when probe failed


@dataclass(frozen=True)
class Fingerprint:
    """The interpreted identity of a live service."""
    service: LiveService
    technologies: tuple = ()       # e.g. ("nginx/1.18", "php")
    is_login_portal: bool = False
    is_admin_panel: bool = False
    tls_expired: bool = False
    tls_self_signed: bool = False
    publicly_listable: bool = False   # e.g. open bucket / directory listing


@dataclass(frozen=True)
class Finding:
    """A scored exposure -- the pipeline's actual output."""
    asset_value: str
    title: str
    severity: Severity
    rationale: str                 # plain-language "why this is risky"
    evidence: dict = field(default_factory=dict)
