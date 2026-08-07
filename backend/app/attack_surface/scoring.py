"""Scoring stage: fingerprints -> ranked findings.

This is the stage that earns the product. Discovery and probe produce a pile of
facts; scoring decides which of them a small team should actually care about,
and in what order. The output is the pipeline's real deliverable: a list of
findings sorted worst-first, each with a plain-language reason a non-specialist
can act on.

Design choices:

* Rules are a list of small, independent functions, each returning at most one
  Finding. Adding a check is appending a function -- no giant if/elif to edit,
  nothing existing to break. This mirrors the "many small modules" principle at
  the function level.

* Every rule must supply a `rationale`: the human-readable "why this is risky".
  A severity with no explanation is noise; triage dies on unexplained findings.
  Making rationale non-optional is a design constraint, not a nicety.

* Severity is an ordered enum so sorting is total and deterministic. Two runs
  over the same input produce byte-identical ordering -- important because the
  diff engine compares runs and we don't want spurious churn from unstable sort.

* Pure and side-effect free. Scoring never writes to the DB or the network, so
  we can re-score historical fingerprints under a tightened ruleset.
"""

from __future__ import annotations

from typing import Callable, Optional

from .types import Finding, Fingerprint, Severity

# Rank for sorting. Higher = worse = shown first.
_RANK = {
    Severity.CRITICAL: 4,
    Severity.HIGH: 3,
    Severity.MEDIUM: 2,
    Severity.LOW: 1,
    Severity.INFO: 0,
}

Rule = Callable[[Fingerprint], Optional[Finding]]


def _rule_exposed_admin(fp: Fingerprint) -> Optional[Finding]:
    if not fp.is_admin_panel:
        return None
    svc = fp.service
    # Admin over plaintext http is worse than over https.
    sev = Severity.HIGH if svc.scheme == "https" else Severity.CRITICAL
    return Finding(
        asset_value=svc.asset.value,
        title="Administrative interface exposed to the internet",
        severity=sev,
        rationale=(
            "An admin/console surface is reachable from the public internet. "
            "These are prime targets for credential-stuffing and default-password "
            "attacks; they should sit behind a VPN or IP allow-list."
            + ("" if svc.scheme == "https" else " It is served over plaintext HTTP, "
               "so credentials can also be intercepted in transit.")
        ),
        evidence={"url": f"{svc.scheme}://{svc.asset.value}:{svc.port}/",
                  "status": svc.status_code},
    )


def _rule_login_plaintext(fp: Fingerprint) -> Optional[Finding]:
    svc = fp.service
    if not (fp.is_login_portal and svc.scheme == "http"):
        return None
    return Finding(
        asset_value=svc.asset.value,
        title="Login form served over plaintext HTTP",
        severity=Severity.HIGH,
        rationale=(
            "A sign-in surface is served without TLS, so submitted credentials "
            "travel in cleartext and can be captured on any intermediate network."
        ),
        evidence={"url": f"http://{svc.asset.value}:{svc.port}/"},
    )


def _rule_tls_expired(fp: Fingerprint) -> Optional[Finding]:
    if not fp.tls_expired:
        return None
    svc = fp.service
    return Finding(
        asset_value=svc.asset.value,
        title="Expired TLS certificate",
        severity=Severity.MEDIUM,
        rationale=(
            "The certificate has expired. Beyond breaking trust for users, an "
            "expired cert usually signals an unmaintained or forgotten host -- "
            "exactly the kind of drift that hides bigger problems."
        ),
        evidence={"not_after": (svc.tls or {}).get("not_after")},
    )


def _rule_tls_self_signed(fp: Fingerprint) -> Optional[Finding]:
    if not fp.tls_self_signed or fp.tls_expired:  # don't double-report a dead cert
        return None
    svc = fp.service
    return Finding(
        asset_value=svc.asset.value,
        title="Self-signed TLS certificate",
        severity=Severity.LOW,
        rationale=(
            "The certificate is self-signed, so clients cannot verify the host's "
            "identity. Common on test/staging boxes that were never meant to be "
            "public -- worth confirming this host is supposed to exist."
        ),
        evidence={"issuer": (svc.tls or {}).get("issuer")},
    )


def _rule_open_listing(fp: Fingerprint) -> Optional[Finding]:
    if not fp.publicly_listable:
        return None
    svc = fp.service
    return Finding(
        asset_value=svc.asset.value,
        title="Directory listing / public index exposed",
        severity=Severity.MEDIUM,
        rationale=(
            "The server returns a browsable file index. Directory listings leak "
            "file names and structure and frequently expose backups or configs."
        ),
        evidence={"url": f"{svc.scheme}://{svc.asset.value}:{svc.port}/"},
    )


def _rule_forgotten_host(fp: Fingerprint) -> Optional[Finding]:
    # Informational: a live service on a non-seed subdomain is inventory the
    # owner may not know about. Low severity but high value as a starting point.
    svc = fp.service
    if svc.asset.source == "seed":
        return None
    return Finding(
        asset_value=svc.asset.value,
        title="Previously-unlisted live host discovered",
        severity=Severity.INFO,
        rationale=(
            "This live host was found via passive/active discovery rather than "
            "from your seed list. Confirm it is a known, intended asset; "
            "forgotten hosts are the most common source of surprise exposure."
        ),
        evidence={"source": svc.asset.source, "ip": svc.ip,
                  "port": svc.port, "tech": list(fp.technologies)},
    )


# The ruleset. Append here to add a check.
RULES: tuple[Rule, ...] = (
    _rule_exposed_admin,
    _rule_login_plaintext,
    _rule_tls_expired,
    _rule_tls_self_signed,
    _rule_open_listing,
    _rule_forgotten_host,
)


def score(fingerprints: list[Fingerprint]) -> list[Finding]:
    """Apply every rule to every fingerprint; return findings, worst-first.

    Findings are de-duplicated by identity `(asset_value, title)`. A host with
    several live services (e.g. ports 80 and 8080) yields one fingerprint per
    service, so a host-level rule like "previously-unlisted host" would
    otherwise emit the same finding once per port. We collapse to one finding
    per problem-per-host, matching the identity the diff engine uses -- so a
    two-port host reports one issue, not two.
    """
    findings: list[Finding] = []
    seen: set = set()
    for fp in fingerprints:
        for rule in RULES:
            f = rule(fp)
            if f is None:
                continue
            key = (f.asset_value, f.title)
            if key in seen:
                continue
            seen.add(key)
            findings.append(f)
    # Deterministic ordering: severity desc, then asset for stable ties.
    findings.sort(key=lambda f: (-_RANK[f.severity], f.asset_value, f.title))
    return findings
