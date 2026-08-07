import os
import uuid
import shutil
import tempfile
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from starlette.requests import Request

from app.db.database import get_db
from app.db.models import ScanHistory
from app.schemas.schemas import URLScanRequest, NetworkScanRequest, EmailScanRequest, UPIScanRequest, ScanResult
from app.core.security import get_current_user

from app.services.clamav_scanner import scan_file
from app.services.virustotal import check_url
from app.services.nmap_scanner import scan as scan_ports
from app.services.email_analyser import analyse_header
from app.services.ai_client import get_ai_analysis
from app.services.alerts import generate_alerts
from app.services.correlation import correlate_scan_event

router = APIRouter()

@router.post("/api/scan/file", response_model=ScanResult)
async def scan_file_endpoint(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    suffix = os.path.splitext(file.filename)[1]
    temp_filename = f"{uuid.uuid4()}{suffix}"
    temp_path = os.path.join(tempfile.gettempdir(), temp_filename)
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        result = scan_file(temp_path)
        result["target"] = file.filename
        
        correlate_scan_event("File Scan", file.filename, result, db)
        
        scan_record = ScanHistory(
            scan_type="File Scan",
            target=file.filename,
            result=str(result),
            user_email=current_user
        )
        db.add(scan_record)
        db.commit()
        return result
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.post("/api/scan/url", response_model=ScanResult)
async def scan_url_endpoint(
    body: URLScanRequest,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = check_url(body.url)
    correlate_scan_event("Phishing (URL)", body.url, result, db)
    
    scan_record = ScanHistory(
        scan_type="Phishing (URL)",
        target=body.url,
        result=str(result),
        user_email=current_user
    )
    db.add(scan_record)
    db.commit()
    return result

@router.post("/api/scan/network", response_model=ScanResult)
async def scan_network_endpoint(
    body: NetworkScanRequest,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = scan_ports(body.target)
    generate_alerts(result)
    correlate_scan_event("Network Scan", body.target, result, db)
    
    scan_record = ScanHistory(
        scan_type="Network Scan",
        target=body.target,
        result=str(result),
        user_email=current_user
    )
    db.add(scan_record)
    db.commit()
    return result

@router.post("/api/scan/email", response_model=ScanResult)
async def scan_email_endpoint(
    body: EmailScanRequest,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = analyse_header(body.header)
    ai_resp = get_ai_analysis(result)
    result["summary"] = ai_resp["summary"]
    result["actions"] = ai_resp["actions"]
    correlate_scan_event("Phishing (Email)", "Email Headers", result, db)
    
    scan_record = ScanHistory(
        scan_type="Phishing (Email)",
        target="Email Headers Analysis",
        result=str(result),
        user_email=current_user
    )
    db.add(scan_record)
    db.commit()
    return result

@router.post("/api/scan/upi", response_model=ScanResult)
async def scan_upi_endpoint(
    body: UPIScanRequest,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    upi = body.upi_id.lower().strip()
    upi_pattern = r"^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$"
    import re
    if not re.match(upi_pattern, upi):
        result = {
            "tool": "upi_verifier",
            "verdict": "ERROR",
            "severity": "None",
            "summary": "Invalid UPI ID syntax. Verify handle format (e.g. user@handle).",
            "actions": ["Re-check the spelling of the UPI ID.", "Ensure it contains exactly one '@' character."]
        }
    else:
        is_suspicious_keyword = any(kw in upi for kw in ["suspicious", "fake", "fraud", "scam", "phish", "steal", "hack"])
        if is_suspicious_keyword:
            result = {
                "tool": "upi_verifier",
                "verdict": "DANGEROUS",
                "severity": "Critical",
                "summary": "This UPI ID contains words strongly associated with security flags or fraud reports.",
                "actions": [
                    "Do NOT send any payments to this address.",
                    "Report this UPI ID to your bank or payment app.",
                    "Block the sender contact immediately."
                ]
            }
        else:
            result = {
                "tool": "upi_verifier",
                "verdict": "SUSPICIOUS",
                "severity": "Low",
                "summary": "UPI ID format is syntactically valid, but owner identity is unverified. Best-case low risk check.",
                "actions": [
                    "Verify the recipient name shown by your UPI/PSP app matches before paying.",
                    "Start with a small test transaction (e.g. ₹1) to confirm recipient identity.",
                    "Do not proceed if the name shown in the payment app differs from the expected business/person."
                ]
            }
            
    correlate_scan_event("UPI Check", body.upi_id, result, db)
    
    scan_record = ScanHistory(
        scan_type="UPI Check",
        target=body.upi_id,
        result=str(result),
        user_email=current_user
    )
    db.add(scan_record)
    db.commit()
    return result
