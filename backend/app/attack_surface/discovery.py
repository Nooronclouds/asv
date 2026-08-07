"""Discovery stage: seeds -> candidate assets.

Two modes, kept separate on purpose because they have different ethics and
different failure modes:

* PASSIVE (default): we read public data *about* the target without touching
  it. Certificate Transparency (crt.sh) is the workhorse -- every TLS cert ever
  issued for a domain is logged publicly, so it's the single richest source of
  "subdomains you forgot about", and querying it never sends a packet to the
  target. This is where forgotten `staging.`, `old.`, `vpn-test.` hosts surface.

* ACTIVE (bounded, opt-in): DNS bruteforce guesses common labels and asks the
  target's DNS whether they resolve. This DOES touch the target, so it is
  gated by scope, capped by `max_bruteforce_labels`, and off the hot path.

Everything DNS-related uses dnspython's async resolver so it rides the same
asyncio event loop as the HTTP work -- no separate thread pool, one concurrency
ceiling for the whole stage.

Failure modes:
* crt.sh unreachable / rate-limited / returns non-JSON -> we log-and-continue
  with whatever we have. Discovery degrading to "fewer assets" is acceptable;
  crashing the scan is not.
* NXDOMAIN / no A record -> the name simply doesn't resolve; we drop it. This
  is a *result*, not an error, so it is never retried.
* SERVFAIL / timeout -> transient; dnspython retries are bounded by our config
  via with_retries.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging

import dns.asyncresolver
import dns.exception
import dns.resolver

from .config import CONFIG
from .net import gather_bounded, make_client, with_retries
from .scope import ScopeGuard
from .types import Asset, AssetKind, Seed

# Small, high-signal default wordlist. The point isn't exhaustiveness (crt.sh
# finds the real ones); it's catching hosts that never got a public cert.
DEFAULT_LABELS = (
    "www", "dev", "staging", "test", "api", "admin", "vpn", "mail", "portal",
    "beta", "old", "legacy", "internal", "gitlab", "jenkins", "grafana", "s3",
)

_LOG = logging.getLogger(__name__)


def _wildcard_probe_name(apex: str) -> str:
    """A name under `apex` that cannot legitimately exist. Deterministic (no
    randomness available in this codebase) but improbable enough that a real
    deployment would never claim it -- so if it resolves, the domain is
    answering for *everything*, i.e. wildcard DNS."""
    h = hashlib.sha1(apex.encode()).hexdigest()[:16]
    return f"asw-nx-{h}.{apex}"


async def _detect_wildcard(apex: str, resolver: "dns.asyncresolver.Resolver") -> bool:
    """True if `apex` has wildcard DNS, which makes brute-force meaningless:
    every guessed label resolves to the same address whether or not a host
    exists. This is the bug that turned candora-v4lx.onrender.com into 17
    phantom subdomains -- Render answers *.onrender.com for any label."""
    return (await _resolve(_wildcard_probe_name(apex), resolver)) is not None


def _bruteforce_candidates(
    apexes: list[str], wildcard_apexes: set[str], scope: ScopeGuard, labels
) -> set[str]:
    """Pure candidate generator (testable without the network). Emits guessed
    names ONLY for in-scope apexes that are NOT wildcard -- guessing under
    wildcard DNS produces phantoms, so we refuse to do it."""
    out: set[str] = set()
    for apex in apexes:
        if apex in wildcard_apexes:
            continue
        if scope.allows_domain(apex):
            out |= {f"{label}.{apex}" for label in labels}
    return out


async def _resolve(name: str, resolver: dns.asyncresolver.Resolver) -> str | None:
    """Return the first A record, or None if the name doesn't resolve.

    NXDOMAIN/NoAnswer are swallowed to None (a definitive 'not there'); only
    transient failures are allowed to raise and be retried upstream.
    """
    try:
        answer = await with_retries(lambda: resolver.resolve(name, "A"))
        return answer[0].address if answer else None
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers):
        return None
    except dns.exception.DNSException:
        # Timeout/SERVFAIL survived retries -> treat as unresolved rather than
        # aborting; the asset just won't carry an IP.
        return None


async def _passive_ct(apex: str, client) -> set[str]:
    """Pull subdomains from Certificate Transparency via crt.sh.

    Returns a set of names (possibly empty). Never raises: a discovery source
    being down must not fail the scan.
    """
    url = f"{CONFIG.crt_sh_url}/?q=%25.{apex}&output=json"
    try:
        resp = await with_retries(lambda: client.get(url))
        if resp.status_code != 200:
            return set()
        rows = json.loads(resp.text)
    except Exception:  # noqa: BLE001 -- a discovery source is best-effort by design
        return set()

    names: set[str] = set()
    for row in rows:
        # crt.sh returns newline-separated SANs in name_value; wildcards are
        # not assets we can probe, so strip the leading "*." rather than keep it.
        for n in str(row.get("name_value", "")).splitlines():
            n = n.strip().lower().lstrip("*.").rstrip(".")
            if n and "@" not in n:  # skip email SANs
                names.add(n)
    return names


async def discover(
    seeds: list[Seed], scope: ScopeGuard, *, active: bool = False
) -> list[Asset]:
    """Run discovery. Returns a de-duplicated list of resolvable Assets.

    Out-of-scope names that surface from CT are still *reported* (they're useful
    intelligence -- e.g. a shadow domain), but marked so the probe stage will
    refuse to touch them. Nothing here sends traffic to an out-of-scope host.
    """
    resolver = dns.asyncresolver.Resolver()
    resolver.lifetime = CONFIG.request_timeout_s

    domain_seeds = [s.value.lower().rstrip(".") for s in seeds if s.kind in
                    (AssetKind.DOMAIN, AssetKind.SUBDOMAIN)]

    candidates: set[str] = set(domain_seeds)

    async with make_client() as client:
        # 1) Passive CT expansion for each apex seed (concurrent).
        ct_results = await gather_bounded(
            domain_seeds, lambda apex: _passive_ct(apex, client)
        )
        for _apex, names, _err in ct_results:
            if names:
                candidates |= names

        # 2) Optional active bruteforce, scope-gated, capped, and -- critically --
        #    disabled for wildcard-DNS apexes. We probe each apex for wildcard
        #    behaviour first; guessing under wildcard DNS only manufactures
        #    phantoms.
        if active:
            labels = DEFAULT_LABELS[: CONFIG.max_bruteforce_labels]
            wc = await gather_bounded(
                domain_seeds, lambda apex: _detect_wildcard(apex, resolver)
            )
            wildcard_apexes = {apex for apex, is_wc, _err in wc if is_wc}
            for apex in wildcard_apexes:
                _LOG.warning(
                    "wildcard DNS detected for %s; skipping brute-force "
                    "(guessed subdomains would be false positives)", apex
                )
            candidates |= _bruteforce_candidates(
                domain_seeds, wildcard_apexes, scope, labels
            )

        # 3) Resolve everything concurrently; keep only names that resolve.
        resolved = await gather_bounded(
            candidates, lambda name: _resolve(name, resolver)
        )

    assets: list[Asset] = []
    for name, ip, _err in resolved:
        if ip is None:
            continue
        kind = AssetKind.DOMAIN if name in domain_seeds else AssetKind.SUBDOMAIN
        source = "seed" if name in domain_seeds else "ct/bruteforce"
        assets.append(Asset(value=name, kind=kind, source=source, resolved_ip=ip))

    return assets
