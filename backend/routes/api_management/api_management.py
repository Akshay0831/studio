from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from config.config import settings
from utils.dependency_manager import get_current_user
from utils.api_error_handler import (
    APIError, 
    create_error_response, 
    handle_api_key_validation_error,
    handle_rate_limit_error,
    handle_model_not_available_error
)
from utils.rate_limiter import rate_limiter
router = APIRouter(prefix="/api/api-management", tags=["api-management"])

def check_profile_rate_limit(profile_id: str, profile_rate_limit: int = 60):
    """Check if a profile has exceeded its rate limit"""
    is_allowed, remaining = rate_limiter.is_allowed(profile_id, profile_rate_limit, 60)
    if not is_allowed:
        raise handle_rate_limit_error(profile_id)
    return True

# Pydantic models for request/response
class ApiProfileBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    api_key: str = Field(..., min_length=1)
    api_type: str = Field(..., pattern=r'^(replicate|runpod|openai)$')
    is_active: bool = True
    models: List[str] = Field(default_factory=list)
    default_model: str = None
    rate_limit: int = Field(default=60, ge=1, le=1000)

class ApiProfileCreate(ApiProfileBase):
    pass

class ApiProfileUpdate(BaseModel):
    name: str = Field(None, min_length=1, max_length=100)
    api_key: str = Field(None, min_length=1)
    is_active: bool = None
    models: List[str] = None
    default_model: str = None
    rate_limit: int = Field(None, ge=1, le=1000)

class ApiProfileResponse(ApiProfileBase):
    id: str
    usage_count: int
    last_used: str = None
    created_at: str
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# In-memory storage for demonstration (in production, use a database)
profiles_db = {}
usage_stats = {}

