from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.models import ScanHistory, RiskReport
from app.core.security import get_current_user

router = APIRouter()

@router.get("/scan-history")
def get_scan_history(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    scans = db.query(ScanHistory).filter(ScanHistory.user_email == current_user).all()
    return scans

@router.get("/scan-history/{scan_id}")
def get_scan(scan_id: int, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
    if not scan:
        raise HTTPException(
            status_code=404,
            detail="Scan not found"
        )
    return scan

@router.delete("/scan-history/{scan_id}")
def delete_scan(scan_id: int, current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
    if not scan:
        raise HTTPException(
            status_code=404,
            detail="Scan not found"
        )
    db.delete(scan)
    db.commit()
    return {"message": "Scan deleted successfully"}

@router.get("/dashboard-summary")
def get_dashboard_summary(current_user: str = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(RiskReport).all()
    
    total_devices = len(reports)
    critical_risk = len([r for r in reports if r.risk_level == "Critical"])
    high_risk = len([r for r in reports if r.risk_level == "High"])
    medium_risk = len([r for r in reports if r.risk_level == "Medium"])
    low_risk = len([r for r in reports if r.risk_level == "Low"])
    
    return {
        "total_devices": total_devices,
        "critical_risk": critical_risk,
        "high_risk": high_risk,
        "medium_risk": medium_risk,
        "low_risk": low_risk
    }
