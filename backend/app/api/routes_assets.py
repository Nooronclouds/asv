from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json

from app.db.database import get_db
from app.db.models import Asset
from app.core.rbac import require_role

router = APIRouter(prefix="/api/v1/assets", tags=["assets"])

@router.get("")
def get_assets(
    db: Session = Depends(get_db),
    current_user: str = Depends(require_role(["Admin", "SOC Analyst", "Threat Hunter", "Read Only"]))
):
    assets = db.query(Asset).all()
    formatted = []
    for asset in assets:
        formatted.append({
            "id": asset.id,
            "hostname": asset.hostname,
            "ip_address": asset.ip_address,
            "operating_system": asset.operating_system,
            "open_ports": json.loads(asset.open_ports),
            "last_scan": asset.last_scan,
            "criticality": asset.criticality,
            "owner": asset.owner,
            "department": asset.department,
            "status": asset.status
        })
    return formatted