def validate_api_key(api_key: str, api_type: str) -> bool:
    """Validate API key format and basic checks"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Validating API key for type {api_type}: {api_key[:10]}...")
    
    if not api_key or len(api_key.strip()) < 1:
        raise handle_api_key_validation_error(api_type, "API key cannot be empty")
    
    # Basic format validation based on API type
    if api_type == 'replicate':
        # Replicate tokens typically start with "r8_" and are 64 chars long
        if not api_key.startswith('r8_'):
            raise handle_api_key_validation_error(api_type, "Replicate tokens must start with 'r8_'")
        if len(api_key) != 64:
            raise handle_api_key_validation_error(api_type, f"Replicate tokens must be 64 characters long, got {len(api_key)}")
        return True
    elif api_type == 'openai':
        # OpenAI API keys typically start with "sk-" and are 51 chars long
        logger.info(f"OpenAI key validation - starts with sk-: {api_key.startswith('sk-')}")
        logger.info(f"OpenAI key length: {len(api_key)}")
        
        if not api_key.startswith('sk-'):
            raise handle_api_key_validation_error(api_type, "OpenAI API keys must start with 'sk-'")
        if len(api_key) < 20:  # Changed from != 51 to < 20 for testing
            raise handle_api_key_validation_error(api_type, f"OpenAI API keys must be at least 20 characters long, got {len(api_key)}")
        return True
    elif api_type == 'runpod':
        # RunPod API keys typically start with "runpod-" and are varying lengths
        if not api_key.startswith('runpod-'):
            raise handle_api_key_validation_error(api_type, "RunPod API keys must start with 'runpod-'")
        if len(api_key) < 20:
            raise handle_api_key_validation_error(api_type, f"RunPod API keys must be at least 20 characters long, got {len(api_key)}")
        return True
    
    # If we get here, the API type is not supported
    raise handle_api_key_validation_error(api_type, f"Unsupported API provider: {api_type}")

def get_models_for_provider(api_type: str) -> List[str]:
    """Get available models for each provider"""
    models_by_provider = {
        'replicate': [
            'stable-diffusion', 'sd-xl', 'sd-turbo', 
            'flux-pro', 'flux-dev', 'whisper',
            'mistral', 'llama', 'phi'
        ],
        'runpod': [
            'stable-diffusion', 'sdxl-turbo', 'flux',
            'speecht5', 'llama3', 'mistral',
            'stable-audio', 'kandinsky'
        ],
        'openai': [
            'dall-e-3', 'dall-e-2', 'gpt-4', 'gpt-4-turbo',
            'gpt-3.5-turbo', 'gpt-3.5-turbo-16k',
            'whisper-1', 'tts-1', 'tts-1-hd'
        ]
    }
    return models_by_provider.get(api_type, [])

def validate_models(api_type: str, models: List[str]) -> None:
    """Validate that models are available for the specified API type"""
    if not models:
        raise handle_model_not_available_error("", api_type, "No models specified")
    
    available_models = get_models_for_provider(api_type)
    invalid_models = [model for model in models if model not in available_models]
    
    if invalid_models:
        raise handle_model_not_available_error(
            ", ".join(invalid_models), 
            api_type, 
            f"The following models are not available for {api_type}: {', '.join(invalid_models)}"
        )

@router.get("/profiles")
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

@router.get("/profiles/{profile_id}")
async def get_profile(profile_id: str):
    """Get a specific API profile"""
    if profile_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = profiles_db[profile_id].copy()
    profile['id'] = profile_id
    profile['created_at'] = profile.pop('created_at').isoformat()
    if profile['last_used']:
        profile['last_used'] = profile['last_used'].isoformat()
    
    return profile

@router.post("/profiles")
async def create_profile(
    profile: ApiProfileCreate,
    current_user = Depends(get_current_user)
):
    """Create a new API profile"""
    # Validate API key
    try:
        validate_api_key(profile.api_key, profile.api_type)
    except Exception as e:
        # The validate_api_key function now raises the appropriate error
        raise e
    
    # Validate models
    validate_models(profile.api_type, profile.models)
    
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

@router.put("/profiles/{profile_id}")
async def update_profile(
    profile_id: str,
    updates: ApiProfileUpdate,
    current_user = Depends(get_current_user)
):
    """Update an existing API profile"""
    if profile_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    existing_profile = profiles_db[profile_id]
    
    # Update fields if provided
    update_data = updates.dict(exclude_unset=True)
    
    if 'api_key' in update_data:
        api_type = update_data.get('api_type', existing_profile['api_type'])
        if not validate_api_key(update_data['api_key'], api_type):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid {api_type} API key format"
            )
    
    if 'models' in update_data:
        available_models = get_models_for_provider(existing_profile['api_type'])
        invalid_models = [model for model in update_data['models'] if model not in available_models]
        if invalid_models:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid models for {existing_profile['api_type']}: {', '.join(invalid_models)}"
            )
        
        # If default model is being updated, validate it's in the models list
        if 'default_model' in update_data and update_data['default_model']:
            if update_data['default_model'] not in update_data['models']:
                raise HTTPException(
                    status_code=400,
                    detail="Default model must be selected from available models"
                )
    
    # Update the profile
    for key, value in update_data.items():
        existing_profile[key] = value
    
    # Format response
    response = existing_profile.copy()
    response['id'] = profile_id
    response['created_at'] = response['created_at'].isoformat()
    if response['last_used']:
        response['last_used'] = response['last_used'].isoformat()
    
    return response

@router.delete("/profiles/{profile_id}")
async def delete_profile(
    profile_id: str,
    current_user = Depends(get_current_user)
):
    """Delete an API profile"""
    if profile_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if profiles_db[profile_id]['is_active']:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete active profiles. Deactivate first."
        )
    
    del profiles_db[profile_id]
    if profile_id in usage_stats:
        del usage_stats[profile_id]
    
    return {"message": "Profile deleted successfully"}

@router.post("/profiles/{profile_id}/activate")
async def activate_profile(
    profile_id: str,
    current_user = Depends(get_current_user)
):
    """Activate an API profile"""
    if profile_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Deactivate all other profiles
    for pid, profile in profiles_db.items():
        if pid != profile_id:
            profile['is_active'] = False
    
    profiles_db[profile_id]['is_active'] = True
    
    return {"message": "Profile activated successfully"}

@router.get("/providers/{api_type}/models")
async def get_models_for_provider_endpoint(api_type: str):
    """Get available models for a specific API provider"""
    if api_type not in ['replicate', 'runpod', 'openai']:
        raise HTTPException(status_code=400, detail="Invalid API provider")
    
    models = get_models_for_provider(api_type)
    
    # Add model metadata
    models_with_metadata = []
    for model in models:
        model_info = {
            'id': model,
            'name': model.replace('-', ' ').title(),
            'type': self._get_model_type(model, api_type)
        }
        models_with_metadata.append(model_info)
    
    return {"api_type": api_type, "models": models_with_metadata}

def _get_model_type(self, model_id: str, api_type: str) -> str:
    """Determine model type based on name patterns"""
    if api_type == 'replicate':
        if model_id.startswith('whisper'):
            return 'audio'
        elif model_id in ['mistral', 'llama', 'phi']:
            return 'text'
        else:
            return 'image'
    elif api_type == 'runpod':
        if model_id.startswith('speecht5') or model_id.startswith('stable-audio'):
            return 'audio'
        elif model_id in ['llama3', 'mistral']:
            return 'text'
        else:
            return 'image'
    elif api_type == 'openai':
        if model_id.startswith('whisper') or model_id.startswith('tts'):
            return 'audio'
        elif model_id.startswith('gpt') or model_id.startswith('dall-e'):
            return model_id.startswith('dall-e') and 'image' or 'text'
        else:
            return 'text'
    
    return 'unknown'

@router.get("/profiles/{profile_id}/usage")
async def get_profile_usage(profile_id: str):
    """Get usage statistics for a profile"""
    if profile_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    usage = usage_stats.get(profile_id, {
        'total_requests': 0,
        'successful_requests': 0,
        'failed_requests': 0,
        'last_used': None
    })
    
    return {
        "profile_id": profile_id,
        "usage": usage,
        "profile_name": profiles_db[profile_id]['name']
    }

@router.get("/providers")
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