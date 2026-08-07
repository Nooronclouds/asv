import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is missing.")

SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is missing.")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

ALLOWED_ORIGINS_STR = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS_STR.split(",") if o.strip()]

VIRUSTOTAL_API_KEY = os.environ.get("VIRUSTOTAL_API_KEY", "your_virustotal_api_key_here")
AI_SERVICE_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:5000/analyze")
