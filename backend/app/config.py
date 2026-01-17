from pydantic_settings import BaseSettings
from typing import List
from pydantic import field_validator


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "nomadsync"
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # Handle comma-separated string
            if "," in v:
                return [origin.strip() for origin in v.split(",")]
            # Handle single string
            return [v.strip()]
        # Already a list or other type
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
