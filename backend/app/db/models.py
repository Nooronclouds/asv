from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base

class RiskReport(Base):
    __tablename__ = "risk_reports"
    id = Column(Integer, primary_key=True, index=True)
    device_name = Column(String)
    risk_score = Column(Integer)
    risk_level = Column(String)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="SOC Analyst")  # Admin, SOC Analyst, Threat Hunter, Auditor, Read Only

class ScanHistory(Base):
    __tablename__ = "scan_history"
    id = Column(Integer, primary_key=True, index=True)
    scan_type = Column(String)
    target = Column(String)
    result = Column(Text)
    user_email = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, index=True)
    ip_address = Column(String, index=True)
    operating_system = Column(String, default="Unknown")
    open_ports = Column(String, default="[]")  # JSON string list
    last_scan = Column(DateTime, default=datetime.utcnow)
    criticality = Column(String, default="Medium")  # Low, Medium, High, Critical
    owner = Column(String, default="IT Security")
    department = Column(String, default="Engineering")
    status = Column(String, default="Active")

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    severity = Column(String, default="Medium")  # Low, Medium, High, Critical
    status = Column(String, default="Open")  # Open, Assigned, Investigating, Contained, Resolved, Closed
    assigned_analyst = Column(String, default="Unassigned")
    mitre_mapping = Column(Text, default="[]")  # JSON string list of tactics/techniques
    affected_assets = Column(Text, default="[]")  # JSON list of asset names
    recommendations = Column(Text, default="[]")  # JSON list of actions
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class IncidentTimeline(Base):
    __tablename__ = "incident_timeline"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    description = Column(String)
    event_type = Column(String)  # Scan, Log, Escalation, Mitigation

class IOC(Base):
    __tablename__ = "iocs"
    id = Column(Integer, primary_key=True, index=True)
    value = Column(String, unique=True, index=True)
    ioc_type = Column(String, index=True)  # IP, Domain, URL, Hash, Email, ASN
    description = Column(Text, default="")
    reputation_score = Column(Integer, default=0)  # 0-100
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    asn = Column(String, default="")
    whois_info = Column(Text, default="{}")  # JSON metadata string
    relationships = Column(Text, default="[]")  # JSON links list

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    action = Column(String, index=True)  # Login, Logout, Scan, Role Change, Delete, Export
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, default="")
    details = Column(Text, default="")
