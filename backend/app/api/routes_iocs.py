from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from app.db.database import get_db
from app.db.models import IOC
from app.core.rbac import require_role

router = APIRouter(prefix="/api/v1/iocs", tags=["iocs"])

@router.get("")
def get_iocs(
    db: Session = Depends(get_db),
    current_user: str = Depends(require_role(["Admin", "SOC Analyst", "Threat Hunter"]))
):
    iocs = db.query(IOC).all()
    formatted = []
    for i in iocs:
        formatted.append({
            "id": i.id,
            "value": i.value,
            "ioc_type": i.ioc_type,
            "description": i.description,
            "reputation_score": i.reputation_score,
            "first_seen": i.first_seen,
            "last_seen": i.last_seen,
            "asn": i.asn,
            "whois_info": json.loads(i.whois_info),
            "relationships": json.loads(i.relationships)
        })
    return formatted
