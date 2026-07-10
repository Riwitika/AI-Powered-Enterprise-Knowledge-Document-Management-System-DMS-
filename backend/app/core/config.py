import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise KMS"
    API_V1_STR: str = "/api/v1"
    
    # Database configuration
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/kms"
    
    # JWT Auth Configuration
    SECRET_KEY: str = "supersecretkeychangeinproduction"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # AI LLM Provider Configuration
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # Storage Configuration
    UPLOAD_DIR: str = "/app/uploads"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
