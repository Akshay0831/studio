#!/usr/bin/env python3

# Test imports to debug module issues
import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Testing imports...")
print(f"Python path: {sys.path}")

try:
    from config import settings
    print("✅ config imported successfully")
except ImportError as e:
    print(f"❌ config failed: {e}")

try:
    from routes import art
    print("✅ routes.art imported successfully")
except ImportError as e:
    print(f"❌ routes.art failed: {e}")

try:
    from routes import enhanced
    print("✅ routes.enhanced imported successfully")
except ImportError as e:
    print(f"❌ routes.enhanced failed: {e}")

# Authentication removed - not needed for open-source tool
print("✅ Authentication removed - open-source configuration")

try:
    from inference_dispatcher import dispatcher
    print("✅ inference_dispatcher imported successfully")
except ImportError as e:
    print(f"❌ inference_dispatcher failed: {e}")

try:
    from websocket_handler import websocket_endpoint, manager
    print("✅ websocket_handler imported successfully")
except ImportError as e:
    print(f"❌ websocket_handler failed: {e}")

try:
    from utils.gpu import get_vram_info
    print("✅ utils.gpu imported successfully")
except ImportError as e:
    print(f"❌ utils.gpu failed: {e}")

try:
    from utils.telemetry import telemetry
    print("✅ utils.telemetry imported successfully")
except ImportError as e:
    print(f"❌ utils.telemetry failed: {e}")

try:
    from utils.monitoring import health_monitor, REQUESTS_CACHE
    print("✅ utils.monitoring imported successfully")
except ImportError as e:
    print(f"❌ utils.monitoring failed: {e}")

try:
    from utils.rate_limiter import rate_limit_middleware
    print("✅ utils.rate_limiter imported successfully")
except ImportError as e:
    print(f"❌ utils.rate_limiter failed: {e}")

try:
    from utils.error_handling import (
        custom_exception_handler,
        validation_exception_handler,
        pydantic_exception_handler,
        general_error_middleware
    )
    print("✅ utils.error_handling imported successfully")
except ImportError as e:
    print(f"❌ utils.error_handling failed: {e}")