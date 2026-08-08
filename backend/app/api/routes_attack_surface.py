"""API surface for the attack-surface pipeline.

Thin by design. The route's only jobs are: authenticate, validate input, and
translate between HTTP and the orchestrator. All the real logic (scope, the
pipeline, persistence, diffing) lives in `app.attack_surface`. A fat route is
where business logic goes to become untestable; this one stays a translator.
"""

import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db

from app.attack_surface import orchestrator
from app.attack_surface.models import AssetRow, FindingRow, ScanRun, ServiceRow
from app.attack_surface.types import AssetKind, Seed

router = APIRouter()

_SEV_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}


def _latest_done_run(db: Session, user: str) -> ScanRun | None:
    return (
        db.query(ScanRun)
        .filter(ScanRun.owner_id == user, ScanRun.status == "done")
        .order_by(ScanRun.id.desc())
        .first()
    )


def _is_new(first_seen, latest: ScanRun | None) -> bool:
    """A row is 'new this scan' if it first appeared in the latest completed run."""
    return bool(latest and first_seen and latest.started_at and first_seen >= latest.started_at)


class ScanRequest(BaseModel):
    seeds: list[str] = Field(default_factory=list, description="Root domains to expand from")
    authorized_domains: list[str] = Field(default_factory=list)
    authorized_ip_ranges: list[str] = Field(default_factory=list)
    active: bool = False


@router.post("/api/attack-surface/scan")
def start_scan(
    body: ScanRequest,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not body.seeds:
        raise HTTPException(status_code=400, detail="Provide at least one seed domain.")

    seeds = [Seed(value=s.strip(), kind=AssetKind.DOMAIN) for s in body.seeds if s.strip()]
    try:
        result = orchestrator.run_scan(
            db,
            owner_id=current_user,
            seeds=seeds,
            domains=body.authorized_domains,
            ip_ranges=body.authorized_ip_ranges,
            active=body.active,
        )
    except ValueError as exc:
        # Raised when scope is empty -- a client error, not a server fault.
        raise HTTPException(status_code=400, detail=str(exc))
    return result


@router.get("/api/attack-surface/overview")
def overview(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate posture for the dashboard: severity counts + latest-run delta."""
    latest = _latest_done_run(db, current_user)
    findings = db.query(FindingRow).filter(FindingRow.owner_id == current_user).all()

    counts = {s: 0 for s in _SEV_ORDER}
    for f in findings:
        if f.severity in counts:
            counts[f.severity] += 1

    stats = json.loads(latest.stats) if latest and latest.stats else {}
    delta = stats.get("delta", {"added": 0, "removed": 0, "persisting": 0})

    return {
        "hasData": latest is not None,
        "scope": (latest.scope_summary if latest else ""),
        "seeds": (latest.seeds if latest else ""),
        "lastScan": (latest.started_at if latest else None),
        "counts": counts,
        "totalFindings": len(findings),
        "delta": delta,
        "hostsLive": (stats.get("assets", 0)),
        "services": (stats.get("services", 0)),
    }


@router.get("/api/attack-surface/runs")
def list_runs(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    runs = (
        db.query(ScanRun)
        .filter(ScanRun.owner_id == current_user)
        .order_by(ScanRun.id.desc())
        .limit(50)
        .all()
    )
    out = []
    for r in runs:
        stats = json.loads(r.stats) if r.stats else {}
        out.append({
            "id": r.id,
            "status": r.status,
            "started_at": r.started_at,
            "finished_at": r.finished_at,
            "delta": stats.get("delta", {"added": 0, "removed": 0, "persisting": 0}),
            "counts": {"assets": stats.get("assets", 0), "findings": stats.get("findings", 0)},
        })
    return out


@router.get("/api/attack-surface/findings")
def list_findings(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Current findings for this owner, worst-first."""
    latest = _latest_done_run(db, current_user)
    rows = db.query(FindingRow).filter(FindingRow.owner_id == current_user).all()
    rows.sort(key=lambda r: (_SEV_ORDER.get(r.severity, 9), r.asset_value))
    return [
        {
            "asset": r.asset_value,
            "title": r.title,
            "severity": r.severity,
            "rationale": r.rationale,
            "evidence": json.loads(r.evidence or "{}"),
            "first_seen": r.first_seen,
            "last_seen": r.last_seen,
            "is_new": _is_new(r.first_seen, latest),
        }
        for r in rows
    ]


@router.get("/api/attack-surface/assets")
def list_assets(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Discovered assets with the ports we saw live services on."""
    latest = _latest_done_run(db, current_user)
    assets = (
        db.query(AssetRow)
        .filter(AssetRow.owner_id == current_user)
        .order_by(AssetRow.value)
        .all()
    )
    services = db.query(ServiceRow).filter(ServiceRow.owner_id == current_user).all()
    ports: dict[str, set[int]] = {}
    for s in services:
        ports.setdefault(s.asset_value, set()).add(s.port)

    return [
        {
            "value": a.value,
            "resolved_ip": a.resolved_ip or "",
            "source": a.source,
            "ports": sorted(ports.get(a.value, [])),
            "first_seen": a.first_seen,
            "is_new": _is_new(a.first_seen, latest),
        }
        for a in assets
    ]
