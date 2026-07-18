from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import json
import logging
from datetime import datetime
from services.api_service import api_service
from utils.dependency_manager import get_current_user
from routes.api_management.api_management import profiles_db
from utils.api_error_handler import handle_rate_limit_error
from utils.rate_limiter import rate_limiter
logger = logging.getLogger("studio.backend.routes.generation")

router = APIRouter(prefix="/api/generation", tags=["generation"])

class GenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    model: str = Field(..., min_length=1)
    api_profile_id: Optional[str] = None
    negative_prompt: Optional[str] = Field(None, max_length=500)
    steps: Optional[int] = Field(None, ge=1, le=100)
    size: Optional[str] = Field(None, pattern=r'^\d+x\d+$')
    batch_size: Optional[int] = Field(None, ge=1, le=10)
    seed: Optional[int] = Field(None, ge=0, le=4294967295)
    generation_type: str = Field(..., pattern=r'^(image|audio|text)$')

class GenerationResponse(BaseModel):
    id: str
    status: str
    result: Optional[str] = None
    error: Optional[str] = None
    progress: int = 0
    estimated_time: Optional[int] = None
    api_profile_id: Optional[str] = None
    model: str
    prompt: str
    timestamp: str

@router.post("/generate")
async def generate_content(request: GenerationRequest, current_user = Depends(get_current_user)):
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
        
        # Check rate limit
        check_profile_rate_limit(request.api_profile_id, profile['rate_limit'])
        
        api_profile_id = request.api_profile_id
    else:
        # If no profile specified, try to find an active one
        active_profiles = [p for p in profiles_db.values() if p['is_active']]
        if not active_profiles:
            raise HTTPException(
                status_code=400,
                detail="No active API profiles available. Please add an API profile."
            )
        
        # Use first active profile
        api_profile_id = list(active_profiles)[0]['id']
        
        # Check rate limit
        check_profile_rate_limit(api_profile_id, active_profiles[0]['rate_limit'])
    
    # Prepare generation parameters
    generation_params = {
        'profile_id': api_profile_id,
        'model': request.model,
        'prompt': request.prompt,
        'generation_type': request.generation_type
    }
    
    # Add optional parameters
    if request.steps:
        generation_params['steps'] = request.steps
    if request.size:
        generation_params['size'] = request.size
    if request.batch_size:
        generation_params['batch_size'] = request.batch_size
    if request.seed:
        generation_params['seed'] = request.seed
    
    # Make the generation request
    try:
        result = await api_service.make_generation_request(**generation_params)
        
        # Update usage stats for the profile
        if api_profile_id in profiles_db:
            profiles_db[api_profile_id]['usage_count'] += 1
            profiles_db[api_profile_id]['last_used'] = datetime.now()
        
        return GenerationResponse(
            id=result.get('id', f"gen_{int(datetime.now().timestamp())}"),
            status=result.get('status', 'completed'),
            result=result.get('result'),
            error=result.get('error'),
            progress=100 if result.get('status') == 'completed' else 0,
            api_profile_id=api_profile_id,
            model=request.model,
            prompt=request.prompt,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@router.get("/models")
async def get_available_models(api_type: str, current_user = Depends(get_current_user)):
    """Get available models for a specific API provider"""
    if api_type not in ['replicate', 'runpod', 'openai']:
        raise HTTPException(status_code=400, detail="Invalid API provider")
    
    models = api_service.get_available_models(api_type)
    return {"api_type": api_type, "models": models}

@router.get("/providers")
async def get_providers(current_user = Depends(get_current_user)):
    """Get all available API providers"""
    providers = {}
    for api_type in ['replicate', 'runpod', 'openai']:
        provider_info = api_service.get_provider_info(api_type)
        if provider_info:
            providers[api_type] = provider_info
    
    return {"providers": providers}

@router.get("/status/{generation_id}")
async def get_generation_status(generation_id: str, current_user = Depends(get_current_user)):
    """Get status of a generation request"""
    # In a real implementation, this would check the actual generation status
    # For now, return a mock response
    return {
        "id": generation_id,
        "status": "completed",
        "progress": 100,
        "message": "Generation completed successfully"
    }

@router.get("/types")
async def get_generation_types(current_user = Depends(get_current_user)):
    """Get available generation types"""
    return {
        "types": [
            {
                "id": "image",
                "name": "Image Generation",
                "description": "Generate images from text prompts"
            },
            {
                "id": "audio", 
                "name": "Audio Generation",
                "description": "Generate audio from text prompts"
            },
            {
                "id": "text",
                "name": "Text Generation", 
                "description": "Generate text using language models"
            }
        ]
    }

@router.get("/models/{model_id}/config")
async def get_model_config(model_id: str, current_user = Depends(get_current_user)):
    """Get configuration for a specific model"""
    # Search across all providers for this model
    for api_type in ['replicate', 'runpod', 'openai']:
        config = api_service.get_model_config(api_type, model_id)
        if config:
            return {
                "model_id": model_id,
                "api_type": api_type,
                "config": config
            }
    
    raise HTTPException(status_code=404, detail=f"Model {model_id} not found")

@router.get("/profiles/{profile_id}/usage")
async def get_profile_usage(profile_id: str, current_user = Depends(get_current_user)):
    """Get usage statistics for a profile"""
    if profile_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = profiles_db[profile_id]
    
    # Get provider info
    provider_info = api_service.get_provider_info(profile['api_type'])
    
    return {
        "profile_id": profile_id,
        "profile_name": profile['name'],
        "api_type": profile['api_type'],
        "usage_count": profile['usage_count'],
        "last_used": profile['last_used'].isoformat() if profile['last_used'] else None,
        "available_models": len(profile['models']),
        "rate_limit": profile['rate_limit'],
        "provider_info": provider_info
    }