"""API surface for the attack-surface pipeline.

Thin by design. The route's only jobs are: authenticate, validate input, and
translate between HTTP and the orchestrator. All the real logic (scope, the
pipeline, persistence, diffing) lives in `app.attack_surface`. A fat route is
where business logic goes to become untestable; this one stays a translator.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db

from app.attack_surface import orchestrator
from app.attack_surface.models import FindingRow, ScanRun
from app.attack_surface.types import AssetKind, Seed

router = APIRouter()


class ScanRequest(BaseModel):
    # Seeds we start discovery from.
    seeds: list[str] = Field(default_factory=list, description="Root domains to expand from")
    # Authorization scope. Nothing outside this is ever touched.
    authorized_domains: list[str] = Field(default_factory=list)
    authorized_ip_ranges: list[str] = Field(default_factory=list)
    # Active discovery (DNS bruteforce) is opt-in because it sends traffic.
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
    return [
        {"id": r.id, "status": r.status, "started_at": r.started_at,
         "finished_at": r.finished_at, "stats": r.stats}
        for r in runs
    ]


@router.get("/api/attack-surface/findings")
def list_findings(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Current findings for this owner, worst-first."""
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    rows = db.query(FindingRow).filter(FindingRow.owner_id == current_user).all()
    rows.sort(key=lambda r: (order.get(r.severity, 9), r.asset_value))
    return [
        {"asset": r.asset_value, "title": r.title, "severity": r.severity,
         "rationale": r.rationale, "first_seen": r.first_seen, "last_seen": r.last_seen}
        for r in rows
    ]
