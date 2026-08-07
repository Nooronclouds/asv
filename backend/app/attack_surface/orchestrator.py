"""Orchestrator: run the pipeline, persist, diff. The one integration point.

Everything else is a pure stage. This module is where the messy real-world
concerns live, deliberately concentrated so the stages stay clean:

* The async<->sync boundary. The network stages are async; the datastore is
  sync SQLAlchemy. We cross that line exactly once, here: `asyncio.run(...)`
  drives the whole discover->probe->fingerprint->score chain to completion and
  hands back plain dataclasses, then we persist them synchronously. No stage
  owns an event loop; no stage owns a DB session. Nesting event loops or
  opening one per stage is the classic way to get "loop already running"
  errors -- one boundary avoids all of it.

* Scope is built once and threaded through. The operator's authorization is
  turned into a single ScopeGuard at the top and passed to every stage. There
  is no second place scope can be defined, so there is no second place it can
  be defined *wrong*.

* Snapshot persistence with upsert. Assets/services/findings are keyed by
  stable identity; a row seen again keeps its original `first_seen` and only
  bumps `last_seen`. That preserves the history the diff engine and the "new
  this week" query rely on.

Failure handling: if the async pipeline raises, the run is marked "failed" and
the exception recorded, but partial results already persisted stay -- a scan
that dies in probe still leaves you the assets discovery found.
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime

from sqlalchemy.orm import Session

from . import discovery, fingerprint, probe, scoring
from .diff import diff_findings
from .models import AssetRow, FindingRow, ScanRun, ServiceRow
from .scope import ScopeGuard
from .types import Asset, Finding, LiveService, Seed


async def _run_pipeline(
    seeds: list[Seed], scope: ScopeGuard, active: bool
) -> tuple[list[Asset], list[LiveService], list[Finding]]:
    """The pure async chain. Returns everything the orchestrator will persist."""
    assets = await discovery.discover(seeds, scope, active=active)
    services = await probe.probe(assets, scope)
    fingerprints = fingerprint.fingerprint(services)
    findings = scoring.score(fingerprints)
    return assets, services, findings


def _upsert_asset(db: Session, owner_id, run_id, asset: Asset, now: datetime) -> None:
    row = (
        db.query(AssetRow)
        .filter(AssetRow.owner_id == owner_id, AssetRow.value == asset.value)
        .one_or_none()
    )
    if row is None:
        db.add(AssetRow(
            owner_id=owner_id, run_id=run_id, value=asset.value,
            kind=asset.kind.value, source=asset.source,
            resolved_ip=asset.resolved_ip, first_seen=now, last_seen=now,
        ))
    else:
        row.last_seen = now
        row.run_id = run_id
        row.resolved_ip = asset.resolved_ip or row.resolved_ip


def _upsert_finding(db: Session, owner_id, run_id, f: Finding, now: datetime) -> None:
    row = (
        db.query(FindingRow)
        .filter(
            FindingRow.owner_id == owner_id,
            FindingRow.asset_value == f.asset_value,
            FindingRow.title == f.title,
        )
        .one_or_none()
    )
    if row is None:
        db.add(FindingRow(
            owner_id=owner_id, run_id=run_id, asset_value=f.asset_value,
            title=f.title, severity=f.severity.value, rationale=f.rationale,
            evidence=json.dumps(f.evidence), first_seen=now, last_seen=now,
        ))
    else:
        row.last_seen = now
        row.run_id = run_id
        row.severity = f.severity.value   # re-scored severity can change
        row.rationale = f.rationale
        row.evidence = json.dumps(f.evidence)


def _load_previous_findings(db: Session, owner_id, current_run_id) -> list[Finding]:
    """Findings from the most recent *completed* prior run, for diffing."""
    prior = (
        db.query(ScanRun)
        .filter(ScanRun.owner_id == owner_id, ScanRun.id != current_run_id,
                ScanRun.status == "done")
        .order_by(ScanRun.id.desc())
        .first()
    )
    if prior is None:
        return []
    rows = db.query(FindingRow).filter(FindingRow.run_id == prior.id).all()
    return [
        Finding(asset_value=r.asset_value, title=r.title,
                severity=_sev(r.severity), rationale=r.rationale,
                evidence=json.loads(r.evidence or "{}"))
        for r in rows
    ]


def _sev(value: str):
    from .types import Severity
    try:
        return Severity(value)
    except ValueError:
        return Severity.INFO


def run_scan(
    db: Session,
    *,
    owner_id,
    seeds: list[Seed],
    domains: list[str],
    ip_ranges: list[str],
    active: bool = False,
) -> dict:
    """Synchronous entry point. Creates a run, executes the pipeline, persists,
    diffs against the previous run, and returns a summary. This is what the API
    route and the scheduler both call."""
    scope = ScopeGuard.from_operator_input(domains, ip_ranges)
    if scope.is_empty():
        # Default-deny at the top: refuse to scan with no authorization rather
        # than silently doing nothing surprising.
        raise ValueError("Refusing to scan: no authorized domains or IP ranges in scope.")

    now = datetime.utcnow()
    run = ScanRun(
        owner_id=owner_id, started_at=now, status="running",
        seeds=",".join(s.value for s in seeds),
        scope_summary=f"domains={sorted(scope.apex_domains)} cidrs={[str(c) for c in scope.cidrs]}",
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    try:
        assets, services, findings = asyncio.run(_run_pipeline(seeds, scope, active))
    except Exception as exc:  # noqa: BLE001 -- record failure, keep partial data
        run.status = "failed"
        run.finished_at = datetime.utcnow()
        run.stats = json.dumps({"error": str(exc)})
        db.commit()
        raise

    # Persist snapshots (upsert to preserve first_seen history).
    for a in assets:
        _upsert_asset(db, owner_id, run.id, a, now)
    for s in services:
        db.add(ServiceRow(
            owner_id=owner_id, run_id=run.id, asset_value=s.asset.value,
            ip=s.ip, port=s.port, scheme=s.scheme, status_code=s.status_code,
            technologies="", first_seen=now, last_seen=now,
        ))
    previous = _load_previous_findings(db, owner_id, run.id)
    for f in findings:
        _upsert_finding(db, owner_id, run.id, f, now)

    delta = diff_findings(previous, findings)

    run.status = "done"
    run.finished_at = datetime.utcnow()
    run.stats = json.dumps({
        "assets": len(assets),
        "services": len(services),
        "findings": len(findings),
        "delta": delta.summary,
    })
    db.commit()

    return {
        "run_id": run.id,
        "counts": {"assets": len(assets), "services": len(services),
                   "findings": len(findings)},
        "delta": delta.summary,
        "new_findings": [
            {"asset": f.asset_value, "title": f.title, "severity": f.severity.value}
            for f in delta.added
        ],
        "findings": [
            {"asset": f.asset_value, "title": f.title,
             "severity": f.severity.value, "rationale": f.rationale}
            for f in findings
        ],
    }
