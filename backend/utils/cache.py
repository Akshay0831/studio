import time
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger("studio.backend.utils.cache")

class ResultCache:
    """
    A simple in-memory cache for generation results (images/audio).
    Prevents redundant computation for identical prompt/seed combinations.
    """
    def __init__(self, max_size: int = 100, ttl_seconds: int = 3600):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds

    def _get_key(self, prompt: str, seed: int, config: Dict[str, Any]) -> str:
        import hashlib
        import json
        
        # Filter out transient parameters like 'steps' or 'prefer_local' for broader caching
        stable_params = {k: v for k, v in config.items() if k not in ["steps", "prefer_local"]}
        config_hash = hashlib.md5(json.dumps(stable_params, sort_keys=True).encode()).hexdigest()
        
        return f"{prompt}:{seed}:{config_hash}"

    def get(self, prompt: str, seed: int, config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        key = self._get_key(prompt, seed, config)
        entry = self.cache.get(key)
        
        if entry:
            if time.time() - entry["timestamp"] < self.ttl_seconds:
                logger.info(f"Cache hit for key: {key[:30]}...")
                return entry["result"]
            else:
                del self.cache[key]
        
        return None

    def set(self, prompt: str, seed: int, config: Dict[str, Any], result: Dict[str, Any]):
        if len(self.cache) >= self.max_size:
            # Evict oldest entry
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k]["timestamp"])
            del self.cache[oldest_key]
            
        key = self._get_key(prompt, seed, config)
        self.cache[key] = {
            "result": result,
            "timestamp": time.time()
        }
        logger.info(f"Cached result for key: {key[:30]}...")

generation_cache = ResultCache()
