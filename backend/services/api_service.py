import requests
import json
import time
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from enum import Enum

logger = logging.getLogger("studio.backend.services.api_service")

class ApiStatus(Enum):
    SUCCESS = "success"
    ERROR = "error"
    RATE_LIMITED = "rate_limited"
    INVALID_KEY = "invalid_key"

class ApiService:
    """Service to handle API key validation and generation requests"""
    
    def __init__(self):
        self.rate_limits = {}  # Track rate limits per profile
        self.last_requests = {}  # Track last request times per profile
        self.api_configs = {
            'replicate': {
                'base_url': 'https://api.replicate.com/v1',
                'models_endpoint': '/predictions',
                'status_endpoint': '/predictions/{prediction_id}',
                'headers': {'Authorization': 'Bearer {api_key}', 'Content-Type': 'application/json'},
                'rate_limits': {
                    'requests_per_minute': 60,
                    'requests_per_hour': 1000
                },
                'model_configs': {
                    'stable-diffusion': {
                        'type': 'image_generation',
                        'default_prompt': '',
                        'supports_steps': True,
                        'default_steps': 20,
                        'max_steps': 100,
                        'supports_size': True,
                        'default_size': '512x512',
                        'max_size': '1024x1024'
                    },
                    'whisper': {
                        'type': 'audio_generation',
                        'default_prompt': '',
                        'supports_negative_prompt': False
                    }
                }
            },
            'runpod': {
                'base_url': 'https://api.runpod.io/v2',
                'models_endpoint': '//{model}/run',
                'status_endpoint': '/{model}/run/{run_id}',
                'headers': {'Authorization': 'Bearer {api_key}', 'Content-Type': 'application/json'},
                'rate_limits': {
                    'requests_per_minute': 100,
                    'requests_per_hour': 2000
                }
            },
            'openai': {
                'base_url': 'https://api.openai.com/v1',
                'models_endpoint': '/images/generations',
                'status_endpoint': None,
                'headers': {'Authorization': 'Bearer {api_key}', 'Content-Type': 'application/json'},
                'rate_limits': {
                    'requests_per_minute': 50,
                    'requests_per_hour': 500
                },
                'model_configs': {
                    'dall-e-3': {
                        'type': 'image_generation',
                        'default_prompt': '',
                        'supports_size': True,
                        'default_size': '1024x1024',
                        'max_size': '1024x1024'
                    },
                    'gpt-4': {
                        'type': 'text_generation',
                        'default_prompt': '',
                        'max_tokens': 4096
                    }
                }
            }
        }
    
    def validate_api_key(self, api_key: str, api_type: str) -> Dict[str, Any]:
        """Validate API key by making a test request"""
        try:
            config = self.api_configs[api_type]
            headers = config['headers'].format(api_key=api_key)
            
            # Make a test request based on the API type
            if api_type == 'replicate':
                # Test with list models endpoint
                url = f"{config['base_url']}/models"
                response = requests.get(url, headers=headers, timeout=10)
                
            elif api_type == 'runpod':
                # Test with health endpoint or a simple model run
                url = f"{config['base_url']}/health"
                response = requests.get(url, headers=headers, timeout=10)
                
            elif api_type == 'openai':
                # Test with models list endpoint
                url = f"{config['base_url']}/models"
                response = requests.get(url, headers=headers, timeout=10)
                
            else:
                return {'status': ApiStatus.ERROR, 'message': 'Unsupported API type'}
            
            if response.status_code == 200:
                return {'status': ApiStatus.SUCCESS, 'message': 'API key is valid'}
            else:
                return {'status': ApiStatus.INVALID_KEY, 'message': f'Invalid API key: {response.text}'}
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API validation error for {api_type}: {e}")
            return {'status': ApiStatus.ERROR, 'message': f'Network error: {str(e)}'}
        except Exception as e:
            logger.error(f"Unexpected error during API validation: {e}")
            return {'status': ApiStatus.ERROR, 'message': f'Unexpected error: {str(e)}'}
    
    def check_rate_limit(self, profile_id: str) -> bool:
        """Check if rate limit allows another request"""
        if profile_id not in self.rate_limits:
            self.rate_limits[profile_id] = {
                'requests_this_minute': 0,
                'requests_this_hour': 0,
                'reset_time_minute': datetime.now(timezone.utc),
                'reset_time_hour': datetime.now(timezone.utc)
            }
        
        rate_limit = self.rate_limits[profile_id]
        now = datetime.now(timezone.utc)
        
        # Reset minute counter if needed
        if now >= rate_limit['reset_time_minute']:
            rate_limit['requests_this_minute'] = 0
            rate_limit['reset_time_minute'] = now.replace(second=0, microsecond=0) + timezone.utc
        
        # Reset hour counter if needed  
        if now >= rate_limit['reset_time_hour']:
            rate_limit['requests_this_hour'] = 0
            rate_limit['reset_time_hour'] = now.replace(minute=0, second=0, microsecond=0) + timezone.utc
        
        return rate_limit['requests_this_minute'] < 60
    
    def increment_rate_limit(self, profile_id: str):
        """Increment rate limit counter"""
        if profile_id in self.rate_limits:
            self.rate_limits[profile_id]['requests_this_minute'] += 1
            self.rate_limits[profile_id]['requests_this_hour'] += 1
            self.last_requests[profile_id] = datetime.now(timezone.utc)
    
    async def generate_image(self, profile_id: str, model: str, prompt: str, **kwargs) -> Dict[str, Any]:
        """Generate image using selected API profile"""
        # This would integrate with the actual generation services
        # For now, return a mock response
        return {
            'id': f"gen_{int(time.time())}",
            'status': 'completed',
            'result': f"Generated image with {model}",
            'prompt': prompt,
            'api_profile': profile_id,
            'model': model,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    async def generate_audio(self, profile_id: str, model: str, prompt: str, **kwargs) -> Dict[str, Any]:
        """Generate audio using selected API profile"""
        # This would integrate with the actual generation services
        # For now, return a mock response
        return {
            'id': f"audio_{int(time.time())}",
            'status': 'completed',
            'result': f"Generated audio with {model}",
            'prompt': prompt,
            'api_profile': profile_id,
            'model': model,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    async def generate_text(self, profile_id: str, model: str, prompt: str, **kwargs) -> Dict[str, Any]:
        """Generate text using selected API profile"""
        # This would integrate with the actual generation services
        # For now, return a mock response
        return {
            'id': f"text_{int(time.time())}",
            'status': 'completed',
            'result': f"Generated text with {model}: {prompt}",
            'prompt': prompt,
            'api_profile': profile_id,
            'model': model,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    async def make_generation_request(self, profile_id: str, model: str, prompt: str, generation_type: str, **kwargs) -> Dict[str, Any]:
        """Make a generation request using the selected profile"""
        # Check rate limit
        if not self.check_rate_limit(profile_id):
            return {
                'status': 'error',
                'message': 'Rate limit exceeded. Please try again later.',
                'error_code': 'rate_limited'
            }
        
        # Increment rate limit
        self.increment_rate_limit(profile_id)
        
        # Route to appropriate generation method
        if generation_type == 'image':
            return await self.generate_image(profile_id, model, prompt, **kwargs)
        elif generation_type == 'audio':
            return await self.generate_audio(profile_id, model, prompt, **kwargs)
        elif generation_type == 'text':
            return await self.generate_text(profile_id, model, prompt, **kwargs)
        else:
            return {
                'status': 'error',
                'message': f'Unsupported generation type: {generation_type}',
                'error_code': 'unsupported_type'
            }
    
    def get_model_config(self, api_type: str, model: str) -> Optional[Dict[str, Any]]:
        """Get configuration for a specific model"""
        if api_type in self.api_configs and 'model_configs' in self.api_configs[api_type]:
            return self.api_configs[api_type]['model_configs'].get(model)
        return None
    
    def get_available_models(self, api_type: str) -> List[Dict[str, Any]]:
        """Get all available models for an API type"""
        if api_type not in self.api_configs:
            return []
        
        models = []
        if 'model_configs' in self.api_configs[api_type]:
            for model_id, config in self.api_configs[api_type]['model_configs'].items():
                models.append({
                    'id': model_id,
                    'type': config.get('type', 'unknown'),
                    'name': model_id.replace('-', ' ').title(),
                    'config': config
                })
        else:
            # For APIs without detailed model configs, return basic info
            models.append({
                'id': model,
                'type': 'unknown',
                'name': model.replace('-', ' ').title()
            })
        
        return models
    
    def get_provider_info(self, api_type: str) -> Optional[Dict[str, Any]]:
        """Get information about an API provider"""
        if api_type not in self.api_configs:
            return None
        
        config = self.api_configs[api_type]
        return {
            'name': api_type.title(),
            'base_url': config['base_url'],
            'rate_limits': config['rate_limits'],
            'description': f"AI service provider via {api_type}",
            'supported_generation_types': self._get_supported_types(api_type)
        }
    
    def _get_supported_types(self, api_type: str) -> List[str]:
        """Get supported generation types for an API"""
        if api_type == 'replicate':
            return ['image', 'audio', 'text']
        elif api_type == 'runpod':
            return ['image', 'audio', 'text']
        elif api_type == 'openai':
            return ['image', 'text', 'audio']
        return []

# Global service instance
api_service = ApiService()