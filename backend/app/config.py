from pydantic_settings import BaseSettings
from typing import List, Any, Union
from pydantic import field_validator, Field
import json


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "nomadsync"
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    cors_origins: Union[str, List[str]] = Field(
        default="http://localhost:5173,http://localhost:3000",
        json_schema_extra={"examples": ["http://localhost:5173,http://localhost:3000"]}
    )
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        """Parse cors_origins from various formats (JSON, comma-separated, list, or empty)"""
        # Handle None, empty string, or empty value - return default immediately
        if v is None or v == "":
            return ["http://localhost:5173", "http://localhost:3000"]
        
        # Already a list - return as-is
        if isinstance(v, list):
            return v
        
        # Handle string input
        if isinstance(v, str):
            # Strip whitespace first
            v_stripped = v.strip()
            
            # Handle empty or whitespace-only string after stripping
            if not v_stripped:
                return ["http://localhost:5173", "http://localhost:3000"]
            
            # Try to parse as JSON first (for env vars that might be JSON arrays)
            try:
                parsed = json.loads(v_stripped)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
            
            # Handle comma-separated string
            if "," in v_stripped:
                origins = [origin.strip() for origin in v_stripped.split(",") if origin.strip()]
                return origins if origins else ["http://localhost:5173", "http://localhost:3000"]
            
            # Handle single string
            return [v_stripped]
        
        # Fallback to default
        return ["http://localhost:5173", "http://localhost:3000"]
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get cors_origins as a list, handling both string and list types"""
        if isinstance(self.cors_origins, list):
            return self.cors_origins
        # If it's still a string after validation, parse it
        return Settings.parse_cors_origins(self.cors_origins)
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
