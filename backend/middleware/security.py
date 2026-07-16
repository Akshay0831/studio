# Phase 3: Enhancements - Security Middleware

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
import logging
from typing import List

logger = logging.getLogger(__name__)

class SecurityMiddleware:
    """Security middleware configuration"""
    
    def __init__(
        self,
        allowed_origins: List[str] = None,
        allowed_methods: List[str] = None,
        allowed_headers: List[str] = None,
        max_age: int = 86400
    ):
        self.allowed_origins = allowed_origins or [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:80",
            "http://studio.unifiedediting.com",
            "https://studio.unifiedediting.com"
        ]
        self.allowed_methods = allowed_methods or [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS",
            "PATCH"
        ]
        self.allowed_headers = allowed_headers or [
            "accept",
            "accept-encoding",
            "authorization",
            "content-type",
            "dnt",
            "origin",
            "user-agent",
            "x-csrftoken",
            "x-forwarded-for",
            "x-forwarded-proto",
            "x-request-id",
            "x-real-ip",
            "x-requested-with"
        ]
        self.max_age = max_age
    
    def create_cors_middleware(self):
        """Create CORS middleware instance"""
        return CORSMiddleware(
            allow_origins=self.allowed_origins,
            allow_credentials=True,
            allow_methods=self.allowed_methods,
            allow_headers=self.allowed_headers,
            max_age=self.max_age
        )
    
    def get_security_headers(self, request: Request) -> dict:
        """Get security headers for a request"""
        headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "SAMEORIGIN",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
        }
        
        # Add specific headers based on request
        if request.headers.get("origin"):
            headers["Access-Control-Allow-Origin"] = request.headers.get("origin")
            headers["Access-Control-Allow-Credentials"] = "true"
        
        return headers

def create_security_headers_middleware():
    """Create security headers middleware factory"""
    from starlette.middleware.base import BaseHTTPMiddleware
    
    class SecurityHeadersMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request, call_next):
            response = await call_next(request)
            
            # Add security headers
            response.headers.update({
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "SAMEORIGIN",
                "X-XSS-Protection": "1; mode=block",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            })
            
            return response
    
    return SecurityHeadersMiddleware

def create_input_validation_middleware():
    """Create input validation middleware"""
    from starlette.middleware.base import BaseHTTPMiddleware
    
    class InputValidationMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request, call_next):
            # Skip validation for OPTIONS requests
            if request.method == "OPTIONS":
                return await call_next(request)
            
            # Validate request body for POST/PUT requests
            if request.method in ["POST", "PUT", "PATCH"]:
                try:
                    body = await request.json()
                    # Validate JSON structure
                    if not isinstance(body, dict):
                        raise ValueError("Invalid request body format")
                    
                    # Validate common fields
                    if "prompt" in body:
                        prompt = body["prompt"]
                        if not isinstance(prompt, str):
                            raise ValueError("Prompt must be a string")
                        if len(prompt) > 10000:
                            raise ValueError("Prompt too long (max 10000 characters)")
                    
                    if "seed" in body:
                        seed = body["seed"]
                        if not isinstance(seed, int) or seed < 0:
                            raise ValueError("Seed must be a non-negative integer")
                    
                except ValueError as e:
                    raise ValueError(f"Invalid request: {str(e)}")
                except Exception as e:
                    raise ValueError(f"Failed to parse request body: {str(e)}")
            
            return await call_next(request)
    
    return InputValidationMiddleware