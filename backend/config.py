import os
from pydantic import BaseModel, Field
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env if it exists
load_dotenv()

class Settings(BaseModel):
    # Server
    SERVER_HOST: str = Field(default=os.getenv("SERVER_HOST", "0.0.0.0"))
    SERVER_PORT: int = Field(default=int(os.getenv("SERVER_PORT", "8000")))
    DEBUG: bool = Field(default=os.getenv("DEBUG", "True").lower() == "true")
    
    # GPU
    GPU_DEVICE: int = Field(default=int(os.getenv("GPU_DEVICE", "0")))
    FORCE_CPU: bool = Field(default=os.getenv("FORCE_CPU", "False").lower() == "true")
    MAX_VRAM_PERCENTAGE: float = Field(default=float(os.getenv("MAX_VRAM_PERCENTAGE", "0.9")))
    
    # Inference Paths
    ARTSYNTHESIS_PATH: str = Field(default=os.getenv("ARTSYNTHESIS_PATH", "tools/ArtSynthesis/src"))
    AUDIOLAYER_PATH: str = Field(default=os.getenv("AUDIOLAYER_PATH", "tools/AudioLayerEngine/src"))
    MODELS_PATH: str = Field(default=os.getenv("MODELS_PATH", "tools/models"))
    STUDIO_OUTPUT_PATH: str = Field(default=os.getenv("STUDIO_OUTPUT_PATH", "./studio_output"))
    
    # Remote APIs (Optional)
    REPLICATE_API_KEY: Optional[str] = Field(default=os.getenv("REPLICATE_API_KEY"))
    RUNPOD_API_KEY: Optional[str] = Field(default=os.getenv("RUNPOD_API_KEY"))
    
    # Paths
    STUDIO_ROOT: str = Field(default=os.getenv("STUDIO_ROOT", str(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
    
    # Rate Limiting
    MAX_REQUESTS_PER_MINUTE: int = Field(default=int(os.getenv("MAX_REQUESTS_PER_MINUTE", "10")))
    
    # Logging
    LOG_LEVEL: str = Field(default=os.getenv("LOG_LEVEL", "INFO"))

settings = Settings()

# Centralized path setup for legacy engine integration
def setup_engine_paths():
    import sys
    import os
    
    paths = [settings.ARTSYNTHESIS_PATH, settings.AUDIOLAYER_PATH]
    for path in paths:
        abs_path = os.path.abspath(path)
        if abs_path not in sys.path:
            sys.path.append(abs_path)

setup_engine_paths()
