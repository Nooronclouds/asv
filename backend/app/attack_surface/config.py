"""Pipeline configuration.

Every network-behaviour knob lives here, in one place, for one reason: a
security scanner that touches machines it doesn't own is a liability. If the
rate limit, timeout, and concurrency ceiling are scattered across stages, you
cannot answer "how aggressive is a scan?" by reading one file -- and you will
eventually ship a stage that forgot to be polite. Centralising them makes
"stay passive" a property of the system, not of whoever remembered to pass a
timeout.

Values are read from the environment with conservative fallbacks so that a
misconfigured deploy scans *gently*, never aggressively.
"""

import os
from dataclasses import dataclass


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _float(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


@dataclass(frozen=True)
class PipelineConfig:
    # --- Concurrency & politeness -------------------------------------------
    # Max simultaneous outbound network operations across a whole scan. This is
    # the single choke point (a semaphore in each stage reads this value) that
    # bounds how hard we hit the network. Kept deliberately modest: the goal is
    # visibility, not load testing someone's infrastructure.
    max_concurrency: int = _int("ASW_MAX_CONCURRENCY", 20)

    # Per-request wall-clock ceiling. Discovery/probe targets that hang are the
    # common case (firewalls that drop packets silently), so a bounded timeout
    # is what stops one dead host from stalling the batch.
    request_timeout_s: float = _float("ASW_REQUEST_TIMEOUT_S", 8.0)

    # Optional minimum delay between requests to the *same* host, so we never
    # look like a flood to any single target even while running concurrently.
    per_host_delay_s: float = _float("ASW_PER_HOST_DELAY_S", 0.0)

    # --- Retry policy --------------------------------------------------------
    # Network failures are the norm, not the exception. We retry a small number
    # of times with backoff, but only transient errors (timeout, reset) -- a
    # DNS NXDOMAIN or a 404 is a *result*, not something to retry.
    max_retries: int = _int("ASW_MAX_RETRIES", 2)
    backoff_base_s: float = _float("ASW_BACKOFF_BASE_S", 0.5)

    # --- Discovery sources ---------------------------------------------------
    # Certificate Transparency aggregator used for passive subdomain discovery.
    # Passive = we read a public log, we do not touch the target to find these.
    crt_sh_url: str = os.environ.get("ASW_CRT_SH_URL", "https://crt.sh")

    # Wordlist size cap for active subdomain guessing. Active guessing DOES
    # touch the target's DNS, so it is bounded and off the hot path.
    max_bruteforce_labels: int = _int("ASW_MAX_BRUTEFORCE_LABELS", 200)

    # --- Probe ---------------------------------------------------------------
    # Ports we check for liveness. Small, high-signal set by default -- a full
    # 65k sweep is loud, slow, and rarely what an SME needs. Expand via env.
    probe_ports: tuple = tuple(
        int(p) for p in os.environ.get("ASW_PROBE_PORTS", "80,443,8080,8443").split(",") if p.strip()
    )

    # Identify ourselves honestly. A scanner that spoofs a browser UA to evade
    # logging is acting like an attacker; we do the opposite.
    user_agent: str = os.environ.get(
        "ASW_USER_AGENT", "ASW-AttackSurface/0.1 (+authorized-scan)"
    )


CONFIG = PipelineConfig()
