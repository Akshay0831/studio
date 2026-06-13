from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Server
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000
    DEBUG: bool = True
    
    # GPU
    GPU_DEVICE: int = 0
    FORCE_CPU: bool = False
    MAX_VRAM_PERCENTAGE: float = 0.9
    
    # Inference Paths
    ARTSYNTHESIS_PATH: str = "tools/ArtSynthesis/src"
    AUDIOLAYER_PATH: str = "tools/AudioLayerEngine/src"
    MODELS_PATH: str = "tools/models"
    STUDIO_OUTPUT_PATH: str = "./studio_output"
    
    # Remote APIs (Optional)
    REPLICATE_API_KEY: Optional[str] = None
    RUNPOD_API_KEY: Optional[str] = None
    
    # Rate Limiting
    MAX_REQUESTS_PER_MINUTE: int = 10
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"

settings = Settings()
