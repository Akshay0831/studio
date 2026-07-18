import logging
from typing import Any, Dict, List, Optional, Type
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError

logger = logging.getLogger("studio.backend.input_validation")

class ValidationMiddleware:
    def __init__(self, app):
        self.app = app
        
    async def __call__(self, request: Request, call_next):
        try:
            if request.method in ["POST", "PUT", "PATCH"]:
                content_type = request.headers.get("content-type", "")
                
                if "application/json" in content_type:
                    try:
                        body = await request.json()
                        validated = self._validate_body(body, request)
                        if validated is not None:
                            setattr(request.state, "validated_body", validated)
                    except Exception as e:
                        return await self._validation_error_response(e)
            
            response = await call_next(request)
            return response
            
        except Exception as e:
            return await self._validation_error_response(e)
    
    def _validate_body(self, body: Dict[str, Any], request: Request) -> Optional[Dict[str, Any]]:
        try:
            body_schema = getattr(request.state, "body_schema", None)
            
            if not body_schema:
                return body
                
            if isinstance(body_schema, type) and issubclass(body_schema, BaseModel):
                instance = body_schema(**body)
                return instance.dict()
            elif callable(body_schema):
                return body_schema(body)
                
            return body
            
        except ValidationError as e:
            raise
        except Exception as e:
            raise ValueError(f"Body validation error: {str(e)}")
    
    def _validation_error_response(self, error: Exception) -> Response:
        error_message = str(error)
        error_type = type(error).__name__
        
        if error_type == "ValidationError":
            error_details = []
            for error in error.errors():
                error_details.append({
                    "field": ".".join(str(loc) for loc in error["loc"]),
                    "message": error["msg"],
                    "type": error["type"]
                })
                
            return JSONResponse(
                status_code=422,
                content={
                    "error": {
                        "code": 422,
                        "type": "Validation Error",
                        "message": "Request validation failed",
                        "details": error_details
                    }
                }
            )
        else:
            return JSONResponse(
                status_code=400,
                content={
                    "error": {
                        "code": 400,
                        "type": error_type,
                        "message": error_message
                    }
                }
            )

class RequestValidator:
    @staticmethod
    def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> bool:
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == "":
                return False
        return True
    
    @staticmethod
    def validate_field_types(data: Dict[str, Any], type_hints: Dict[str, Type]) -> bool:
        for field, expected_type in type_hints.items():
            if field in data and data[field] is not None:
                try:
                    if expected_type == int:
                        int(data[field])
                    elif expected_type == float:
                        float(data[field])
                    elif expected_type == bool:
                        str(data[field]).lower() in ['true', '1', 'yes', 'on']
                    elif expected_type == str:
                        str(data[field])
                except (ValueError, TypeError):
                    return False
        return True
    
    @staticmethod
    def validate_range(value: Any, min_val: Any = None, max_val: Any = None) -> bool:
        try:
            num = float(value)
            
            if min_val is not None and num < float(min_val):
                return False
                
            if max_val is not None and num > float(max_val):
                return False
                
            return True
            
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def validate_length(value: str, min_len: int = None, max_len: int = None) -> bool:
        if not isinstance(value, str):
            return False
            
        if min_len is not None and len(value) < min_len:
            return False
            
        if max_len is not None and len(value) > max_len:
            return False
            
        return True
    
    @staticmethod
    def validate_choices(value: Any, choices: List[Any]) -> bool:
        return value in choices
    
    @staticmethod
    def validate_url(url: str) -> bool:
        if not url:
            return False
            
        import re
        url_pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        return bool(re.match(url_pattern, url))
    
    @staticmethod
    def validate_email(email: str) -> bool:
        if not email:
            return False
            
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(email_pattern, email))

def add_validation_middleware(app, skip_paths: List[str] = None):
    if skip_paths is None:
        skip_paths = ['/health', '/docs', '/redoc', '/openapi.json', '/ws']
    
    from fastapi import Request
    import asyncio
    
    async def validation_middleware(request: Request, call_next):
        if any(skip_path in request.url.path for skip_path in skip_paths):
            return await call_next(request)
        
        try:
            if request.method in ["POST", "PUT", "PATCH"]:
                content_type = request.headers.get("content-type", "")
                
                if "application/json" in content_type:
                    try:
                        body = await request.json()
                        setattr(request.state, "validated_body", body)
                    except Exception as e:
                        return create_validation_response(e)
            
            response = await call_next(request)
            return response
            
        except Exception as e:
            return create_validation_response(e)
    
    def create_validation_response(error: Exception):
        error_type = type(error).__name__
        
        if error_type == "ValidationError":
            error_details = []
            for error in error.errors():
                error_details.append({
                    "field": ".".join(str(loc) for loc in error["loc"]),
                    "message": error["msg"],
                    "type": error["type"]
                })
                
            return JSONResponse(
                status_code=422,
                content={
                    "error": {
                        "code": 422,
                        "type": "Validation Error",
                        "message": "Request validation failed",
                        "details": error_details
                    }
                }
            )
        else:
            return JSONResponse(
                status_code=400,
                content={
                    "error": {
                        "code": 400,
                        "type": error_type,
                        "message": str(error)
                    }
                }
            )
    
    app.middleware("http")(validation_middleware)
    logger.info("Input validation middleware added")
    
    return app
