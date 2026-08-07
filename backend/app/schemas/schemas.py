from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional
import re

class DeviceData(BaseModel):
    device_name: str
    password_length: int
    failed_logins: int
    outdated_software: bool
    suspicious_ip: bool
    antivirus_enabled: bool
    open_ports: int

class RiskResponse(BaseModel):
    device_name: str
    risk_score: int
    risk_level: str
    issues_found: List[str]
    recommendations: List[str]

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class URLScanRequest(BaseModel):
    url: str
    email: Optional[str] = None

    @field_validator("url")
    def validate_url(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("URL cannot be empty")
        return v

class NetworkScanRequest(BaseModel):
    target: str
    email: Optional[str] = None

    @field_validator("target")
    def validate_target(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Target cannot be empty")
        ip_pattern = r"^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]))*$"
        if not re.match(ip_pattern, v):
            raise ValueError("Invalid target format. Must be a valid IP or hostname.")
        return v

class EmailScanRequest(BaseModel):
    header: str
    email: Optional[str] = None

    @field_validator("header")
    def validate_header(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Email header cannot be empty")
        return v

class UPIScanRequest(BaseModel):
    upi_id: str
    email: Optional[str] = None

    @field_validator("upi_id")
    def validate_upi(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("UPI ID cannot be empty")
        if "@" not in v:
            raise ValueError("Invalid UPI ID format. Must contain '@'")
        return v

class ScanResult(BaseModel):
    tool: str
    verdict: str
    severity: str
    summary: str
    actions: List[str]
    subject: Optional[str] = None
    from_domain: Optional[str] = None
    reply_to_domain: Optional[str] = None
    sending_domain: Optional[str] = None
    spf_status: Optional[str] = None
    dkim_status: Optional[str] = None
    dmarc_status: Optional[str] = None
    domain_mismatch: Optional[bool] = None
    spoofed: Optional[bool] = None
    upi_brand_targeted: Optional[str] = None
    risk_score: Optional[int] = None
    threat_name: Optional[str] = None
    threat_type: Optional[str] = None
    raw_ports: Optional[List[dict]] = None
