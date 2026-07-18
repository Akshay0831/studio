import asyncio
import logging
from typing import Any, Callable, TypeVar
from datetime import datetime, timedelta

logger = logging.getLogger("studio.backend.timeout")

T = TypeVar('T')

async def async_with_timeout(coro, timeout_seconds, default_value=None, timeout_error="Timeout") -> T:
    try:
        return await asyncio.wait_for(coro, timeout=timeout_seconds)
    except asyncio.TimeoutError:
        logger.warning(f"{timeout_error} after {timeout_seconds} seconds")
        if default_value is not None:
            return default_value
        raise TimeoutError(timeout_error)

def timeout_context(timeout_seconds, error_message="Timeout"):
    class TimeoutContext:
        def __init__(self):
            self._start_time = None
            self._timeout = timeout_seconds
            self._error_message = error_message
            
        def __enter__(self):
            self._start_time = datetime.now()
            return self
            
        def __exit__(self, exc_type, exc_val, exc_tb):
            elapsed = (datetime.now() - self._start_time).total_seconds()
            if elapsed > self._timeout:
                logger.warning(f"{self._error_message} after {elapsed:.2f} seconds")
                raise TimeoutError(f"{self._error_message} after {elapsed:.2f} seconds")
            return False
    
    return TimeoutContext()

async def async_run_with_timeout(func, *args, timeout_seconds=None, default_value=None, **kwargs) -> T:
    async def run_func():
        return await func(*args, **kwargs)
    
    return await async_with_timeout(run_func(), timeout_seconds or 30, default_value)
