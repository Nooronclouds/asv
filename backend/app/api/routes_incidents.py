from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json

from app.db.database import get_db
from app.db.models import Incident, IncidentTimeline
from app.schemas.schemas import RegisterRequest
from app.core.rbac import require_role

router = APIRouter(prefix="/api/v1/incidents", tags=["incidents"])

@router.get("")
def get_incidents(
    db: Session = Depends(get_db),
    current_user: str = Depends(require_role(["Admin", "SOC Analyst", "Threat Hunter"]))
):
    incidents = db.query(Incident).all()
    # Format JSON strings
    formatted = []
    for inc in incidents:
        formatted.append({
            "id": inc.id,
            "title": inc.title,
            "severity": inc.severity,
            "status": inc.status,
            "assigned_analyst": inc.assigned_analyst,
            "mitre_mapping": json.loads(inc.mitre_mapping),
            "affected_assets": json.loads(inc.affected_assets),
            "recommendations": json.loads(inc.recommendations),
            "created_at": inc.created_at
        })
    return formatted

@router.get("/{incident_id}")
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(require_role(["Admin", "SOC Analyst"]))
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    timeline = db.query(IncidentTimeline).filter(IncidentTimeline.incident_id == incident_id).all()
    
    return {
        "id": inc.id,
        "title": inc.title,
        "severity": inc.severity,
        "status": inc.status,
        "assigned_analyst": inc.assigned_analyst,
        "mitre_mapping": json.loads(inc.mitre_mapping),
        "affected_assets": json.loads(inc.affected_assets),
        "recommendations": json.loads(inc.recommendations),
        "timeline": [{"timestamp": t.timestamp, "description": t.description, "event_type": t.event_type} for t in timeline]
    }

@router.patch("/{incident_id}")
def update_incident_status(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: str = Depends(require_role(["Admin", "SOC Analyst"]))
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if "status" in payload:
        old_status = inc.status
        new_status = payload["status"]
        inc.status = new_status
        timeline_entry = IncidentTimeline(
            incident_id=inc.id,
            description=f"Status transitioned from {old_status} to {new_status} by {current_user.email}",
            event_type="Escalation"
        )
        db.add(timeline_entry)
        
    if "assigned_analyst" in payload:
        inc.assigned_analyst = payload["assigned_analyst"]
        timeline_entry = IncidentTimeline(
            incident_id=inc.id,
            description=f"Analyst assigned to {payload['assigned_analyst']}",
            event_type="Escalation"
        )
        db.add(timeline_entry)
        
    db.commit()
    return {"message": "Incident updated successfully"}

from fastapi import Response
from app.services.text_reports import generate_text_report

@router.get("/{incident_id}/text")
def export_text_report(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(require_role(["Admin", "SOC Analyst", "Threat Hunter"]))
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    timeline = db.query(IncidentTimeline).filter(IncidentTimeline.incident_id == incident_id).all()
    
    incident_dict = {
        "id": inc.id,
        "title": inc.title,
        "severity": inc.severity,
        "status": inc.status,
        "assigned_analyst": inc.assigned_analyst,
        "recommendations": json.loads(inc.recommendations) if inc.recommendations else []
    }
    timeline_list = [{"timestamp": t.timestamp.isoformat() if hasattr(t.timestamp, "isoformat") else str(t.timestamp), "description": t.description} for t in timeline]
    
    report_str = generate_text_report(incident_dict, timeline_list)
    return Response(content=report_str, media_type="text/plain")
