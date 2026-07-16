# Phase 2: Production Polish - Error Handling Middleware

import logging
import traceback
from typing import Dict, Any, Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import asyncio

logger = logging.getLogger(__name__)

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Comprehensive error handling middleware"""
    
    def __init__(self, app, max_retries: int = 3):
        super().__init__(app)
        self.max_retries = max_retries
    
    async def dispatch(self, request: Request, call_next):
        """Process each request with error handling"""
        try:
            # Add retry logic for transient errors
            response = None
            for attempt in range(self.max_retries):
                try:
                    response = await call_next(request)
                    break
                except (ConnectionError, TimeoutError) as e:
                    if attempt == self.max_retries - 1:
                        raise
                    await asyncio.sleep(2 ** attempt)
            
            return response
            
        except HTTPException as e:
            # Already processed HTTP exception
            return JSONResponse(
                status_code=e.status_code,
                content={"error": e.detail, "type": "http_exception"}
            )
        except Exception as e:
            # Log and return generic error
            logger.error(f"Unhandled exception: {str(e)}")
            logger.debug(f"Traceback: {traceback.format_exc()}")
            
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": "Internal server error",
                    "type": "internal_error",
                    "detail": str(e),
                    "timestamp": __import__('datetime').datetime.utcnow().isoformat()
                }
            )

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests for monitoring"""
    
    async def dispatch(self, request: Request, call_next):
        import time
        from uuid import uuid4
        
        request_id = str(uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        
        # Log request
        logger.info(f"[{request_id}] {request.method} {request.url.path}")
        logger.debug(f"[{request_id}] Headers: {dict(request.headers)}")
        logger.debug(f"[{request_id}] Query: {dict(request.query_params)}")
        
        try:
            response = await call_next(request)
            
            # Log response
            duration = time.time() - start_time
            logger.info(f"[{request_id}] {request.method} {request.url.path} - {response.status_code} ({duration:.2f}s)")
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"[{request_id}] {request.method} {request.url.path} - ERROR ({duration:.2f}s)")
            raise

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Basic rate limiting middleware"""
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self._request_count = {}
        self._last_reset = time.time()
    
    async def dispatch(self, request: Request, call_next):
        # Reset counter if needed
        current_time = time.time()
        if current_time - self._last_reset > 60:
            self._request_count.clear()
            self._last_reset = current_time
        
        # Get client IP
        client_ip = request.client.host
        
        # Increment counter
        self._request_count[client_ip] = self._request_count.get(client_ip, 0) + 1
        
        # Check rate limit
        if self._request_count[client_ip] > self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "type": "rate_limit_error",
                    "detail": "Too many requests. Please try again later."
                }
            )
        
        return await call_next(request)