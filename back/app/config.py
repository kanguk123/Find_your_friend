"""
Configuration management using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Database
    DATABASE_URL: str = "postgresql://username:password@localhost:5432/exoplanet_db"

    # Application
    APP_NAME: str = "Exoplanet Discovery API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # AI Model
    DEFAULT_MODEL_VERSION: str = "v0.1"
    AI_SERVICE_URL: str = "http://localhost:8001"

    # Dummy Data
    USE_DUMMY_DATA: bool = True
    DUMMY_PLANET_COUNT: int = 500

    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert comma-separated origins to list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
