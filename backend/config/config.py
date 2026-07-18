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
    
    # Project Paths
    PROJECTS_PATH: str = Field(default=os.getenv("PROJECTS_PATH", "./data/projects"))
    CONFIGS_PATH: str = Field(default=os.getenv("CONFIGS_PATH", "./data/config"))
    OUTPUT_PATH: str = Field(default=os.getenv("OUTPUT_PATH", "./data/output"))
    MODELS_PATH: str = Field(default=os.getenv("MODELS_PATH", "./data/models"))
    
    # Remote APIs (Optional)
    REPLICATE_API_KEY: Optional[str] = Field(default=os.getenv("REPLICATE_API_KEY"))
    RUNPOD_API_KEY: Optional[str] = Field(default=os.getenv("RUNPOD_API_KEY"))
    
    # Paths
    DATA_PATH: str = Field(default=os.getenv("DATA_PATH", "./data"))
    STUDIO_ROOT: str = Field(default=os.getenv("STUDIO_ROOT", str(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
    
    # Rate Limiting
    MAX_REQUESTS_PER_MINUTE: int = Field(default=int(os.getenv("MAX_REQUESTS_PER_MINUTE", "10")))

    # Timeout Settings
    INFERENCE_TIMEOUT: int = Field(default=int(os.getenv("INFERENCE_TIMEOUT", "600")))  # 10 minutes
    BATCH_INFERENCE_TIMEOUT: int = Field(default=int(os.getenv("BATCH_INFERENCE_TIMEOUT", "900")))  # 15 minutes
    REQUEST_TIMEOUT: int = Field(default=int(os.getenv("REQUEST_TIMEOUT", "30")))  # 30 seconds

    # Logging
    LOG_LEVEL: str = Field(default=os.getenv("LOG_LEVEL", "INFO"))

settings = Settings()

# Centralized path setup
def setup_project_paths():
    import os
    
    # Ensure data directories exist
    os.makedirs(settings.PROJECTS_PATH, exist_ok=True)
    os.makedirs(settings.CONFIGS_PATH, exist_ok=True)
    os.makedirs(settings.OUTPUT_PATH, exist_ok=True)
    os.makedirs(settings.MODELS_PATH, exist_ok=True)

setup_project_paths()
