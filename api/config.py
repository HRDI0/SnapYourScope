import os
from typing import List

from dotenv import load_dotenv

load_dotenv()


def _parse_csv_env(key: str, default: str) -> List[str]:
    raw = os.getenv(key, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


def _parse_bool_env(key: str, default: str = "false") -> bool:
    return os.getenv(key, default).strip().lower() == "true"


JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "YOUR_SECRET_KEY_HERE_FOR_DEV")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./seo_analysis.db")

STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local")
STORAGE_LOCAL_DIR = os.getenv("STORAGE_LOCAL_DIR", "storage_blobs")
STORAGE_PUBLIC_BASE_URL = os.getenv("STORAGE_PUBLIC_BASE_URL", "")

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "")
R2_ENDPOINT = os.getenv("R2_ENDPOINT", "")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_BUCKET_NAME = os.getenv("SUPABASE_BUCKET_NAME", "")

GOOGLE_OAUTH_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")
GOOGLE_OAUTH_CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
GOOGLE_OAUTH_REDIRECT_URI = os.getenv(
    "GOOGLE_OAUTH_REDIRECT_URI", "http://127.0.0.1:8000/api/auth/google/callback"
)
FRONTEND_APP_URL = os.getenv("FRONTEND_APP_URL", "http://localhost:5173/app.html")

ADMIN_SEED_EMAIL = os.getenv("ADMIN_SEED_EMAIL", "admin@snapyourscope.local")
ADMIN_SEED_PASSWORD = os.getenv("ADMIN_SEED_PASSWORD", "")
ADMIN_SEED_ENABLED = os.getenv("ADMIN_SEED_ENABLED", "false").lower() == "true"

CORS_ORIGINS = _parse_csv_env(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
)

OPEN_BETA_MODE = _parse_bool_env("OPEN_BETA_MODE", "false")
AUTH_TEMP_DISABLED = _parse_bool_env("AUTH_TEMP_DISABLED", "false")
BILLING_TEMP_DISABLED = _parse_bool_env("BILLING_TEMP_DISABLED", "false")
