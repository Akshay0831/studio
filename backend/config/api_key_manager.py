import json
import os
import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

class APIKeyProfile:
    def __init__(self, name: str, api_key: str, api_type: str = "replicate", is_active: bool = True):
        self.name = name
        self.api_key = api_key
        self.api_type = api_type.lower()
        self.is_active = is_active
        self.models = []
        self.default_model = None
        self.rate_limit = 100
        self.usage_count = 0
        self.last_used = None
        self.created_at = None
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "api_key": self.api_key,
            "api_type": self.api_type,
            "is_active": self.is_active,
            "models": self.models,
            "default_model": self.default_model,
            "rate_limit": self.rate_limit,
            "usage_count": self.usage_count,
            "last_used": self.last_used,
            "created_at": self.created_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "APIKeyProfile":
        profile = cls(
            name=data["name"],
            api_key=data["api_key"],
            api_type=data.get("api_type", "replicate"),
            is_active=data.get("is_active", True)
        )
        profile.models = data.get("models", [])
        profile.default_model = data.get("default_model")
        profile.rate_limit = data.get("rate_limit", 100)
        profile.usage_count = data.get("usage_count", 0)
        profile.last_used = data.get("last_used")
        profile.created_at = data.get("created_at")
        return profile

class APIKeyManager:
    def __init__(self):
        self.profiles: Dict[str, APIKeyProfile] = {}
        self.current_profile: Optional[str] = None
        self.config_file = Path(__file__).parent.parent / "api_keys.json"
        self.load_config()
        
    def load_config(self):
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    data = json.load(f)
                    
                for profile_name, profile_data in data.get("profiles", {}).items():
                    self.profiles[profile_name] = APIKeyProfile.from_dict(profile_data)
                    
                self.current_profile = data.get("current_profile")
                
                # Set created_at for new profiles
                for profile_name, profile in self.profiles.items():
                    if profile.created_at is None:
                        profile.created_at = str(profile.usage_count)
                        
            except Exception as e:
                print(f"Error loading API config: {e}")
                
    def save_config(self):
        try:
            data = {
                "current_profile": self.current_profile,
                "profiles": {name: profile.to_dict() for name, profile in self.profiles.items()}
            }
            
            with open(self.config_file, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            print(f"Error saving API config: {e}")
            
    def add_profile(self, name: str, api_key: str, api_type: str = "replicate", is_active: bool = True) -> bool:
        if name in self.profiles:
            return False
            
        profile = APIKeyProfile(name, api_key, api_type, is_active)
        self.profiles[name] = profile
        self.save_config()
        return True
        
    def set_current_profile(self, profile_name: str) -> bool:
        if profile_name not in self.profiles or not self.profiles[profile_name].is_active:
            return False
            
        self.current_profile = profile_name
        self.save_config()
        return True
        
    def get_current_api_key(self) -> Optional[str]:
        if not self.current_profile or self.current_profile not in self.profiles:
            return None
            
        profile = self.profiles[self.current_profile]
        if not profile.is_active:
            return None
            
        return profile.api_key
        
    def get_current_profile(self) -> Optional[APIKeyProfile]:
        if not self.current_profile or self.current_profile not in self.profiles:
            return None
            
        return self.profiles[self.current_profile]
        
    def get_active_profiles(self) -> List[APIKeyProfile]:
        return [profile for profile in self.profiles.values() if profile.is_active]
        
    def update_profile_models(self, profile_name: str, models: List[str], default_model: str = None) -> bool:
        if profile_name not in self.profiles:
            return False
            
        self.profiles[profile_name].models = models
        self.profiles[profile_name].default_model = default_model
        self.save_config()
        return True
        
    def increment_usage(self, profile_name: str):
        if profile_name in self.profiles:
            self.profiles[profile_name].usage_count += 1
            self.profiles[profile_name].last_used = str(datetime.datetime.now())
            self.save_config()
            
    def remove_profile(self, profile_name: str) -> bool:
        if profile_name not in self.profiles:
            return False
            
        if len(self.profiles) == 1:
            return False
            
        del self.profiles[profile_name]
        
        if self.current_profile == profile_name:
            self.current_profile = next(iter(self.profiles.keys()))
            
        self.save_config()
        return True
        
    def create_default_profiles(self):
        """Create default API key profiles for common APIs"""
        
        # Replicate API
        if os.getenv("REPLICATE_API_KEY"):
            self.add_profile(
                name="Replicate",
                api_key=os.getenv("REPLICATE_API_KEY"),
                api_type="replicate",
                is_active=True
            )
            self.update_profile_models(
                "Replicate",
                models=[
                    "stable-diffusion-xl",
                    "stable-diffusion",
                    "flux-pro",
                    "dall-e-3"
                ],
                default_model="stable-diffusion-xl"
            )
            
        # RunPod API
        if os.getenv("RUNPOD_API_KEY"):
            self.add_profile(
                name="RunPod",
                api_key=os.getenv("RUNPOD_API_KEY"),
                api_type="runpod",
                is_active=True
            )
            self.update_profile_models(
                "RunPod",
                models=[
                    "stable-diffusion-xl",
                    "flux-schnell",
                    "stable-diffusion-3-medium"
                ],
                default_model="stable-diffusion-xl"
            )
            
        # OpenAI API (if available)
        if os.getenv("OPENAI_API_KEY"):
            self.add_profile(
                name="OpenAI",
                api_key=os.getenv("OPENAI_API_KEY"),
                api_type="openai",
                is_active=True
            )
            self.update_profile_models(
                "OpenAI",
                models=[
                    "dall-e-3",
                    "gpt-4-vision",
                    "gpt-4-turbo"
                ],
                default_model="dall-e-3"
            )
            
        # Set a default profile if available
        if self.profiles:
            self.current_profile = next(iter(self.profiles.keys()))
            self.save_config()

    def activate_profile(self, profile_name: str) -> bool:
        """Activate a profile."""
    def activate_profile(self, profile_name: str) -> bool:
        """Activate a profile."""
        if profile_name in self.profiles:
            self.profiles[profile_name].is_active = True
            self.save_config()
            return True
        return False
        
    def deactivate_profile(self, profile_name: str) -> bool:
        """Deactivate a profile."""
        if profile_name in self.profiles:
            self.profiles[profile_name].is_active = False
            self.save_config()
            return True
        return False

# Global API key manager instance
api_key_manager = APIKeyManager()