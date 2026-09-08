import os
from pathlib import Path
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Email Verification System"
    API_V1_STR: str = "/api/v1"
    
    # Base Directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    EXPORT_DIR: Path = BASE_DIR / "exports"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///" + str(BASE_DIR / "email_verifier.db")
    
    # Security & Upload limits
    MAX_UPLOAD_SIZE_MB: int = 50  # 50 MB limit
    ALLOWED_EXTENSIONS: set = {".csv", ".xlsx", ".xls"}
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]
    
    # Validation Performance Config
    MAX_CONCURRENT_DNS_LOOKUPS: int = 50
    DNS_TIMEOUT_SECONDS: float = 3.0
    
    model_config = ConfigDict(case_sensitive=True)

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.EXPORT_DIR.mkdir(parents=True, exist_ok=True)
