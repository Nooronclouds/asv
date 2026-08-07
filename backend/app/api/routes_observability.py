from fastapi import APIRouter
from fastapi.responses import Response
import time

router = APIRouter(prefix="/api/v1/metrics", tags=["observability"])

start_time = time.time()

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "uptime_seconds": int(time.time() - start_time),
        "liveness": "OK",
        "readiness": "OK"
    }

@router.get("/prometheus")
def get_prometheus_metrics():
    uptime = int(time.time() - start_time)
    lines = [
        f"vanguard_uptime_seconds {uptime}",
        "vanguard_active_scans_total 0",
        "vanguard_api_requests_total 1",
        "vanguard_database_status 1"
    ]
    return Response(content="\n".join(lines), media_type="text/plain")
