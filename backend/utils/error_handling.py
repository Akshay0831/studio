import logging
import traceback
from typing import Any
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

logger = logging.getLogger("studio.backend.error_handling")


async def custom_exception_handler(request: Request, exc: Exception):
    """
    Custom exception handler for all unhandled exceptions.
    Returns a standardized error response.
    """
    # Log the error
    logger.error(
        f"Unhandled exception: {type(exc).__name__} - {str(exc)}\n"
        f"Path: {request.url.path}\n"
        f"Method: {request.method}\n"
        f"Client: {request.client.host if request.client else 'N/A'}\n"
        f"Stack trace:\n{traceback.format_exc()}"
    )

    # Return appropriate error response
    error_code = get_error_code(exc)
    error_message = get_error_message(exc)

    return JSONResponse(
        status_code=error_code,
        content={
            "error": {
                "code": error_code,
                "type": type(exc).__name__,
                "message": error_message,
                "path": request.url.path,
                "method": request.method
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom handler for request validation errors.
    Returns a user-friendly validation error response.
    """
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })

    logger.warning(
        f"Validation error: {len(errors)} fields failed validation - {request.url.path}"
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": status.HTTP_422_UNPROCESSABLE_ENTITY,
                "type": "Validation Error",
                "message": "Request validation failed",
                "details": errors
            }
        }
    )


async def pydantic_exception_handler(request: Request, exc: ValidationError):
    """
    Custom handler for Pydantic validation errors.
    """
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": status.HTTP_422_UNPROCESSABLE_ENTITY,
                "type": "Validation Error",
                "message": "Request validation failed",
                "details": errors
            }
        }
    )


def get_error_code(exc: Exception) -> int:
    """Get appropriate HTTP status code for an exception."""
    if isinstance(exc, FileNotFoundError):
        return status.HTTP_404_NOT_FOUND
    elif isinstance(exc, PermissionError):
        return status.HTTP_403_FORBIDDEN
    elif isinstance(exc, ValueError):
        return status.HTTP_400_BAD_REQUEST
    elif isinstance(exc, ConnectionError):
        return status.HTTP_503_SERVICE_UNAVAILABLE
    elif isinstance(exc, TimeoutError):
        return status.HTTP_408_REQUEST_TIMEOUT
    else:
        return status.HTTP_500_INTERNAL_SERVER_ERROR


def get_error_message(exc: Exception) -> str:
    """Get a user-friendly error message."""
    error_messages = {
        FileNotFoundError: "Resource not found",
        PermissionError: "Permission denied",
        ValueError: "Invalid input value",
        ConnectionError: "Connection failed",
        TimeoutError: "Request timed out",
        RuntimeError: "Runtime error",
        AttributeError: "Attribute not found",
        KeyError: "Key not found",
    }

    return error_messages.get(
        type(exc).__name__,
        f"A {type(exc).__name__} occurred: {str(exc)}"
    )


async def general_error_middleware(request: Request, call_next):
    """
    Global error handling middleware.
    Catches all exceptions and returns a standardized error response.
    """
    try:
        response = await call_next(request)
        return response

    except Exception as exc:
        return await custom_exception_handler(request, exc)


class ErrorLoggerMiddleware:
    """
    Middleware to log all errors and warnings.
    """

    async def __call__(self, request: Request, call_next) -> Any:
        try:
            response = await call_next(request)
            return response

        except Exception as exc:
            # Log error
            logger.error(
                f"Request failed: {request.method} {request.url.path} - "
                f"{type(exc).__name__}: {str(exc)}"
            )

            # Re-raise the exception
            raise
