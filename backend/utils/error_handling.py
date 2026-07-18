import logging
import traceback
from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

logger = logging.getLogger("studio.backend.error_handling")

class ErrorCategory:
    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    NOT_FOUND = "not_found"
    SERVER_ERROR = "server_error"
    CLIENT_ERROR = "client_error"
    RATE_LIMIT = "rate_limit"
    TIMEOUT = "timeout"
    NETWORK = "network"
    VALIDATION_FAILURE = "validation_failure"
    RESOURCE_ERROR = "resource_error"
    PERMISSION_DENIED = "permission_denied"

async def custom_exception_handler(request: Request, exc: Exception):
    error_category = categorize_error(exc)
    error_code = get_error_code(exc)
    error_message = get_error_message(exc)
    
    log_error(exc, request=request, category=error_category, status_code=error_code)
    
    return create_error_response(
        error_code=error_code,
        error_type=type(exc).__name__,
        error_message=error_message,
        request=request,
        category=error_category
    )

def categorize_error(exc: Exception) -> str:
    if isinstance(exc, (RequestValidationError, ValidationError)):
        return ErrorCategory.VALIDATION
    elif isinstance(exc, FileNotFoundError):
        return ErrorCategory.NOT_FOUND
    elif isinstance(exc, PermissionError):
        return ErrorCategory.PERMISSION_DENIED
    elif isinstance(exc, TimeoutError):
        return ErrorCategory.TIMEOUT
    elif isinstance(exc, ConnectionError):
        return ErrorCategory.NETWORK
    elif isinstance(exc, RuntimeError):
        return ErrorCategory.SERVER_ERROR
    else:
        return ErrorCategory.SERVER_ERROR

def log_error(exc: Exception, request: Optional[Request] = None,
             category: Optional[str] = None, status_code: Optional[int] = None):
    error_category = category or categorize_error(exc)
    error_type = type(exc).__name__
    
    error_tracker.record_error(error_type, error_category)
    
    log_data = {
        "error_type": error_type,
        "error_message": str(exc),
        "category": error_category,
        "status_code": status_code or get_error_code(exc)
    }
    
    if request:
        log_data["request_path"] = request.url.path
        log_data["request_method"] = request.method
        log_data["client_host"] = request.client.host if request.client else None
    
    log_data["traceback"] = traceback.format_exc()
    
    logger.error(
        f"Error occurred | {error_category.upper()} | "
        f"{error_type} | {str(exc)}"
    )

def create_error_response(
    error_code: int,
    error_type: str,
    error_message: str,
    request: Request,
    category: str
) -> JSONResponse:
    return JSONResponse(
        status_code=error_code,
        content={
            "error": {
                "code": error_code,
                "type": error_type,
                "message": error_message,
                "path": request.url.path,
                "method": request.method,
                "category": category
            }
        }
    )

def get_error_code(exc: Exception) -> int:
    error_map = {
        FileNotFoundError: status.HTTP_404_NOT_FOUND,
        PermissionError: status.HTTP_403_FORBIDDEN,
        ValueError: status.HTTP_400_BAD_REQUEST,
        ConnectionError: status.HTTP_503_SERVICE_UNAVAILABLE,
        TimeoutError: status.HTTP_408_REQUEST_TIMEOUT,
        ConnectionRefusedError: status.HTTP_503_SERVICE_UNAVAILABLE,
        BrokenPipeError: status.HTTP_503_SERVICE_UNAVAILABLE,
        OSError: status.HTTP_503_SERVICE_UNAVAILABLE,
        RuntimeError: status.HTTP_500_INTERNAL_SERVER_ERROR,
        Exception: status.HTTP_500_INTERNAL_SERVER_ERROR
    }
    
    error_type = type(exc).__name__
    
    for exc_class, status_code in error_map.items():
        if isinstance(exc, exc_class):
            return status_code
    
    return status.HTTP_500_INTERNAL_SERVER_ERROR

def get_error_message(exc: Exception) -> str:
    error_messages = {
        FileNotFoundError: "Resource not found",
        PermissionError: "Permission denied",
        ValueError: "Invalid input value",
        ConnectionError: "Connection failed",
        ConnectionRefusedError: "Connection refused",
        TimeoutError: "Request timed out",
        RuntimeError: "Runtime error occurred",
        AttributeError: "Attribute not found",
        KeyError: "Key not found",
        IndexError: "Index out of bounds",
        TypeError: "Type error occurred",
        ZeroDivisionError: "Division by zero",
        MemoryError: "Insufficient memory",
        IOError: "Input/output error",
        OSError: "System error occurred",
    }

    return error_messages.get(
        type(exc).__name__,
        f"{type(exc).__name__} occurred: {str(exc)}"
    )

class ErrorLoggerMiddleware:
    async def __call__(self, request: Request, call_next) -> Any:
        try:
            response = await call_next(request)
            return response

        except Exception as exc:
            logger.error(
                f"Request failed: {request.method} {request.url.path} - "
                f"{type(exc).__name__}: {str(exc)}"
            )

            raise

class ErrorRecoveryStrategy:
    async def recover(self, exc: Exception) -> bool:
        return False

class RetryRecovery(ErrorRecoveryStrategy):
    def __init__(self, max_retries: int = 3, delay: float = 1.0):
        self.max_retries = max_retries
        self.delay = delay
    
    async def recover(self, exc: Exception) -> bool:
        import asyncio
        
        for attempt in range(self.max_retries):
            if attempt > 0:
                await asyncio.sleep(self.delay * attempt)
            
            try:
                return True
            except Exception:
                continue
        
        return False

class ErrorTracker:
    def __init__(self):
        self.error_counts: Dict[str, int] = {}
        self.error_by_category: Dict[str, int] = {}
        self.last_error_time: Optional[float] = None
    
    def record_error(self, error_type: str, category: str):
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1
        self.error_by_category[category] = self.error_by_category.get(category, 0) + 1
        self.last_error_time = time.time()
    
    def get_error_stats(self) -> Dict[str, Any]:
        return {
            "total_errors": sum(self.error_counts.values()),
            "errors_by_type": self.error_counts,
            "errors_by_category": self.error_by_category,
            "last_error_time": self.last_error_time
        }
    
    def get_error_rate(self, window_seconds: int = 60) -> float:
        if not self.last_error_time:
            return 0.0
        
        elapsed = time.time() - self.last_error_time
        if elapsed > window_seconds:
            return 0.0
        
        return min(self.error_counts.get("TotalError", 0) / window_seconds, 1.0)

error_tracker = ErrorTracker()
