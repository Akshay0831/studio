import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Callable
from fastapi import Request, HTTPException, status

logger = logging.getLogger("studio.backend.api_key_validation")

class APIKey:
    """Represents a valid API key with metadata."""
    
    def __init__(self, key: str, name: str, is_active: bool = True,
                 rate_limit: Optional[int] = None, scopes: List[str] = None):
        self.key = key
        self.name = name
        self.is_active = is_active
        self.rate_limit = rate_limit or 100
        self.scopes = scopes or []
        self.created_at = datetime.now()
        self.last_used = None
        self.usage_count = 0

class APIKeyManager:
    """Manages API keys with validation and rate limiting."""
    
    def __init__(self):
        self.valid_keys: Dict[str, APIKey] = {}
        self.rate_limits: Dict[str, Dict[str, datetime]] = {}
        self.scope_checkers: Dict[str, Callable[[str], bool]] = {}
        
    def register_key(self, key: str, name: str = "API Key",
                     is_active: bool = True, rate_limit: Optional[int] = None,
                     scopes: List[str] = None):
        self.valid_keys[key] = APIKey(key, name, is_active, rate_limit, scopes)
        logger.info(f"Registered API key: {name}")
        
    def register_scope_checker(self, scope: str, checker: Callable[[str], bool]):
        self.scope_checkers[scope] = checker
        
    def validate_key(self, api_key: str) -> Optional[APIKey]:
        if not api_key:
            return None
            
        key = self.valid_keys.get(api_key)
        
        if not key:
            logger.warning(f"Invalid API key attempt: {api_key[:8]}...")
            return None
            
        if not key.is_active:
            logger.warning(f"Inactive API key attempt: {key.name}")
            return None
            
        return key
        
    async def check_rate_limit(self, api_key: str) -> bool:
        key = self.valid_keys.get(api_key)
        
        if not key or not key.rate_limit:
            return True
            
        current_time = datetime.now()
        key_usage = self.rate_limits.setdefault(api_key, {})
        
        requests_in_last_minute = sum(
            1 for timestamp in key_usage.values()
            if (current_time - timestamp) < timedelta(minutes=1)
        )
        
        if requests_in_last_minute >= key.rate_limit:
            logger.warning(f"Rate limit exceeded for API key: {api_key[:8]}...")
            return False
            
        key_usage[current_time] = current_time
        key.usage_count += 1
        key.last_used = current_time
        
        self._cleanup_rate_limits(api_key, current_time)
        
        return True
        
    def _cleanup_rate_limits(self, api_key: str, current_time: datetime):
        key_usage = self.rate_limits.get(api_key, {})
        old_timestamps = [
            ts for ts in key_usage.keys()
            if (current_time - ts) > timedelta(hours=1)
        ]
        for ts in old_timestamps:
            del key_usage[ts]
    
    def validate_scopes(self, api_key: str, required_scopes: List[str]) -> bool:
        key = self.valid_keys.get(api_key)
        
        if not key or not key.scopes:
            return True
            
        return all(scope in key.scopes for scope in required_scopes)
    
    def get_key_info(self, api_key: str) -> Optional[Dict[str, Any]]:
        key = self.valid_keys.get(api_key)
        
        if not key:
            return None
            
        return {
            "name": key.name,
            "is_active": key.is_active,
            "rate_limit": key.rate_limit,
            "scopes": key.scopes,
            "usage_count": key.usage_count,
            "created_at": key.created_at.isoformat(),
            "last_used": key.last_used.isoformat() if key.last_used else None
        }

class APIKeyMiddleware:
    """Middleware for validating API keys."""
    
    def __init__(self, app, api_key_manager: APIKeyManager,
                 exclude_paths: List[str] = None):
        self.app = app
        self.api_key_manager = api_key_manager
        self.exclude_paths = exclude_paths or [
            '/health', '/docs', '/redoc', '/openapi.json', '/ws'
        ]
        self.header_name = "X-API-Key"
        
    async def __call__(self, request: Request, call_next):
        if any(exclude_path in request.url.path for exclude_path in self.exclude_paths):
            return await call_next(request)
            
        if request.method not in ["POST", "PUT", "PATCH", "DELETE"]:
            return await call_next(request)
            
        api_key = request.headers.get(self.header_name)
        
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key is required",
                headers={"WWW-Authenticate": "ApiKey"}
            )
        
        key = self.api_key_manager.validate_key(api_key)
        
        if not key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key",
                headers={"WWW-Authenticate": "ApiKey"}
            )
        
        if not await self.api_key_manager.check_rate_limit(api_key):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded"
            )
        
        request.state.api_key = api_key
        request.state.api_key_info = key
        
        return await call_next(request)

def create_api_key_manager(keys: List[str] = None) -> APIKeyManager:
    manager = APIKeyManager()
    
    default_keys = keys or [
        "dev_key_1234567890abcdef",
        "staging_key_1234567890abcdef",
        "prod_key_1234567890abcdef"
    ]
    
    for i, key in enumerate(default_keys):
        manager.register_key(
            key=key,
            name=f"API Key {i+1}",
            is_active=True,
            rate_limit=100 if i == 2 else 1000,
            scopes=["read", "write"]
        )
    
    logger.info(f"Created API key manager with {len(default_keys)} keys")
    return manager

def add_api_key_middleware(app, api_key_manager: Optional[APIKeyManager] = None,
                          exclude_paths: List[str] = None):
    if api_key_manager is None:
        api_key_manager = create_api_key_manager()
    
    middleware = APIKeyMiddleware(
        app=app,
        api_key_manager=api_key_manager,
        exclude_paths=exclude_paths
    )
    
    app.middleware("http")(middleware)
    logger.info("API key validation middleware added")
    
    return app
