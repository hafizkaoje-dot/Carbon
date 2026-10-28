"""
Application configuration using Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "GeoCarbon Dashboard"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Google Earth Engine
    GEE_PROJECT: str = "projects/geocarbon-lclu"
    GCS_BUCKET: str = "geocarbon-exports"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/geocarbon"
    
    # Redis (Task Queue)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # NVIDIA GPU
    GPU_MEMORY_LIMIT_GB: float = 8.0
    CUDA_DEVICE: int = 0
    
    # Export
    EXPORT_DIR: str = "./exports"
    
    # Processing
    DEFAULT_SCALE: int = 10
    MAX_PIXELS: int = 1e13
    CLOUD_THRESHOLD: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
