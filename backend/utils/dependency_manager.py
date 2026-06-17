import logging
import importlib
from typing import Any, Optional

logger = logging.getLogger("studio.backend.utils.dependency_manager")

class DependencyManager:
    """Manages optional dependencies and engine integrations."""
    
    _cache = {}
    _health_status = {}

    @classmethod
    def get_module(cls, module_path: str) -> Optional[Any]:
        """Safely imports and returns a module."""
        if module_path in cls._cache:
            return cls._cache[module_path]
            
        try:
            module = importlib.import_module(module_path)
            cls._cache[module_path] = module
            cls._health_status[module_path] = {"status": "ok", "error": None}
            return module
        except ImportError as e:
            logger.warning(f"Engine module not found: {module_path}")
            cls._health_status[module_path] = {"status": "missing", "error": str(e)}
            return None
        except Exception as e:
            logger.error(f"Error loading engine module {module_path}: {e}")
            cls._health_status[module_path] = {"status": "error", "error": str(e)}
            return None

    @classmethod
    def get_health_report(cls) -> Dict[str, Any]:
        """Returns the health status of all tracked engines."""
        return cls._health_status

    @classmethod
    def get_attr(cls, module_path: str, attr_name: str, fallback: Any = None) -> Any:
        """Safely gets an attribute from a module."""
        module = cls.get_module(module_path)
        if module and hasattr(module, attr_name):
            return getattr(module, attr_name)
        return fallback

# Centralized access points
def get_art_engine():
    return DependencyManager.get_module("artsynthesis")

def get_audio_engine():
    return DependencyManager.get_module("audiolayer")
