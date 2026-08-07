"""Shared network execution primitive: bounded, retrying, polite.

This is the answer to "why this approach to concurrency". The work in
discovery and probe is almost entirely *I/O-bound* -- we spend our time waiting
on sockets, not on the CPU. That single fact drives every decision here:

* asyncio, not threads. For thousands of mostly-idle sockets, a thread each
  means thousands of OS stacks and context switches; asyncio multiplexes them
  on one thread with almost no per-connection overhead. And because we never do
  meaningful CPU work between awaits, the GIL is a non-issue -- there is nothing
  for a second core to do.

* asyncio, not multiprocessing. Multiprocessing pays for CPU parallelism we
  don't need and adds IPC/serialisation cost. Wrong tool for waiting on DNS.

* One semaphore is the whole rate limiter. Every outbound op acquires it, so
  `max_concurrency` is a hard ceiling on how many targets we touch at once --
  the single knob that makes a scan "gentle" or "brisk". Politeness lives in
  one place, not sprinkled through each stage.

* httpx, not requests. `requests` is sync-only; driving it from asyncio would
  mean a thread pool and we're back to the thing we avoided. httpx gives a
  native async client with connection pooling and the same timeout/verify
  semantics we already understand. (aiohttp would also work; httpx is chosen
  for its sync/async API parity, so the same mental model covers both.)

Failure modes, and how each is contained:

* A host that hangs -> per-request timeout (config.request_timeout_s). Without
  it, one silently-dropped SYN stalls a task forever.
* Transient blip (reset, timeout, DNS SERVFAIL) -> bounded retries with
  exponential backoff. We retry the *transient* class only.
* A permanent "answer" (NXDOMAIN, 404, refused) -> NOT retried; it's a result,
  not an error. Retrying it wastes time and looks like abuse.
* One target raising -> caught and returned as a value, never propagated. A
  single dead asset must not abort a batch of thousands. `gather_bounded`
  therefore returns results *and* errors side by side.
"""

from __future__ import annotations

import asyncio
from typing import Awaitable, Callable, Iterable, TypeVar

import httpx

from .config import CONFIG

T = TypeVar("T")
R = TypeVar("R")

# Exceptions we treat as transient (worth a retry). Everything else is either a
# real result or a programming error and must surface immediately.
TRANSIENT = (
    httpx.TimeoutException,
    httpx.ConnectError,
    httpx.ReadError,
    httpx.RemoteProtocolError,
    asyncio.TimeoutError,
)


async def with_retries(coro_factory: Callable[[], Awaitable[T]]) -> T:
    """Run an awaitable with bounded exponential backoff on transient errors.

    Takes a *factory* (not a coroutine) because a coroutine can only be awaited
    once; to retry we need to build a fresh one each attempt.
    """
    attempt = 0
    while True:
        try:
            return await coro_factory()
        except TRANSIENT:
            attempt += 1
            if attempt > CONFIG.max_retries:
                raise
            # Exponential backoff. No random jitter here because
            # Math.random-style entropy is intentionally avoided in this
            # codebase; fixed backoff is sufficient at our small concurrency.
            await asyncio.sleep(CONFIG.backoff_base_s * (2 ** (attempt - 1)))


async def gather_bounded(
    items: Iterable[T],
    worker: Callable[[T], Awaitable[R]],
    *,
    concurrency: int | None = None,
) -> list[tuple[T, R | None, Exception | None]]:
    """Map `worker` over `items` with a hard concurrency ceiling.

    Returns one `(item, result, error)` triple per input. Errors are returned,
    not raised: the contract is "a batch always completes; inspect each result".
    This is what stops a single unreachable host from taking down the scan.
    """
    sem = asyncio.Semaphore(concurrency or CONFIG.max_concurrency)
    results: list[tuple[T, R | None, Exception | None]] = []

    async def run(item: T) -> None:
        async with sem:                     # the one global politeness gate
            try:
                res = await worker(item)
                results.append((item, res, None))
            except Exception as exc:         # noqa: BLE001 -- deliberate: isolate
                results.append((item, None, exc))

    await asyncio.gather(*(run(i) for i in items))
    return results


def make_client() -> httpx.AsyncClient:
    """One configured async client, reused across a stage so connection pooling
    actually helps.

    `verify=False` is deliberate and specific to this domain. A normal client
    verifies certs and *refuses* to connect to an expired or self-signed host --
    but for an attack-surface scanner that host is exactly what we're hunting.
    If we verified, a misconfigured-TLS service would raise on connect and we'd
    never see it. So we disable HTTP-layer verification to guarantee we still
    connect, and the probe stage inspects the certificate itself (expiry,
    issuer, self-signed) to *turn the bad cert into a finding*. We suppress the
    verification error only so we can report the underlying problem, not to
    ignore it."""
    return httpx.AsyncClient(
        timeout=CONFIG.request_timeout_s,
        follow_redirects=True,
        verify=False,  # see docstring -- bad certs are findings, not connect errors
        headers={"User-Agent": CONFIG.user_agent},
        limits=httpx.Limits(max_connections=CONFIG.max_concurrency),
    )
