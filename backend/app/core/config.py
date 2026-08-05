import os
from typing import Any
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise KMS"
    API_V1_STR: str = "/api/v1"
    
    # Database configuration
    DATABASE_URL: str = ""
    
    # JWT Auth Configuration
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    INVITE_CODE: str = "FASTTRADE-SECURE-2026"
    
    # AI LLM Provider Configuration
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # Additional Production configurations
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    MAX_UPLOAD_SIZE_MB: int = 50
    
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @model_validator(mode="before")
    @classmethod
    def parse_cors_origins(cls, data: Any) -> Any:
        if isinstance(data, dict):
            origins = data.get("BACKEND_CORS_ORIGINS")
            if isinstance(origins, str) and origins:
                data["BACKEND_CORS_ORIGINS"] = [x.strip() for x in origins.split(",") if x.strip()]
        return data

    @model_validator(mode="after")
    def validate_sensitive_keys(self) -> 'Settings':
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL must be specified.")
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY must be specified.")
            
        env_mode = os.getenv("ENV") or os.getenv("APP_ENV") or "development"
        if env_mode == "production":
            if self.SECRET_KEY == "supersecretkeychangeinproduction" or len(self.SECRET_KEY) < 16:
                raise ValueError("SECRET_KEY must be a secure, unique, and long token in production mode.")
            if self.DATABASE_URL.startswith("sqlite"):
                raise ValueError("SQLite databases are not supported in production environment. Use PostgreSQL instead.")
            if not self.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY must be configured in production environment.")
        return self

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
