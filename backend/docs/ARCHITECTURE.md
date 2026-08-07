# Backend Architecture - Vanguard SME Security Suite

Vanguard SME Security Suite Backend is a modular API built with FastAPI, Structured Database Models, and custom threat scanners.

## Directory Structure

- `app/`
  - `main.py`: Bootstraps the FastAPI application instance, Rate Limit handlers, CORSMiddleware definitions, and binds the router components.
  - `api/`: API endpoints grouped by context:
    - `routes_auth.py`: Registration (`/register`) and Authentication (`/login`).
    - `routes_scan.py`: Multi-vector security scanners (`/api/scan/*`).
    - `routes_history.py`: Scan logging, history entries (`/scan-history*`), and dashboard summary telemetry.
  - `core/`: Config settings and security contexts:
    - `config.py`: Environment variable loading, fallback states, allowed CORS origins list.
    - `security.py`: Password hashing, checking, and JWT session handling logic.
  - `db/`: Database configuration and SQLAlchemy models:
    - `database.py`: SQLAlchemy session bindings and engine initializer helper.
    - `models.py`: Data tables matching schema models.
  - `schemas/`: Pydantic input validation models and response payloads.
  - `services/`: Specialized network/email/file scanners.
