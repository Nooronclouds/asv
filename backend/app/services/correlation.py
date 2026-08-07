import json
from sqlalchemy.orm import Session
from app.db.models import Incident, IncidentTimeline, Asset, IOC

def extract_and_store_iocs(target: str, ioc_type: str, scan_result: dict, db: Session):
    # Retrieve existing or initialize new IOC
    existing_ioc = db.query(IOC).filter(IOC.value == target).first()
    reputation = 0
    if scan_result.get("verdict") in ("DANGEROUS", "INFECTED", "PHISHING"):
        reputation = 75 if scan_result.get("severity") == "High" else 95
        
    if not existing_ioc:
        new_ioc = IOC(
            value=target,
            ioc_type=ioc_type,
            reputation_score=reputation,
            description=f"Extracted during {scan_result.get('tool')} scan."
        )
        db.add(new_ioc)
        db.commit()
    else:
        existing_ioc.reputation_score = max(existing_ioc.reputation_score, reputation)
        db.commit()

def link_incident_and_timeline(title: str, severity: str, assets: list[str], recommendations: list[str], mitre_map: dict, db: Session) -> Incident:
    new_incident = Incident(
        title=title,
        severity=severity,
        status="Open",
        affected_assets=json.dumps(assets),
        recommendations=json.dumps(recommendations),
        mitre_mapping=json.dumps(mitre_map)
    )
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)
    
    timeline_entry = IncidentTimeline(
        incident_id=new_incident.id,
        description=f"Incident opened automatically. Primary indicator identified.",
        event_type="Log"
    )
    db.add(timeline_entry)
    db.commit()
    return new_incident

def correlate_scan_event(scan_type: str, target: str, result: dict, db: Session):
    verdict = result.get("verdict", "CLEAN")
    severity = result.get("severity", "None")
    
    # 1. Store IOC
    ioc_type = "Domain"
    if scan_type == "Network Scan":
        ioc_type = "IP"
    elif scan_type == "File Scan":
        ioc_type = "Hash"
    elif scan_type == "UPI Check":
        ioc_type = "Wallet"
    
    extract_and_store_iocs(target, ioc_type, result, db)
    
    # 2. Correlate Asset
    if scan_type in ("Network Scan", "File Scan"):
        existing_asset = db.query(Asset).filter(Asset.ip_address == target).first()
        if not existing_asset:
            new_asset = Asset(
                hostname=target,
                ip_address=target,
                criticality=severity
            )
            db.add(new_asset)
            db.commit()
            
    # 3. Create Incident if Dangerous/Infected
    if verdict in ("DANGEROUS", "INFECTED", "PHISHING") or severity in ("High", "Critical"):
        from app.services.mitre_mapper import map_to_mitre
        tool_name = result.get("tool", "unknown")
        mitre_data = map_to_mitre(tool_name, verdict)
        
        link_incident_and_timeline(
            title=f"Potential Attack vector flagged on {target}",
            severity=severity,
            assets=[target],
            recommendations=result.get("actions", []),
            mitre_map=mitre_data,
            db=db
        )
