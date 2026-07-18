from . import art, audio, backup, scaling, config
from .api_management import api_management_router

# Import modular routes
try:
    from .project import projects_router
    from .export import exports_router
    from .templates import templates_router
    
    __all__ = ["art", "audio", "backup", "scaling", "config", "api_management_router", "projects_router", "exports_router", "templates_router"]
except ImportError as e:
    print(f"Warning: Could not import modular routes: {e}")
    __all__ = ["art", "audio", "backup", "scaling", "config", "api_management_router"]