import re
import logging
from typing import Optional, Any, List
from html import escape

logger = logging.getLogger("studio.backend.sanitization")

class SanitizationResult:
    def __init__(self, sanitized: str, is_valid: bool, error: Optional[str] = None):
        self.sanitized = sanitized
        self.is_valid = is_valid
        self.error = error
        
    def __bool__(self):
        return self.is_valid

def sanitize_html(input_str: str, allow_newlines: bool = False) -> str:
    if not input_str:
        return ""
    
    if allow_newlines:
        return escape(input_str, quote=True)
    
    return escape(input_str, quote=True, quote=False).replace('\n', '').replace('\r', '')

def sanitize_filename(input_str: str, max_length: int = 255) -> str:
    if not input_str:
        return ""
    
    input_str = re.sub(r'\.\./', '', input_str)
    input_str = re.sub(r'\.\.\\', '', input_str)
    input_str = re.sub(r'[<>:"/\\|?*]', '_', input_str)
    input_str = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', input_str)
    
    if len(input_str) > max_length:
        input_str = input_str[:max_length]
    
    if not input_str or input_str.strip() == '':
        input_str = 'unnamed_file'
    
    return input_str

def sanitize_path(input_str: str) -> str:
    if not input_str:
        return ""
    
    input_str = input_str.replace('\\', '/').replace('\\', '/')
    parts = input_str.split('/')
    sanitized_parts = []
    
    for part in parts:
        if part == '' or part == '.':
            continue
        if part == '..':
            if sanitized_parts:
                sanitized_parts.pop()
            continue
        sanitized_parts.append(part)
    
    return '/'.join(sanitized_parts)

def sanitize_sql(input_str: str) -> str:
    if not input_str:
        return ""
    
    input_str = input_str.replace("'", "''")
    
    return input_str

def sanitize_json_input(input_str: str) -> SanitizationResult:
    if not input_str:
        return SanitizationResult("", False, "Input is empty")
    
    try:
        sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', input_str)
        
        import json
        data = json.loads(sanitized)
        
        if not isinstance(data, str):
            return SanitizationResult("", False, "Input is not a string")
        
        return SanitizationResult(sanitize_html(data), True)
        
    except json.JSONDecodeError as e:
        return SanitizationResult("", False, f"Invalid JSON: {str(e)}")
    except Exception as e:
        return SanitizationResult("", False, f"Sanitization error: {str(e)}")

def sanitize_email(email: str) -> SanitizationResult:
    if not email:
        return SanitizationResult("", False, "Email is empty")
    
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, email):
        return SanitizationResult("", False, "Invalid email format")
    
    return SanitizationResult(sanitize_html(email.strip()), True)

def sanitize_url(url: str) -> SanitizationResult:
    if not url:
        return SanitizationResult("", False, "URL is empty")
    
    if not (url.startswith('http://') or url.startswith('https://')):
        return SanitizationResult("", False, "URL must start with http:// or https://")
    
    url = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', url)
    
    return SanitizationResult(sanitize_html(url), True)

def sanitize_int(input_str: str, allow_negative: bool = True) -> SanitizationResult:
    if not input_str:
        return SanitizationResult(0, False, "Input is empty")
    
    try:
        value = int(input_str)
        if not allow_negative and value < 0:
            return SanitizationResult(0, False, "Negative values not allowed")
        return SanitizationResult(value, True)
    except ValueError:
        return SanitizationResult(0, False, "Invalid integer format")

def sanitize_float(input_str: str) -> SanitizationResult:
    if not input_str:
        return SanitizationResult(0.0, False, "Input is empty")
    
    try:
        value = float(input_str)
        return SanitizationResult(value, True)
    except ValueError:
        return SanitizationResult(0.0, False, "Invalid float format")

def sanitize_boolean(input_str: str) -> SanitizationResult:
    if not input_str:
        return SanitizationResult(False, False, "Input is empty")
    
    lower_str = input_str.lower().strip()
    if lower_str in ['true', '1', 'yes', 'on']:
        return SanitizationResult(True, True)
    elif lower_str in ['false', '0', 'no', 'off']:
        return SanitizationResult(False, True)
    else:
        return SanitizationResult(False, False, "Invalid boolean format")

def sanitize_list_items(items: List[str], sanitize_func=None) -> List[str]:
    if sanitize_func is None:
        sanitize_func = sanitize_html
        
    sanitized = []
    for item in items:
        if item:
            sanitized.append(sanitize_func(item))
    return sanitized

def sanitize_all(input_data: Any) -> Any:
    if isinstance(input_data, str):
        return sanitize_html(input_data)
    elif isinstance(input_data, list):
        return [sanitize_all(item) for item in input_data]
    elif isinstance(input_data, dict):
        return {sanitize_all(k): sanitize_all(v) for k, v in input_data.items()}
    else:
        return input_data

def is_potentially_malicious(input_str: str) -> bool:
    if not input_str:
        return False
    
    suspicious_patterns = [
        r'<script', r'javascript:', r'on\w+=',
        r'eval\(', r'function\s*\(', r'document\.',
        r'window\.', r'shell:', r'cmd:',
        r'base64:', r'\.\./', r'\\..\\',
        r'\x00|\x01|\x02|\x03|\x04|\x05|\x06|\x07|\x08|\x09|\x0a|\x0b|\x0c|\x0d|\x0e|\x0f',
        r'\x10|\x11|\x12|\x13|\x14|\x15|\x16|\x17|\x18|\x19|\x1a|\x1b|\x1c|\x1d|\x1e|\x1f|\x7f-\x9f'
    ]
    
    for pattern in suspicious_patterns:
        if re.search(pattern, input_str, re.IGNORECASE):
            return True
    
    return False
