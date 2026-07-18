from typing import Dict, List, Any, Optional

# Predefined API profiles with model configurations
API_PROFILES = {
    "replicate": {
        "name": "Replicate",
        "description": "Replicate AI API for model inference",
        "models": {
            "stable-diffusion-xl": {
                "display_name": "Stable Diffusion XL",
                "type": "image_generation",
                "default_prompt": "Generate an image of",
                "supports_negative_prompt": True,
                "supports_steps": True,
                "default_steps": 30,
                "max_steps": 100,
                "supports_cfg": True,
                "default_cfg": 7.5,
                "supports_size": True,
                "default_size": "1024x1024",
                "max_size": "2048x2048"
            },
            "stable-diffusion": {
                "display_name": "Stable Diffusion 2.1",
                "type": "image_generation",
                "default_prompt": "Generate an image of",
                "supports_negative_prompt": True,
                "supports_steps": True,
                "default_steps": 25,
                "max_steps": 75,
                "supports_cfg": True,
                "default_cfg": 7.0,
                "supports_size": True,
                "default_size": "512x512",
                "max_size": "1024x1024"
            },
            "flux-pro": {
                "display_name": "Flux Pro",
                "type": "image_generation",
                "default_prompt": "Generate an image of",
                "supports_negative_prompt": True,
                "supports_steps": True,
                "default_steps": 50,
                "max_steps": 150,
                "supports_cfg": True,
                "default_cfg": 3.5,
                "supports_size": True,
                "default_size": "1024x1024",
                "max_size": "4096x4096",
                "supports_ultra_detail": True
            },
            "dall-e-3": {
                "display_name": "DALL-E 3",
                "type": "image_generation",
                "default_prompt": "Generate an image of",
                "supports_negative_prompt": False,
                "supports_steps": False,
                "supports_cfg": False,
                "supports_size": True,
                "default_size": "1024x1024",
                "max_size": "1024x1024"
            }
        }
    },
    "runpod": {
        "name": "RunPod",
        "description": "RunPod API for model inference",
        "models": {
            "stable-diffusion-xl": {
                "display_name": "Stable Diffusion XL",
                "type": "image_generation",
                "default_prompt": "Generate an image of",
                "supports_negative_prompt": True,
                "supports_steps": True,
                "default_steps": 30,
                "max_steps": 100,
                "supports_cfg": True,
                "default_cfg": 7.5,
                "supports_size": True,
                "default_size": "1024x1024",
                "max_size": "2048x2048"
            },
            "flux-schnell": {
                "display_name": "Flux Schnell",
                "type": "image_generation",
                "default_prompt": "Generate an image of",
                "supports_negative_prompt": True,
                "supports_steps": True,
                "default_steps": 25,
                "max_steps": 75,
                "supports_cfg": True,
                "default_cfg": 3.5,
                "supports_size": True,
                "default_size": "1024x1024",
                "max_size": "4096x4096"
            },
            "stable-diffusion-3-medium": {
                "display_name": "Stable Diffusion 3 Medium",
                "type": "image_generation",
                "default_prompt": "Generate an image of",
                "supports_negative_prompt": True,
                "supports_steps": True,
                "default_steps": 35,
                "max_steps": 100,
                "supports_cfg": True,
                "default_cfg": 7.5,
                "supports_size": True,
                "default_size": "1024x1024",
                "max_size": "2048x2048"
            }
        }
    },
    "openai": {
        "name": "OpenAI",
        "description": "OpenAI API for model inference",
        "models": {
            "dall-e-3": {
                "display_name": "DALL-E 3",
                "type": "image_generation",
                "default_prompt": "Generate an image of",
                "supports_negative_prompt": False,
                "supports_steps": False,
                "supports_cfg": False,
                "supports_size": True,
                "default_size": "1024x1024",
                "max_size": "1024x1024"
            },
            "gpt-4-vision": {
                "display_name": "GPT-4 Vision",
                "type": "vision_analysis",
                "default_prompt": "Analyze this image:",
                "supports_negative_prompt": False,
                "supports_steps": False,
                "supports_cfg": False,
                "supports_size": True,
                "default_size": "1024x1024",
                "max_size": "4096x4096"
            },
            "gpt-4-turbo": {
                "display_name": "GPT-4 Turbo",
                "type": "text_generation",
                "default_prompt": "Generate text based on",
                "supports_negative_prompt": False,
                "supports_steps": False,
                "supports_cfg": False,
                "supports_size": False
            }
        }
    }
}

def get_api_profile(api_type: str) -> Dict[str, Any]:
    """Get API profile configuration for specified API type."""
    return API_PROFILES.get(api_type, {})

def get_model_config(api_type: str, model_name: str) -> Dict[str, Any]:
    """Get model configuration for specified API and model."""
    profile = get_api_profile(api_type)
    return profile.get("models", {}).get(model_name, {})

def get_available_models(api_type: str) -> List[str]:
    """Get list of available models for specified API type."""
    profile = get_api_profile(api_type)
    return list(profile.get("models", {}).keys())

def get_default_model(api_type: str) -> Optional[str]:
    """Get default model for specified API type."""
    profile = get_api_profile(api_type)
    models = list(profile.get("models", {}).keys())
    return models[0] if models else None

def validate_model_config(api_type: str, model_name: str, config: Dict[str, Any]) -> bool:
    """Validate model configuration against API profile constraints."""
    model_config = get_model_config(api_type, model_name)
    if not model_config:
        return False
    
    # Validate steps if supported
    if config.get("steps") and model_config.get("supports_steps"):
        steps = config.get("steps", 0)
        if steps < 1 or steps > model_config.get("max_steps", 100):
            return False
    
    # Validate CFG if supported
    if config.get("cfg") and model_config.get("supports_cfg"):
        cfg = config.get("cfg", 0)
        if cfg < 1 or cfg > 10:
            return False
    
    # Validate size if supported
    if config.get("size") and model_config.get("supports_size"):
        try:
            width, height = map(int, config.get("size", "1024x1024").split("x"))
            max_width, max_height = map(int, model_config.get("max_size", "2048x2048").split("x"))
            if width > max_width or height > max_height:
                return False
        except ValueError:
            return False
    
    return True