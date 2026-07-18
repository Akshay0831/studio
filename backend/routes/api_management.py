from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict, List, Optional
from config.api_key_manager import api_key_manager, APIKeyProfile
from config.api_profiles import get_api_profile, get_available_models, get_model_config

router = APIRouter(prefix="/api", tags=["api_management"])

class APIKeyRequest(BaseModel):
    name: str
    api_key: str
    api_type: str = "replicate"
    is_active: bool = True

class ModelConfigRequest(BaseModel):
    model_name: str
    default_prompt: Optional[str] = None
    default_steps: Optional[int] = None
    default_size: Optional[str] = None

@router.get("/api-keys")
async def get_api_profiles():
    """Get all API key profiles."""
    profiles = {}
    for name, profile in api_key_manager.profiles.items():
        profiles[name] = {
            "name": profile.name,
            "api_type": profile.api_type,
            "is_active": profile.is_active,
            "models": profile.models,
            "default_model": profile.default_model,
            "usage_count": profile.usage_count,
            "last_used": profile.last_used,
            "api_profile": get_api_profile(profile.api_type)
        }
    
    return {
        "profiles": profiles,
        "current_profile": api_key_manager.current_profile,
        "total_profiles": len(profiles)
    }

@router.post("/api-keys")
async def add_api_profile(request: APIKeyRequest):
    """Add a new API key profile."""
    if api_key_manager.add_profile(
        name=request.name,
        api_key=request.api_key,
        api_type=request.api_type,
        is_active=request.is_active
    ):
        # Add default models for this API type
        available_models = get_available_models(request.api_type)
        if available_models:
            api_key_manager.update_profile_models(
                request.name,
                available_models,
                available_models[0]
            )
        
        return {"message": "API profile added successfully", "name": request.name}
    else:
        raise HTTPException(status_code=400, detail="Profile name already exists")

@router.put("/api-keys/{profile_name}/activate")
async def activate_profile(profile_name: str):
    """Activate a specific API profile."""
    if profile_name not in api_key_manager.profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    api_key_manager.profiles[profile_name].is_active = True
    api_key_manager.save_config()
    
    return {"message": f"Profile '{profile_name}' activated"}

@router.put("/api-keys/{profile_name}/deactivate")
async def deactivate_profile(profile_name: str):
    """Deactivate a specific API profile."""
    if profile_name not in api_key_manager.profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    api_key_manager.profiles[profile_name].is_active = False
    api_key_manager.save_config()
    
    return {"message": f"Profile '{profile_name}' deactivated"}

@router.delete("/api-keys/{profile_name}")
async def delete_profile(profile_name: str):
    """Delete an API profile."""
    if api_key_manager.remove_profile(profile_name):
        return {"message": f"Profile '{profile_name}' deleted"}
    else:
        raise HTTPException(status_code=400, detail="Cannot delete profile or not found")

@router.post("/api-keys/{profile_name}/set-current")
async def set_current_profile(profile_name: str):
    """Set the current API profile."""
    if api_key_manager.set_current_profile(profile_name):
        return {"message": f"Current profile set to '{profile_name}'"}
    else:
        raise HTTPException(status_code=400, detail="Profile not found or not active")

@router.get("/api-keys/{profile_name}/models")
async def get_profile_models(profile_name: str):
    """Get available models for a profile."""
    if profile_name not in api_key_manager.profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = api_key_manager.profiles[profile_name]
    profile_info = get_api_profile(profile.api_type)
    
    return {
        "profile_name": profile_name,
        "api_type": profile.api_type,
        "available_models": list(profile_info.get("models", {}).keys()),
        "configured_models": profile.models,
        "default_model": profile.default_model
    }

@router.get("/api-keys/{profile_name}/model-config/{model_name}")
async def get_model_configuration(profile_name: str, model_name: str):
    """Get model configuration for a specific profile."""
    if profile_name not in api_key_manager.profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = api_key_manager.profiles[profile_name]
    model_config = get_model_config(profile.api_type, model_name)
    
    if not model_config:
        raise HTTPException(status_code=404, detail="Model not found for this API")
    
    return {
        "profile_name": profile_name,
        "model_name": model_name,
        "model_config": model_config
    }

@router.put("/api-keys/{profile_name}/models")
async def update_profile_models(profile_name: str, request: ModelConfigRequest):
    """Update model configuration for a profile."""
    if profile_name not in api_key_manager.profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = api_key_manager.profiles[profile_name]
    
    # Add model to profile if not already there
    if request.model_name not in profile.models:
        profile.models.append(request.model_name)
    
    # Update model configuration
    model_config = get_model_config(profile.api_type, request.model_name)
    if not model_config:
        raise HTTPException(status_code=404, detail="Model not found for this API")
    
    # Set default model if requested
    if request.model_name == request.default_prompt or request.default_model:
        profile.default_model = request.model_name
    
    api_key_manager.save_config()
    
    return {
        "message": "Model configuration updated",
        "profile_name": profile_name,
        "model_name": request.model_name,
        "default_model": profile.default_model
    }

@router.get("/api-keys/switch/{profile_name}")
async def switch_to_profile(profile_name: str):
    """Quick switch to a specific profile and return its details."""
    if api_key_manager.set_current_profile(profile_name):
        profile = api_key_manager.profiles[profile_name]
        api_key_manager.increment_usage(profile_name)
        
        current_profile_info = {
            "current_profile": profile_name,
            "api_type": profile.api_type,
            "api_key_available": bool(profile.api_key),
            "is_active": profile.is_active,
            "models_count": len(profile.models),
            "usage_count": profile.usage_count,
            "last_used": profile.last_used
        }
        
        return current_profile_info
    else:
        raise HTTPException(status_code=400, detail="Cannot switch to profile")

@router.get("/api-keys/stats")
async def get_api_usage_stats():
    """Get usage statistics for all API profiles."""
    stats = {}
    
    for name, profile in api_key_manager.profiles.items():
        stats[name] = {
            "usage_count": profile.usage_count,
            "last_used": profile.last_used,
            "is_active": profile.is_active,
            "api_type": profile.api_type,
            "total_models": len(profile.models),
            "default_model": profile.default_model
        }
    
    return {
        "total_profiles": len(api_key_manager.profiles),
        "active_profiles": len([p for p in api_key_manager.profiles.values() if p.is_active]),
        "current_profile": api_key_manager.current_profile,
        "usage_stats": stats
    }