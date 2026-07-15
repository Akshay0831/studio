import logging
import time
import json
from functools import wraps
from typing import Callable, Any, Dict, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger("studio.backend.monitoring")

# Request/response log file
LOG_FILE = "studio/backend/requests.log"

# Keep last 1000 requests in memory
REQUESTS_CACHE: list[Dict[str, Any]] = []

def log_request_response(func: Callable) -> Callable:
    """Decorator to log all API requests and responses."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        request = kwargs.get('request', args[0] if len(args) > 0 else None)

        start_time = time.time()

        # Log request
        if request:
            request_info = {
                "method": request.method,
                "path": request.url.path,
                "client": request.client.host if request.client else None,
                "query_params": dict(request.query_params),
                "headers": dict(request.headers),
                "timestamp": time.time()
            }
            logger.info(f"Request: {request_info['method']} {request_info['path']}")

        try:
            # Call the actual function
            response = await func(*args, **kwargs)

            # Log response
            duration = time.time() - start_time

            if hasattr(response, 'status_code'):
                logger.info(
                    f"Response: {request.method if request else 'N/A'} "
                    f"{request.url.path if request else 'N/A'} "
                    f"- Status: {response.status_code} - "
                    f"Duration: {duration:.2f}s"
                )

                # Add duration to response headers
                response.headers["X-Response-Time"] = f"{duration:.2f}s"

            # Cache recent requests
            cache_entry = {
                "method": request.method if request else "N/A",
                "path": request.url.path if request else "N/A",
                "status": response.status_code if hasattr(response, 'status_code') else "N/A",
                "duration": round(duration, 3),
                "timestamp": time.time()
            }
            REQUESTS_CACHE.append(cache_entry)
            if len(REQUESTS_CACHE) > 1000:
                REQUESTS_CACHE.pop(0)

            return response

        except Exception as e:
            duration = time.time() - start_time

            # Log error
            logger.error(
                f"Error: {request.method if request else 'N/A'} "
                f"{request.url.path if request else 'N/A'} "
                f"- {type(e).__name__}: {str(e)} - "
                f"Duration: {duration:.2f}s"
            )

            # Cache error request
            cache_entry = {
                "method": request.method if request else "N/A",
                "path": request.url.path if request else "N/A",
                "status": "ERROR",
                "error": type(e).__name__,
                "message": str(e),
                "duration": round(duration, 3),
                "timestamp": time.time()
            }
            REQUESTS_CACHE.append(cache_entry)
            if len(REQUESTS_CACHE) > 1000:
                REQUESTS_CACHE.pop(0)

            # Re-raise the exception
            raise

    return wrapper


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests and responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Log request
        logger.info(
            f"HTTP {request.method} {request.url.path} "
            f"- Client: {request.client.host if request.client else 'N/A'}"
        )

        # Call next middleware/handler
        response = await call_next(request)

        # Log response
        duration = time.time() - start_time
        logger.info(
            f"HTTP {request.method} {request.url.path} "
            f"- Status: {response.status_code} "
            f"- Response Time: {duration:.2f}s"
        )

        # Add custom headers
        response.headers["X-Response-Time"] = f"{duration:.2f}s"

        return response


class HealthMonitor:
    """Monitor system health and request statistics."""

    def __init__(self):
        self.request_count = 0
        self.error_count = 0
        self.avg_response_time = 0.0
        self.min_response_time = float('inf')
        self.max_response_time = 0.0
        self.start_time = time.time()

    def record_request(self, status_code: int, duration: float):
        """Record a request for monitoring."""
        self.request_count += 1

        # Update response time statistics
        self.avg_response_time = (
            (self.avg_response_time * (self.request_count - 1) + duration) /
            self.request_count
        )
        self.min_response_time = min(self.min_response_time, duration)
        self.max_response_time = max(self.max_response_time, duration)

        # Update error count
        if status_code >= 400:
            self.error_count += 1

    def get_stats(self) -> Dict[str, Any]:
        """Get current monitoring statistics."""
        uptime = time.time() - self.start_time

        return {
            "uptime_seconds": round(uptime, 2),
            "total_requests": self.request_count,
            "successful_requests": self.request_count - self.error_count,
            "failed_requests": self.error_count,
            "success_rate": (
                (self.request_count - self.error_count) / self.request_count * 100
                if self.request_count > 0 else 0
            ),
            "avg_response_time": round(self.avg_response_time, 3),
            "min_response_time": round(self.min_response_time, 3) if self.min_response_time != float('inf') else 0,
            "max_response_time": round(self.max_response_time, 3),
            "requests_per_minute": round(
                (self.request_count / uptime) * 60, 2
            ) if uptime > 0 else 0
        }

    def reset_stats(self):
        """Reset monitoring statistics (for testing)."""
        self.request_count = 0
        self.error_count = 0
        self.avg_response_time = 0.0
        self.min_response_time = float('inf')
        self.max_response_time = 0.0


# Global health monitor instance
health_monitor = HealthMonitor()


async def get_monitoring_data() -> Dict[str, Any]:
    """Get current monitoring data for the monitoring endpoint."""
    return {
        "status": "ok",
        "monitoring": health_monitor.get_stats(),
        "requests_last_minute": len(REQUESTS_CACHE)
    }
