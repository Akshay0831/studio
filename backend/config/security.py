# Phase 3: Enhancements - Security Configuration

import os
from typing import List, Optional

# CORS Configuration
CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://studio.unifiedediting.com").split(",")

CORS_ALLOW_CREDENTIALS: bool = os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"

CORS_ALLOW_METHODS: List[str] = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "OPTIONS",
    "PATCH"
]

CORS_ALLOW_HEADERS: List[str] = [
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

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "60"))
RATE_LIMIT_REQUESTS_PER_SECOND: int = int(os.getenv("RATE_LIMIT_REQUESTS_PER_SECOND", "10"))

# Security Headers
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
}

# Input Validation
MAX_PROMPT_LENGTH: int = int(os.getenv("MAX_PROMPT_LENGTH", "10000"))
MAX_IMAGE_WIDTH: int = int(os.getenv("MAX_IMAGE_WIDTH", "2048"))
MAX_IMAGE_HEIGHT: int = int(os.getenv("MAX_IMAGE_HEIGHT", "2048"))
MAX_BATCH_SIZE: int = int(os.getenv("MAX_BATCH_SIZE", "10"))

# Security
ENFORCE_HTTPS: bool = os.getenv("ENFORCE_HTTPS", "false").lower() == "true"
CSP_ENABLED: bool = os.getenv("CSP_ENABLED", "true").lower() == "true"

# CSP Configuration
CSP_POLICY = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https://cdn.jsdelivr.net", "https://studio.unifiedediting.com"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "ws:", "wss:"],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "frame-src": ["'none'"],
    "worker-src": ["'self'"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "upgrade-insecure-requests": []
} if CSP_ENABLED else {}

# API Security
API_KEY_HEADER: str = "X-API-Key"
API_KEY_REQUIRED: bool = os.getenv("API_KEY_REQUIRED", "false").lower() == "true"
API_KEY: Optional[str] = os.getenv("API_KEY")

# Audit Logging
ENABLE_AUDIT_LOGGING: bool = os.getenv("ENABLE_AUDIT_LOGGING", "true").lower() == "true"
AUDIT_LOG_LEVEL: str = os.getenv("AUDIT_LOG_LEVEL", "INFO")