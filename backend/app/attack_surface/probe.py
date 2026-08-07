"""Probe stage: assets -> live services (facts only).

This is the first stage that sends traffic *directly* to the target, so it is
where the scope gate is enforced hardest: every asset is checked against the
ScopeGuard and silently skipped if out of scope. Discovery may have surfaced an
out-of-scope shadow domain as intelligence; the probe refuses to touch it. One
gate, checked here, at the exact moment before we open a socket.

The probe deliberately only *observes*. It records status codes, response
headers, and the raw TLS certificate. It does not decide whether an expired
cert or an exposed `/admin` is bad -- that judgment belongs to the fingerprint
and scoring stages. Keeping "gather facts" and "interpret facts" separate means
we can re-score historical scans against new rules without re-probing anyone.

Concurrency: reuses `gather_bounded`, so a scan of thousands of (asset, port)
pairs runs under the same single concurrency ceiling as discovery.

Failure modes:
* Connection refused / RST -> the port is closed; not a service. Dropped, not
  retried (a refusal is a definitive answer).
* Timeout -> retried a bounded number of times, then the (asset, port) is
  dropped. A firewall that blackholes SYNs must not stall the batch.
* TLS handshake failure on :443 -> we still record the HTTP-level result if any;
  a broken cert is captured where possible and becomes a finding downstream.
"""

from __future__ import annotations

import asyncio
import ssl
from datetime import datetime, timezone

from .config import CONFIG
from .net import gather_bounded, make_client, with_retries
from .scope import ScopeGuard
from .types import Asset, LiveService

# Statuses that mean "no application is actually served here". A hostname on a
# wildcard/platform domain (Render, Vercel, Cloudflare) answers on the shared
# edge even when nothing is deployed, returning a placeholder or gateway error.
# HTTP 530 is Render's "no service for this host"; 5xx are gateway errors; 404
# on the bare "/" is "nothing here". Counting any of these as a live service is
# exactly what turned 17 phantom subdomains into "live" hosts. A response in
# this set does NOT confirm a service.
_DEAD_STATUSES = frozenset({404, 500, 502, 503, 504, 508, 520, 521, 522, 523, 525, 530})


def _is_live(status_code: "int | None") -> bool:
    """A service is confirmed live only if it returned a status that implies a
    real handler responded. We keep 2xx/3xx and auth/method signals like
    401/403/405 (those imply something is really there, guarding content), and
    reject not-found and server/gateway errors."""
    if status_code is None:
        return False
    return status_code not in _DEAD_STATUSES


async def _fetch_tls(host: str, port: int) -> dict:
    """Open a TLS connection and extract cert facts without verifying it.

    We disable verification on purpose (see net.make_client): the whole point is
    to inspect certs that a normal client would reject. We pull the DER bytes and
    parse the minimum we need -- issuer, subject, validity window -- using the
    `cryptography` library, which is the standard, well-audited X.509 parser.
    Returns {} on any failure; a missing cert is simply the absence of TLS facts.
    """
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port, ssl=ctx),
            timeout=CONFIG.request_timeout_s,
        )
    except (OSError, asyncio.TimeoutError, ssl.SSLError):
        return {}

    try:
        der = writer.get_extra_info("ssl_object").getpeercert(binary_form=True)
    except Exception:  # noqa: BLE001
        der = None
    finally:
        writer.close()
        try:
            await writer.wait_closed()
        except Exception:  # noqa: BLE001 -- close errors are not our concern
            pass

    if not der:
        return {}

    try:
        from cryptography import x509

        cert = x509.load_der_x509_certificate(der)
        not_after = cert.not_valid_after_utc
        return {
            "issuer": cert.issuer.rfc4514_string(),
            "subject": cert.subject.rfc4514_string(),
            "not_after": not_after.isoformat(),
            "expired": not_after < datetime.now(timezone.utc),
            "self_signed": cert.issuer == cert.subject,
        }
    except Exception:  # noqa: BLE001 -- unparseable cert -> no TLS facts
        return {}


async def _probe_one(asset: Asset, port: int, client) -> LiveService | None:
    """Probe a single (asset, port). Returns a LiveService or None if closed."""
    scheme = "https" if port in (443, 8443) else "http"
    url = f"{scheme}://{asset.value}:{port}/"
    loop = asyncio.get_event_loop()
    start = loop.time()

    try:
        resp = await with_retries(lambda: client.get(url))
    except Exception:  # noqa: BLE001 -- closed/unreachable port is not a service
        return None

    # Reject platform placeholders / gateway errors: a reply is not proof of a
    # service. This is what stops wildcard-hosted phantom names from registering.
    if not _is_live(resp.status_code):
        return None

    latency_ms = (loop.time() - start) * 1000.0
    tls = await _fetch_tls(asset.value, port) if scheme == "https" else {}

    return LiveService(
        asset=asset,
        ip=asset.resolved_ip or "",
        port=port,
        scheme=scheme,
        status_code=resp.status_code,
        headers={k.lower(): v for k, v in resp.headers.items()},
        tls=tls,
        latency_ms=latency_ms,
    )


async def probe(assets: list[Asset], scope: ScopeGuard) -> list[LiveService]:
    """Probe every in-scope asset across the configured ports.

    The scope check happens here, once, immediately before work is scheduled.
    An out-of-scope asset produces zero network traffic.
    """
    targets: list[tuple[Asset, int]] = []
    for asset in assets:
        # THE gate: refuse anything not explicitly authorized.
        if not scope.allows_domain(asset.value):
            continue
        # Defence against DNS-based scope escape: if the operator declared IP
        # ranges, an in-scope *name* that resolves to an IP outside those ranges
        # is not ours to probe (someone could point their DNS at a third party).
        # If no CIDRs were declared, domain scope alone governs.
        if scope.cidrs and asset.resolved_ip and not scope.allows_ip(asset.resolved_ip):
            continue
        for port in CONFIG.probe_ports:
            targets.append((asset, port))

    async with make_client() as client:
        results = await gather_bounded(
            targets, lambda t: _probe_one(t[0], t[1], client)
        )

    live: list[LiveService] = []
    for _target, svc, _err in results:
        if svc is not None:
            live.append(svc)
    return live
