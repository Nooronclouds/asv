# Attack Surface Pipeline

External, mostly-passive attack-surface discovery for a set of authorized seeds.
It turns a few root domains into a **ranked, explainable list of internet-visible
exposures**, and tracks what changes between scans.

```
seeds ─► discovery ─► probe ─► fingerprint ─► scoring ─► datastore ─► diff
```

This module lives inside the Vanguard backend and reuses its FastAPI app,
SQLAlchemy `Base`, and auth. It is self-contained under
`backend/app/attack_surface/`.

---

## Why it exists

Small teams accumulate forgotten subdomains, abandoned staging boxes, and
misconfigured TLS faster than they can track. Attackers find these during
recon. This pipeline runs that same recon **against your own authorized assets**
so you find the forgotten door first. It observes and fingerprints — it does not
exploit.

---

## Design in one screen

Every stage is a **pure, forward-only function** that passes plain dataclasses
(`types.py`), never ORM rows. Only the orchestrator touches the database. This
keeps each stage unit-testable with literals and makes a partial/failed scan
recoverable.

| File | Stage | Responsibility |
|------|-------|----------------|
| `config.py` | — | All network-aggression knobs (timeouts, concurrency, ports). One place, gentle defaults. |
| `scope.py` | gate | **The single authorization gate.** Default-deny. Nothing outside scope is ever touched. |
| `net.py` | — | Shared concurrency primitive: `asyncio` + one semaphore (rate limit) + bounded retries + `httpx`. |
| `discovery.py` | discover | seeds → assets, via Certificate Transparency (passive) and optional DNS brute-force (active). Skips brute-force on wildcard-DNS domains. |
| `probe.py` | probe | assets → live services. Confirms liveness, grabs headers + TLS cert. Rejects platform placeholder/error responses. |
| `fingerprint.py` | fingerprint | Interprets raw facts (tech, login/admin surface, TLS health). Pure, no I/O. |
| `scoring.py` | score | Rules → ranked findings, worst-first. De-duplicated per host. |
| `diff.py` | diff | This run vs. the previous completed run → added / removed / persisting. |
| `orchestrator.py` | run | The one integration point: runs the async pipeline, persists, diffs. |
| `models.py` | store | SQLAlchemy tables (`asw_*`), snapshot-stamped for change detection. |

**Concurrency:** the work is I/O-bound, so we use `asyncio` (not threads or
multiprocessing) with a single `Semaphore` as the global rate limiter. Errors
are returned as values, never raised out of a batch — one dead host cannot abort
a scan of thousands.

---

## HTTP API (what the UI calls)

All endpoints require the same bearer auth as the rest of the suite
(`Authorization: Bearer <token>` from `/login`). Results are scoped per user.

### `POST /api/attack-surface/scan`
Run a scan synchronously and return its result.

**Request body**
```json
{
  "seeds": ["example.com"],
  "authorized_domains": ["example.com"],
  "authorized_ip_ranges": ["203.0.113.0/24"],
  "active": false
}
```
- `seeds` — root domains to expand from. **Required.**
- `authorized_domains` / `authorized_ip_ranges` — the scope. **Nothing outside
  this is ever contacted.** An empty scope is rejected (400).
- `active` — if `true`, also runs DNS brute-force (auto-disabled on wildcard-DNS
  domains). Default `false`.

**Response**
```json
{
  "run_id": 12,
  "counts": { "assets": 1, "services": 2, "findings": 0 },
  "delta": { "added": 0, "removed": 0, "persisting": 0 },
  "new_findings": [
    { "asset": "staging.example.com", "title": "...", "severity": "info" }
  ],
  "findings": [
    { "asset": "example.com", "title": "...", "severity": "high", "rationale": "..." }
  ]
}
```
`severity` is one of `critical | high | medium | low | info` (already sorted
worst-first in `findings`).

### `GET /api/attack-surface/runs`
Last 50 scan runs for the current user: `id`, `status`, `started_at`,
`finished_at`, `stats` (JSON).

### `GET /api/attack-surface/findings`
All current findings for the user, worst-first:
`asset`, `title`, `severity`, `rationale`, `first_seen`, `last_seen`.

> **UI note:** `first_seen == the latest run` means "new this scan" — a natural
> filter for a "what changed" view. `delta` on the scan response gives the same
> signal at a glance.

---

## Configuration

All optional; sensible, gentle defaults. Set in `backend/.env`.

| Env var | Default | Meaning |
|---------|---------|---------|
| `ASW_MAX_CONCURRENCY` | `20` | Max simultaneous outbound network ops (the rate ceiling). |
| `ASW_REQUEST_TIMEOUT_S` | `8.0` | Per-request timeout. Raise if you see transient drops on slow hosts. |
| `ASW_MAX_RETRIES` | `2` | Retries for *transient* errors only. |
| `ASW_PROBE_PORTS` | `80,443,8080,8443` | Ports probed for liveness. |
| `ASW_MAX_BRUTEFORCE_LABELS` | `200` | Cap on active subdomain guesses. |
| `ASW_USER_AGENT` | `ASW-AttackSurface/0.1 (+authorized-scan)` | Honest UA — we do not spoof browsers. |

---

## Run it locally

```bash
cd backend
pip install -r requirements.txt

# Run the test suite (offline, deterministic):
python -m pytest tests/test_attack_surface_fixes.py -v
```

Trigger a scan against the FastAPI app once it's running (`uvicorn app.main:app`),
or drive the orchestrator directly against SQLite for a quick check:

```python
from app.db.database import Base, engine, SessionLocal
import app.attack_surface.models          # registers asw_* tables
from app.attack_surface import orchestrator
from app.attack_surface.types import Seed, AssetKind

Base.metadata.create_all(bind=engine)
db = SessionLocal()
print(orchestrator.run_scan(
    db, owner_id="you",
    seeds=[Seed("example.com", AssetKind.DOMAIN)],
    domains=["example.com"], ip_ranges=[], active=True,
))
```

> Only scan assets you are authorized to scan. `scanme.nmap.org` is a public
> test target the Nmap project provides for exactly this.

---

## Extending it

- **Add a detection rule:** append a small function to `RULES` in `scoring.py`.
  It takes a `Fingerprint`, returns at most one `Finding` (with a mandatory
  plain-language `rationale`), or `None`. Nothing else changes.
- **Add a discovery source:** add a passive collector alongside `_passive_ct`
  in `discovery.py` and union its names into `candidates`.
- **Add a probe signal:** capture more from the response in `probe.py`
  (facts only — interpretation belongs in `fingerprint.py`).

**Invariant to respect:** in `orchestrator.run_scan`, `_load_previous_findings`
must be called *before* the upsert loop — upsert moves `run_id` forward, so
loading previous findings after it would return nothing and break change
detection. There is a comment at the call site; don't reorder it.

---

## Known limitations (good first upgrades)

- **HTTP surface only.** Probes the configured HTTP(S) ports; no full port sweep,
  no non-HTTP services (SSH, DB, etc.).
- **Synchronous scans.** `run_scan` blocks the request. Large scopes should move
  to a background task/queue (a natural next PR).
- **Heuristic fingerprints.** Login/admin detection is header/redirect-based, not
  a full fingerprint DB — best-effort by design.
- **Platform-edge noise.** On PaaS hosts (Render/Vercel), edge `403`s on unused
  ports still count as "live". They attach to the real host (not phantoms), but
  could be filtered further via `_DEAD_STATUSES` in `probe.py`.
