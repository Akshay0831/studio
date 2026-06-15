import time
import logging
import functools
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field

logger = logging.getLogger("studio.backend.utils.telemetry")

@dataclass
class PerformanceMetric:
    operation: str
    duration_ms: float
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)

class Telemetry:
    """
    Centralized utility for tracking performance metrics and system health.
    """
    def __init__(self):
        self.metrics: List[PerformanceMetric] = []
        self.max_history = 1000

    def track(self, operation: str, duration_ms: float, metadata: Optional[Dict[str, Any]] = None):
        metric = PerformanceMetric(
            operation=operation,
            duration_ms=round(duration_ms, 2),
            metadata=metadata or {}
        )
        self.metrics.append(metric)
        
        # Log high-signal metrics
        if duration_ms > 1000:
            logger.warning(f"Slow operation: {operation} took {metric.duration_ms}ms")
        else:
            logger.debug(f"Operation {operation} completed in {metric.duration_ms}ms")

        # Trim history
        if len(self.metrics) > self.max_history:
            self.metrics = self.metrics[-self.max_history:]

    def get_summary(self) -> Dict[str, Any]:
        if not self.metrics:
            return {"status": "no_metrics"}
            
        summary = {}
        ops = set(m.operation for m in self.metrics)
        for op in ops:
            op_metrics = [m.duration_ms for m in self.metrics if m.operation == op]
            summary[op] = {
                "count": len(op_metrics),
                "avg_ms": round(sum(op_metrics) / len(op_metrics), 2),
                "max_ms": round(max(op_metrics), 2),
                "min_ms": round(min(op_metrics), 2)
            }
        return summary

def trace_performance(operation_name: Optional[str] = None):
    """
    Decorator to automatically track function execution time.
    """
    def decorator(func):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            op = operation_name or func.__name__
            start = time.perf_counter()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = (time.perf_counter() - start) * 1000
                telemetry.track(op, duration)

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            op = operation_name or func.__name__
            start = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = (time.perf_counter() - start) * 1000
                telemetry.track(op, duration)

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    return decorator

telemetry = Telemetry()
