from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.requests import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import time

from app.db.database import engine, Base
from app.core.config import ALLOWED_ORIGINS

# Router imports
from app.api.routes_auth import router as auth_router
from app.api.routes_scan import router as scan_router
from app.api.routes_history import router as history_router
from app.api.routes_incidents import router as incidents_router
from app.api.routes_assets import router as assets_router
from app.api.routes_iocs import router as iocs_router
from app.api.routes_observability import router as observability_router
from app.api.routes_attack_surface import router as attack_surface_router

# Importing the router above pulls in app.attack_surface.models, which registers
# the asw_* tables on Base *before* create_all runs -- import order matters here.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Vanguard SME Security Suite API",
    description="Backend API for Vanguard SME Security Suite, a unified multi-vector cybersecurity scanning and rolling posture assessment platform."
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": "Rate limit exceeded. Try again later."}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Version 1 endpoints
app.include_router(auth_router)
app.include_router(scan_router)
app.include_router(history_router)
app.include_router(incidents_router)
app.include_router(assets_router)
app.include_router(iocs_router)
app.include_router(observability_router)
app.include_router(attack_surface_router)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response
