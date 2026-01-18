from pydantic_settings import BaseSettings
from typing import List, Any
from pydantic import field_validator
import json


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
    def parse_cors_origins(cls, v: Any) -> Any:
        """Parse cors_origins from various formats (JSON, comma-separated, list, or empty)"""
        # Handle None, empty string, or empty value
        if v is None or v == "":
            return ["http://localhost:5173", "http://localhost:3000"]
        
        # Already a list
        if isinstance(v, list):
            return v
        
        # Handle string input
        if isinstance(v, str):
            # Strip whitespace first
            v = v.strip()
            
            # Handle empty or whitespace-only string after stripping
            if not v:
                return ["http://localhost:5173", "http://localhost:3000"]
            
            # Try to parse as JSON first (for env vars that might be JSON arrays)
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
            
            # Handle comma-separated string
            if "," in v:
                origins = [origin.strip() for origin in v.split(",") if origin.strip()]
                return origins if origins else ["http://localhost:5173", "http://localhost:3000"]
            
            # Handle single string
            return [v]
        
        # Fallback to default
        return ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
