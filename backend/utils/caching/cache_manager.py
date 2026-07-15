"""
Advanced Caching Layer for Unified Editing Studio
Implements multi-level caching with intelligent invalidation and queue processing.
"""
import asyncio
import time
import threading
import logging
import json
import hashlib
import pickle
from typing import Dict, Any, List, Optional, Callable, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import redis
import aiocache
import aiocache.serializers
from aiocache import cached, Cache
from concurrent.futures import ThreadPoolExecutor
import weakref

logger = logging.getLogger("studio.backend.caching")

@dataclass
class CacheEntry:
    """Individual cache entry with metadata"""
    key: str
    value: Any
    created_at: float
    expires_at: float
    access_count: int = 0
    last_accessed: float = 0.0
    hit_count: int = 0
    miss_count: int = 0
    size_bytes: int = 0
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class CacheStats:
    """Cache performance statistics"""
    total_requests: int = 0
    hits: int = 0
    misses: int = 0
    hit_rate: float = 0.0
    average_response_time: float = 0.0
    total_size_bytes: int = 0
    expired_entries: int = 0
    evicted_entries: int = 0

class CacheManager:
    """Multi-level cache manager with intelligent policies"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {
            "local_cache_size": 1000,
            "redis_enabled": True,
            "redis_url": "redis://localhost:6379",
            "cache_ttl": 3600,  # 1 hour
            "cache_prefix": "studio:"
        }
        
        # Local cache (in-memory)
        self.local_cache = {}
        self.local_cache_lock = threading.RLock()
        self.local_cache_size = self.config.get("local_cache_size", 1000)
        
        # Redis cache
        self.redis_cache = None
        if self.config.get("redis_enabled", True):
            try:
                self.redis_cache = redis.from_url(self.config.get("redis_url", "redis://localhost:6379"))
                self.redis_cache.ping()
                logger.info("Redis cache connected")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}")
                self.redis_cache = None
        
        # Cache statistics
        self.stats = CacheStats()
        self.stats_lock = threading.RLock()
        
        # Background tasks
        self.cleanup_task = None
        self.stats_task = None
        self.is_running = False
        
        # Cache policies
        self.eviction_policy = "lru"  # lru, lfu, fifo
        self.compression_enabled = True
        
    def start(self):
        """Start the cache manager"""
        self.is_running = True
        
        # Start cleanup task
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        
        # Start stats collection task
        self.stats_task = asyncio.create_task(self._stats_loop())
        
        logger.info("Cache manager started")
        
    def stop(self):
        """Stop the cache manager"""
        self.is_running = False
        
        if self.cleanup_task:
            self.cleanup_task.cancel()
            
        if self.stats_task:
            self.stats_task.cancel()
            
        logger.info("Cache manager stopped")
    
    def _get_cache_key(self, key: str) -> str:
        """Generate full cache key with prefix"""
        return f"{self.config.get('cache_prefix', 'studio')}:{key}"
    
    def _compress_data(self, data: Any) -> bytes:
        """Compress data for storage"""
        if not self.compression_enabled:
            return pickle.dumps(data)
        
        try:
            import zlib
            serialized = pickle.dumps(data)
            compressed = zlib.compress(serialized)
            logger.debug(f"Compressed data: {len(serialized)} -> {len(compressed)} bytes")
            return compressed
        except Exception as e:
            logger.warning(f"Compression failed: {e}")
            return pickle.dumps(data)
    
    def _decompress_data(self, compressed_data: bytes) -> Any:
        """Decompress data from storage"""
        if not self.compression_enabled:
            return pickle.loads(compressed_data)
        
        try:
            import zlib
            decompressed = zlib.decompress(compressed_data)
            return pickle.loads(decompressed)
        except Exception as e:
            logger.warning(f"Decompression failed: {e}")
            return pickle.loads(compressed_data)
    
    async def get(self, key: str, default: Any = None) -> Any:
        """Get value from cache with fallback"""
        start_time = time.time()
        full_key = self._get_cache_key(key)
        
        try:
            # Try local cache first
            with self.local_cache_lock:
                if full_key in self.local_cache:
                    entry = self.local_cache[full_key]
                    if time.time() < entry.expires_at:
                        entry.access_count += 1
                        entry.last_accessed = time.time()
                        entry.hit_count += 1
                        
                        # Update global stats
                        with self.stats_lock:
                            self.stats.hits += 1
                            self.stats.total_requests += 1
                        
                        response_time = time.time() - start_time
                        await self._update_average_response_time(response_time)
                        
                        return entry.value
                    else:
                        # Remove expired entry
                        del self.local_cache[full_key]
                        self._increment_expired()
            
            # Try Redis cache
            if self.redis_cache:
                try:
                    cached_data = self.redis_cache.get(full_key)
                    if cached_data:
                        value = self._decompress_data(cached_data)
                        
                        # Add to local cache
                        await self._add_to_local_cache(full_key, value, 
                                                     self.config.get("cache_ttl", 3600))
                        
                        # Update stats
                        with self.stats_lock:
                            self.stats.hits += 1
                            self.stats.total_requests += 1
                        
                        response_time = time.time() - start_time
                        await self._update_average_response_time(response_time)
                        
                        return value
                except Exception as e:
                    logger.error(f"Redis get failed: {e}")
            
            # Cache miss
            with self.stats_lock:
                self.stats.misses += 1
                self.stats.total_requests += 1
            
            response_time = time.time() - start_time
            await self._update_average_response_time(response_time)
            
            return default
            
        except Exception as e:
            logger.error(f"Cache get failed for key {key}: {e}")
            return default
    
    async def set(self, key: str, value: Any, ttl: int = None, tags: List[str] = None) -> bool:
        """Set value in cache"""
        start_time = time.time()
        full_key = self._get_cache_key(key)
        ttl = ttl or self.config.get("cache_ttl", 3600)
        
        try:
            # Calculate size
            size_bytes = len(pickle.dumps(value))
            
            # Add to local cache
            await self._add_to_local_cache(full_key, value, ttl, tags)
            
            # Add to Redis cache
            if self.redis_cache:
                try:
                    compressed_data = self._compress_data(value)
                    self.redis_cache.setex(full_key, ttl, compressed_data)
                    logger.debug(f"Set Redis cache for key {key}")
                except Exception as e:
                    logger.error(f"Redis set failed: {e}")
            
            response_time = time.time() - start_time
            await self._update_average_response_time(response_time)
            
            return True
            
        except Exception as e:
            logger.error(f"Cache set failed for key {key}: {e}")
            return False
    
    async def _add_to_local_cache(self, full_key: str, value: Any, ttl: int, tags: List[str] = None):
        """Add entry to local cache"""
        with self.local_cache_lock:
            # Remove expired entries if cache is full
            if len(self.local_cache) >= self.local_cache_size:
                self._evict_local_entries()
            
            # Add new entry
            entry = CacheEntry(
                key=full_key,
                value=value,
                created_at=time.time(),
                expires_at=time.time() + ttl,
                size_bytes=len(pickle.dumps(value)),
                tags=tags or []
            )
            
            self.local_cache[full_key] = entry
    
    async def delete(self, key: str) -> bool:
        """Delete entry from cache"""
        full_key = self._get_cache_key(key)
        
        try:
            # Delete from local cache
            with self.local_cache_lock:
                if full_key in self.local_cache:
                    del self.local_cache[full_key]
            
            # Delete from Redis cache
            if self.redis_cache:
                self.redis_cache.delete(full_key)
            
            return True
            
        except Exception as e:
            logger.error(f"Cache delete failed for key {key}: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        full_key = self._get_cache_key(key)
        
        # Check local cache
        with self.local_cache_lock:
            if full_key in self.local_cache:
                entry = self.local_cache[full_key]
                if time.time() < entry.expires_at:
                    return True
                else:
                    del self.local_cache[full_key]
        
        # Check Redis cache
        if self.redis_cache:
            try:
                return self.redis_cache.exists(full_key) > 0
            except Exception as e:
                logger.error(f"Redis exists failed: {e}")
                return False
        
        return False
    
    async def clear(self) -> bool:
        """Clear all cache entries"""
        try:
            # Clear local cache
            with self.local_cache_lock:
                self.local_cache.clear()
            
            # Clear Redis cache
            if self.redis_cache:
                self.redis_cache.flushdb()
            
            # Reset stats
            with self.stats_lock:
                self.stats = CacheStats()
            
            return True
            
        except Exception as e:
            logger.error(f"Cache clear failed: {e}")
            return False
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self.stats_lock:
            # Calculate hit rate
            if self.stats.total_requests > 0:
                self.stats.hit_rate = (self.stats.hits / self.stats.total_requests) * 100
            
            # Calculate total size
            total_size = sum(entry.size_bytes for entry in self.local_cache.values())
            
            return {
                "local_cache_size": len(self.local_cache),
                "local_cache_memory_usage": total_size,
                "total_requests": self.stats.total_requests,
                "hits": self.stats.hits,
                "misses": self.stats.misses,
                "hit_rate": self.stats.hit_rate,
                "average_response_time": self.stats.average_response_time,
                "expired_entries": self.stats.expired_entries,
                "evicted_entries": self.stats.evicted_entries,
                "redis_connected": self.redis_cache is not None
            }
    
    def _evict_local_entries(self):
        """Evict entries from local cache based on policy"""
        if self.eviction_policy == "lru":
            # Evict least recently used
            sorted_entries = sorted(self.local_cache.values(), 
                                 key=lambda x: x.last_accessed)
            entries_to_remove = sorted_entries[:len(self.local_cache) // 10]  # Remove 10%
            
            for entry in entries_to_remove:
                del self.local_cache[entry.key]
                self._increment_evicted()
                
        elif self.eviction_policy == "lfu":
            # Evict least frequently used
            sorted_entries = sorted(self.local_cache.values(), 
                                 key=lambda x: x.access_count)
            entries_to_remove = sorted_entries[:len(self.local_cache) // 10]  # Remove 10%
            
            for entry in entries_to_remove:
                del self.local_cache[entry.key]
                self._increment_evicted()
                
        elif self.eviction_policy == "fifo":
            # Evict first in first out
            keys_to_remove = list(self.local_cache.keys())[:len(self.local_cache) // 10]  # Remove 10%
            
            for key in keys_to_remove:
                del self.local_cache[key]
                self._increment_evicted()
    
    def _increment_expired(self):
        """Increment expired counter"""
        with self.stats_lock:
            self.stats.expired_entries += 1
    
    def _increment_evicted(self):
        """Increment evicted counter"""
        with self.stats_lock:
            self.stats.evicted_entries += 1
    
    async def _update_average_response_time(self, response_time: float):
        """Update average response time"""
        with self.stats_lock:
            if self.stats.total_requests == 1:
                self.stats.average_response_time = response_time
            else:
                # Exponential moving average
                alpha = 0.1
                self.stats.average_response_time = (
                    alpha * response_time + 
                    (1 - alpha) * self.stats.average_response_time
                )
    
    async def _cleanup_loop(self):
        """Background cleanup loop"""
        while self.is_running:
            try:
                await self._cleanup_expired_entries()
                await asyncio.sleep(60)  # Run every minute
                
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
                await asyncio.sleep(120)
    
    async def _cleanup_expired_entries(self):
        """Clean up expired entries"""
        current_time = time.time()
        
        # Clean local cache
        with self.local_cache_lock:
            expired_keys = []
            for key, entry in self.local_cache.items():
                if current_time >= entry.expires_at:
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self.local_cache[key]
                self._increment_expired()
        
        # Clean Redis cache (auto-expired by Redis)
    
    async def _stats_loop(self):
        """Background statistics collection loop"""
        while self.is_running:
            try:
                # Log cache statistics
                stats = await self.get_stats()
                logger.debug(f"Cache stats: {stats}")
                
                await asyncio.sleep(300)  # Run every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in stats loop: {e}")
                await asyncio.sleep(600)

# Cache decorator for easy function caching
def cache_result(ttl: int = 3600, key_prefix: str = ""):
    """Decorator to cache function results"""
    def decorator(func):
        @cached(ttl=ttl, key_builder=lambda *args, **kwargs: f"{key_prefix}{func.__name__}:{hash(str(args) + str(kwargs))}")
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Global cache instance
cache_manager = CacheManager()