#!/usr/bin/env python3

"""
Simple test server to verify API management functionality
"""

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
import json
from datetime import datetime, timezone
from enum import Enum

app = FastAPI(
    title="Simple API Management Test Server",
    description="Test server for API management functionality",
    version="1.0.0",
    docs_url="/docs"
)

# Mock in-memory storage
profiles_db = {}
usage_stats = {}

class ApiStatus(Enum):
    SUCCESS = "success"
    ERROR = "error"
    RATE_LIMITED = "rate_limited"
    INVALID_KEY = "invalid_key"

class ApiProfile(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    api_key: str = Field(..., min_length=1)
    api_type: str = Field(..., pattern=r'^(replicate|runpod|openai)$')
    is_active: bool = True
    models: List[str] = Field(default_factory=list)
    default_model: str = None
    rate_limit: int = Field(default=60, ge=1, le=1000)

class ApiProfileCreate(ApiProfile):
    pass

class ApiProfileUpdate(BaseModel):
    name: str = Field(None, min_length=1, max_length=100)
    api_key: str = Field(None, min_length=1)
    is_active: bool = None
    models: List[str] = None
    default_model: str = None
    rate_limit: int = Field(None, ge=1, le=1000)

class ApiProfileResponse(ApiProfile):
    id: str
    usage_count: int
    last_used: str = None
    created_at: str

class GenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    model: str = Field(..., min_length=1)
    api_profile_id: Optional[str] = None
    negative_prompt: Optional[str] = Field(None, max_length=500)
    generation_type: str = Field(..., pattern=r'^(image|audio|text)$')

class GenerationResponse(BaseModel):
    id: str
    status: str
    result: Optional[str] = None
    error: Optional[str] = None
    api_profile_id: Optional[str] = None
    model: str
    prompt: str
    timestamp: str

def validate_api_key(api_key: str, api_type: str) -> bool:
    """Basic validation"""
    if not api_key or len(api_key.strip()) < 1:
        return False
    
    # Basic format validation
    if api_type == 'replicate':
        return api_key.startswith('r8_') and len(api_key) == 64
    elif api_type == 'openai':
        # Temporarily relaxed for testing
        return api_key.startswith('sk-') and len(api_key) >= 20
    elif api_type == 'runpod':
        return api_key.startswith('runpod-') and len(api_key) >= 20
    
    return False

def get_models_for_provider(api_type: str) -> List[str]:
    """Get available models for each provider"""
    models_by_provider = {
        'replicate': ['stable-diffusion', 'sd-xl', 'whisper', 'mistral'],
        'runpod': ['stable-diffusion', 'sdxl-turbo', 'flux', 'speecht5', 'llama3'],
        'openai': ['dall-e-3', 'gpt-4', 'gpt-3.5-turbo', 'whisper-1']
    }
    return models_by_provider.get(api_type, [])

@app.get("/api/api-management/providers")
async def get_providers():
    """Get all available API providers"""
    return {
        "providers": [
            {
                "id": "replicate",
                "name": "Replicate",
                "description": "AI model hosting platform",
                "website": "https://replicate.com",
                "icon": "🧪"
            },
            {
                "id": "runpod", 
                "name": "RunPod",
                "description": "GPU computing platform",
                "website": "https://runpod.io",
                "icon": "🚀"
            },
            {
                "id": "openai",
                "name": "OpenAI", 
                "description": "Large language models",
                "website": "https://openai.com",
                "icon": "🤖"
            }
        ]
    }

@app.get("/api/api-management/profiles")
async def get_all_profiles():
    """Get all API profiles"""
    profiles = []
    for profile_id, profile in profiles_db.items():
        profile_data = profile.copy()
        profile_data['id'] = profile_id
        profile_data['created_at'] = profile_data.pop('created_at').isoformat()
        if profile_data['last_used']:
            profile_data['last_used'] = profile_data['last_used'].isoformat()
        profiles.append(profile_data)
    
    return {"profiles": profiles}

@app.post("/api/api-management/profiles")
async def create_profile(profile: ApiProfileCreate):
    """Create a new API profile"""
    # Validate API key
    if not validate_api_key(profile.api_key, profile.api_type):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid {profile.api_type} API key format"
        )
    
    # Validate models
    available_models = get_models_for_provider(profile.api_type)
    if profile.models:
        invalid_models = [model for model in profile.models if model not in available_models]
        if invalid_models:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid models for {profile.api_type}: {', '.join(invalid_models)}"
            )
    
    # Create profile
    profile_id = str(uuid.uuid4())
    profile_data = {
        **profile.dict(exclude={'models'}),
        'models': profile.models,
        'usage_count': 0,
        'last_used': None,
        'created_at': datetime.now(timezone.utc)
    }
    
    profiles_db[profile_id] = profile_data
    usage_stats[profile_id] = {
        'total_requests': 0,
        'successful_requests': 0,
        'failed_requests': 0,
        'last_used': None
    }
    
    # Format response
    response = profile_data.copy()
    response['id'] = profile_id
    response['created_at'] = response.pop('created_at').isoformat()
    
    return response

@app.get("/api/generation/generate")
async def generate_content(request: GenerationRequest):
    """Generate content using selected API profile"""
    
    # Validate API profile if provided
    if request.api_profile_id:
        if request.api_profile_id not in profiles_db:
            raise HTTPException(status_code=404, detail="API profile not found")
        
        profile = profiles_db[request.api_profile_id]
        if not profile['is_active']:
            raise HTTPException(status_code=400, detail="API profile is not active")
        
        if request.model not in profile['models']:
            raise HTTPException(
                status_code=400, 
                detail=f"Model {request.model} not available in this profile"
            )
    
    # Mock generation response
    result = {
        'id': f"gen_{int(datetime.now().timestamp())}",
        'status': 'completed',
        'result': f"Generated {request.generation_type} with {request.model}: {request.prompt}",
        'error': None,
        'progress': 100,
        'api_profile_id': request.api_profile_id,
        'model': request.model,
        'prompt': request.prompt,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    
    # Update usage stats
    if request.api_profile_id and request.api_profile_id in profiles_db:
        profiles_db[request.api_profile_id]['usage_count'] += 1
        profiles_db[request.api_profile_id]['last_used'] = datetime.now(timezone.utc)
    
    return GenerationResponse(**result)

@app.get("/api/generation/models")
async def get_available_models(api_type: str):
    """Get available models for a specific API provider"""
    if api_type not in ['replicate', 'runpod', 'openai']:
        raise HTTPException(status_code=400, detail="Invalid API provider")
    
    models = get_models_for_provider(api_type)
    return {"api_type": api_type, "models": models}

if __name__ == "__main__":
    import uvicorn
    print("Starting simple test server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")