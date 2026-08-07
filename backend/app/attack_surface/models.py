"""Datastore schema for the attack-surface pipeline.

These tables reuse the *existing* project `Base` and engine (see
`app.db.database`) rather than standing up a second database. Two reasons:

1. It keeps one source of truth and one connection pool -- the pipeline's
   findings live next to the rest of the suite's data and are queried the same
   way, with the same session lifecycle.
2. Migrations/`create_all` already know about `Base`; a separate declarative
   base would silently not get created.

The schema is deliberately snapshot-oriented. Every asset, service, and finding
carries `run_id` plus `first_seen` / `last_seen`. That is the entire trick
behind change-detection: "what's new this week" is just rows whose `first_seen`
equals the latest run, and the diff engine never has to recompute history.

Note on async: this ORM is *synchronous*. The network stages are async, but DB
writes are local, fast, and batched between stages -- not the bottleneck. Using
sync SQLAlchemy here avoids forcing the entire existing app onto async DB
drivers just so a scanner can persist results.
"""

from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db.database import Base


class ScanRun(Base):
    __tablename__ = "asw_scan_runs"

    id = Column(Integer, primary_key=True)
    owner_id = Column(String(255), index=True, nullable=True)  # username / org
    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    finished_at = Column(DateTime, nullable=True)
    status = Column(String(32), default="running")         # running|done|failed
    seeds = Column(Text, default="")                       # comma-joined seeds
    scope_summary = Column(Text, default="")               # human-readable scope
    stats = Column(Text, default="{}")                     # JSON: counts, timings

    assets = relationship("AssetRow", back_populates="run")
    findings = relationship("FindingRow", back_populates="run")


class AssetRow(Base):
    __tablename__ = "asw_assets"
    __table_args__ = (UniqueConstraint("owner_id", "value", name="uq_owner_asset"),)

    id = Column(Integer, primary_key=True)
    owner_id = Column(String(255), index=True, nullable=True)
    run_id = Column(Integer, ForeignKey("asw_scan_runs.id"), index=True)
    value = Column(String(512), index=True)
    kind = Column(String(32))
    source = Column(String(64))
    resolved_ip = Column(String(64), nullable=True)
    first_seen = Column(DateTime, default=datetime.utcnow, index=True)
    last_seen = Column(DateTime, default=datetime.utcnow, index=True)

    run = relationship("ScanRun", back_populates="assets")


class ServiceRow(Base):
    __tablename__ = "asw_services"

    id = Column(Integer, primary_key=True)
    owner_id = Column(String(255), index=True, nullable=True)
    run_id = Column(Integer, ForeignKey("asw_scan_runs.id"), index=True)
    asset_value = Column(String(512), index=True)
    ip = Column(String(64))
    port = Column(Integer)
    scheme = Column(String(16))
    status_code = Column(Integer, nullable=True)
    technologies = Column(Text, default="")                # comma-joined
    tls_expires_at = Column(DateTime, nullable=True)
    first_seen = Column(DateTime, default=datetime.utcnow, index=True)
    last_seen = Column(DateTime, default=datetime.utcnow, index=True)


class FindingRow(Base):
    __tablename__ = "asw_findings"

    id = Column(Integer, primary_key=True)
    owner_id = Column(String(255), index=True, nullable=True)
    run_id = Column(Integer, ForeignKey("asw_scan_runs.id"), index=True)
    asset_value = Column(String(512), index=True)
    title = Column(String(256))
    severity = Column(String(16), index=True)
    rationale = Column(Text)
    evidence = Column(Text, default="{}")                  # JSON
    first_seen = Column(DateTime, default=datetime.utcnow, index=True)
    last_seen = Column(DateTime, default=datetime.utcnow, index=True)

    run = relationship("ScanRun", back_populates="findings")
