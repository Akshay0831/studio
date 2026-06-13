from pydantic import BaseModel
from typing import Optional, Dict, Any

class ImageResponse(BaseModel):
    image_b64: str
    seed: int
    backend: str
    metadata: Optional[Dict[str, Any]] = None

class AudioResponse(BaseModel):
    composition: Dict[str, Any]
    seed: int
    backend: str
    metadata: Optional[Dict[str, Any]] = None

class HealthCheck(BaseModel):
    status: str
    gpu_available: bool
    gpu_type: Optional[str]
    uptime_seconds: float
