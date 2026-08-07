"""Regression tests pinning the three false-positive fixes found scanning a
Render-hosted target (wildcard DNS + platform placeholder responses).

All tests are pure/offline -- they exercise the decision logic directly with
stubs, so they are deterministic and cannot flake on network conditions.

Run: pytest backend/tests/test_attack_surface_fixes.py
"""

import asyncio
import os
import sys

# The attack_surface stages under test import only config/net/scope/types (no
# DB), but importing the package touches app.* -- make the backend importable.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import dns.resolver  # noqa: E402

from app.attack_surface import discovery, probe, scoring  # noqa: E402
from app.attack_surface.scope import ScopeGuard  # noqa: E402
from app.attack_surface.types import (  # noqa: E402
    Asset, AssetKind, Fingerprint, LiveService,
)


# --------------------------------------------------------------------------
# Bug 1: wildcard DNS -> brute-force must be suppressed for that apex.
# --------------------------------------------------------------------------
class _WildcardResolver:
    """Resolves *everything* -- models Render's *.onrender.com wildcard."""
    async def resolve(self, name, rdtype):
        class _A:  # minimal stand-in for a dnspython A record
            address = "216.24.57.7"
        return [_A()]


class _NormalResolver:
    """Resolves nothing -> a made-up label is NXDOMAIN (no wildcard)."""
    async def resolve(self, name, rdtype):
        raise dns.resolver.NXDOMAIN()


def test_detect_wildcard_true_when_nonexistent_label_resolves():
    got = asyncio.run(discovery._detect_wildcard("candora-v4lx.onrender.com",
                                                 _WildcardResolver()))
    assert got is True


def test_detect_wildcard_false_on_normal_domain():
    got = asyncio.run(discovery._detect_wildcard("example.com", _NormalResolver()))
    assert got is False


def test_bruteforce_skips_wildcard_apex():
    scope = ScopeGuard.from_operator_input(["wild.onrender.com", "real.com"], [])
    labels = ("admin", "vpn", "staging")
    # wild.onrender.com is wildcard -> zero guesses; real.com -> full set.
    out = discovery._bruteforce_candidates(
        ["wild.onrender.com", "real.com"],
        wildcard_apexes={"wild.onrender.com"},
        scope=scope,
        labels=labels,
    )
    assert not any(name.endswith(".wild.onrender.com") for name in out)
    assert out == {f"{l}.real.com" for l in labels}


def test_bruteforce_respects_scope():
    scope = ScopeGuard.from_operator_input(["real.com"], [])  # other.com NOT in scope
    out = discovery._bruteforce_candidates(
        ["real.com", "other.com"], set(), scope, ("admin",)
    )
    assert out == {"admin.real.com"}


# --------------------------------------------------------------------------
# Bug 2: platform placeholder / gateway responses are not "live services".
# --------------------------------------------------------------------------
def test_placeholder_and_error_statuses_are_not_live():
    for dead in (530, 502, 503, 504, 404, 500, 522):
        assert probe._is_live(dead) is False, f"{dead} must not count as live"


def test_real_responses_are_live():
    for alive in (200, 204, 301, 302, 401, 403, 405):
        assert probe._is_live(alive) is True, f"{alive} should count as live"


def test_no_response_is_not_live():
    assert probe._is_live(None) is False


# --------------------------------------------------------------------------
# Bug 3: one host with multiple live ports -> one finding, not one per port.
# --------------------------------------------------------------------------
def _fp_for_port(port: int) -> Fingerprint:
    asset = Asset("api.example.com", AssetKind.SUBDOMAIN, "ct/bruteforce", "10.0.0.1")
    scheme = "https" if port in (443, 8443) else "http"
    svc = LiveService(asset, "10.0.0.1", port, scheme, 200, {}, {}, 5.0)
    return Fingerprint(service=svc)


def test_forgotten_host_deduped_across_ports():
    # Same host, two live ports -> the "previously-unlisted host" INFO rule
    # would fire twice without dedup.
    findings = scoring.score([_fp_for_port(80), _fp_for_port(8080)])
    forgotten = [f for f in findings
                 if f.title == "Previously-unlisted live host discovered"]
    assert len(forgotten) == 1, f"expected 1 host finding, got {len(forgotten)}"


def test_distinct_hosts_still_each_reported():
    fp_a = _fp_for_port(80)
    other = Asset("dev.example.com", AssetKind.SUBDOMAIN, "ct/bruteforce", "10.0.0.2")
    fp_b = Fingerprint(service=LiveService(other, "10.0.0.2", 80, "http", 200, {}, {}, 5.0))
    findings = scoring.score([fp_a, fp_b])
    hosts = {f.asset_value for f in findings
             if f.title == "Previously-unlisted live host discovered"}
    assert hosts == {"api.example.com", "dev.example.com"}
