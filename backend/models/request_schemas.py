from pydantic import BaseModel, Field
from typing import Optional, Dict, List

class GenerateImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    negative_prompt: Optional[str] = Field(None, max_length=500)
    seed: int = Field(42, ge=0)
    config: Dict = Field(default_factory=dict)
    prefer_local: bool = Field(True)

class InpaintImageRequest(BaseModel):
    base_image: str = Field(..., description="Base64 encoded image")
    mask_image: str = Field(..., description="Base64 encoded mask")
    prompt: str = Field(..., min_length=1, max_length=1000)
    seed: int = Field(42, ge=0)
    config: Dict = Field(default_factory=dict)
    prefer_local: bool = Field(True)

class ComposeAudioRequest(BaseModel):
    bpm: int = Field(120, ge=60, le=240)
    key: str = Field("C")
    scale: str = Field("Major")
    mood: str = Field("Neutral")
    bars: int = Field(4, ge=1, le=32)
    seed: int = Field(42, ge=0)
    layers: List[str] = Field(default_factory=lambda: ["bass", "lead", "drums", "ambient"])
    config: Dict = Field(default_factory=dict)
    prefer_local: bool = Field(True)
