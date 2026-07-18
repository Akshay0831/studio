from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import logging
import traceback
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger("studio.backend.utils.api_error_handler")

class APIErrorTypes:
    """Standard error types for API responses"""
    VALIDATION_ERROR = "validation_error"
    AUTHENTICATION_ERROR = "authentication_error"
    AUTHORIZATION_ERROR = "authorization_error"
    NOT_FOUND = "not_found"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    EXTERNAL_API_ERROR = "external_api_error"
    INTERNAL_ERROR = "internal_error"
    INSUFFICIENT_QUOTA = "insufficient_quota"
    MODEL_NOT_AVAILABLE = "model_not_available"
    INVALID_REQUEST = "invalid_request"

class APIError:
    """Standardized API error format"""
    
    def __init__(
        self,
        error_type: str,
        message: str,
        detail: Optional[str] = None,
        status_code: int = 400,
        additional_data: Optional[Dict[str, Any]] = None
    ):
        self.error_type = error_type
        self.message = message
        self.detail = detail
        self.status_code = status_code
        self.additional_data = additional_data or {}
        self.timestamp = datetime.now().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary format"""
        error_dict = {
            "error": {
                "type": self.error_type,
                "message": self.message,
                "timestamp": self.timestamp,
                "status_code": self.status_code
            }
        }
        
        if self.detail:
            error_dict["error"]["detail"] = self.detail
            
        if self.additional_data:
            error_dict["error"]["details"] = self.additional_data
            
        return error_dict

def create_error_response(error: APIError) -> JSONResponse:
    """Create standardized JSON response for API errors"""
    return JSONResponse(
        status_code=error.status_code,
        content=error.to_dict()
    )

def handle_validation_errors(request: Request, exc: Exception) -> JSONResponse:
    """Handle FastAPI validation errors"""
    logger.warning(f"Validation error in {request.url}: {exc}")
    
    return create_error_response(APIError(
        error_type=APIErrorTypes.VALIDATION_ERROR,
        message="Request validation failed",
        detail=str(exc),
        status_code=422
    ))

def handle_http_exceptions(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions with standardized format"""
    logger.warning(f"HTTP error in {request.url}: {exc.status_code} - {exc.detail}")
    
    # Map HTTP status codes to error types
    error_mapping = {
        400: APIErrorTypes.INVALID_REQUEST,
        401: APIErrorTypes.AUTHENTICATION_ERROR,
        403: APIErrorTypes.AUTHORIZATION_ERROR,
        404: APIErrorTypes.NOT_FOUND,
        429: APIErrorTypes.RATE_LIMIT_EXCEEDED,
        500: APIErrorTypes.INTERNAL_ERROR
    }
    
    error_type = error_mapping.get(exc.status_code, APIErrorTypes.INTERNAL_ERROR)
    
    return create_error_response(APIError(
        error_type=error_type,
        message=exc.detail,
        status_code=exc.status_code
    ))

def handle_general_exceptions(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions with proper logging"""
    logger.error(f"Unexpected error in {request.url}: {exc}")
    logger.error(traceback.format_exc())
    
    return create_error_response(APIError(
        error_type=APIErrorTypes.INTERNAL_ERROR,
        message="An unexpected error occurred",
        detail="Internal server error",
        status_code=500
    ))

def handle_api_key_validation_error(api_type: str, error_detail: str) -> APIError:
    """Handle API key validation errors"""
    return APIError(
        error_type=APIErrorTypes.AUTHENTICATION_ERROR,
        message=f"Invalid {api_type} API credentials",
        detail=error_detail,
        status_code=400,
        additional_data={
            "provider": api_type,
            "issue": "invalid_credentials"
        }
    )

def handle_rate_limit_error(profile_id: str, limit_type: str = "minute") -> APIError:
    """Handle rate limit errors"""
    return APIError(
        error_type=APIErrorTypes.RATE_LIMIT_EXCEEDED,
        message="Rate limit exceeded",
        detail=f"Too many requests. Please try again later.",
        status_code=429,
        additional_data={
            "profile_id": profile_id,
            "limit_type": limit_type
        }
    )

def handle_model_not_available_error(model: str, provider: str) -> APIError:
    """Handle model not available errors"""
    return APIError(
        error_type=APIErrorTypes.MODEL_NOT_AVAILABLE,
        message="Requested model is not available",
        detail=f"Model '{model}' is not available for provider '{provider}'",
        status_code=400,
        additional_data={
            "model": model,
            "provider": provider
        }
    )

def handle_external_api_error(provider: str, error_message: str, status_code: int = 500) -> APIError:
    """Handle external API errors"""
    return APIError(
        error_type=APIErrorTypes.EXTERNAL_API_ERROR,
        message=f"External API error with {provider}",
        detail=error_message,
        status_code=status_code,
        additional_data={
            "provider": provider,
            "external_error": error_message
        }
    )

def handle_quota_exceeded_error(provider: str) -> APIError:
    """Handle quota exceeded errors"""
    return APIError(
        error_type=APIErrorTypes.INSUFFICIENT_QUOTA,
        message="API quota exceeded",
        detail=f"Your {provider} quota has been exceeded. Please upgrade your plan or try again later.",
        status_code=429,
        additional_data={
            "provider": provider,
            "issue": "quota_exceeded"
        }
    )

# Error handler middleware
def setup_error_handlers(app):
    """Setup error handlers for FastAPI app"""
    from fastapi.exceptions import RequestValidationError
    from fastapi import FastAPI
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return handle_validation_errors(request, exc)
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return handle_http_exceptions(request, exc)
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        return handle_general_exceptions(request, exc)