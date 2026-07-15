"""
Advanced Performance Profiler for Unified Editing Studio
Provides real-time analytics, bottleneck detection, and performance optimization.
"""
import time
import threading
import asyncio
import logging
import json
import psutil
import numpy as np
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from collections import deque
from datetime import datetime, timedelta
import hashlib

logger = logging.getLogger("studio.backend.profiling")

@dataclass
class PerformanceMetric:
    """Individual performance measurement with metadata"""
    timestamp: float
    duration: float
    operation: str
    category: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    cpu_percent: float = 0.0
    memory_mb: float = 0.0
    thread_count: int = 0

class PerformanceBottleneckDetector:
    """Detects performance bottlenecks in real-time"""
    
    def __init__(self):
        self.thresholds = {
            'slow_operation': 1.0,  # seconds
            'high_cpu': 80.0,      # percentage
            'high_memory': 80.0,    # percentage of available RAM
            'high_latency': 0.5,    # seconds
        }
        self.bottlenecks = deque(maxlen=100)
        
    def analyze_metrics(self, metrics: List[PerformanceMetric]) -> List[Dict[str, Any]]:
        """Analyze metrics for bottlenecks"""
        bottlenecks = []
        
        # Group metrics by operation
        op_groups = {}
        for metric in metrics:
            if metric.operation not in op_groups:
                op_groups[metric.operation] = []
            op_groups[metric.operation].append(metric)
        
        # Analyze each operation
        for op_name, op_metrics in op_groups.items():
            avg_duration = np.mean([m.duration for m in op_metrics])
            max_duration = np.max([m.duration for m in op_metrics])
            avg_cpu = np.mean([m.cpu_percent for m in op_metrics])
            avg_memory = np.mean([m.memory_mb for m in op_metrics])
            
            # Check for bottlenecks
            issues = []
            
            if avg_duration > self.thresholds['slow_operation']:
                issues.append({
                    'type': 'slow_operation',
                    'severity': 'high' if avg_duration > self.thresholds['slow_operation'] * 2 else 'medium',
                    'avg_duration': avg_duration,
                    'max_duration': max_duration
                })
            
            if avg_cpu > self.thresholds['high_cpu']:
                issues.append({
                    'type': 'high_cpu',
                    'severity': 'high' if avg_cpu > 90 else 'medium',
                    'avg_cpu': avg_cpu
                })
            
            if avg_memory > self.thresholds['high_memory']:
                issues.append({
                    'type': 'high_memory',
                    'severity': 'high' if avg_memory > 90 else 'medium',
                    'avg_memory': avg_memory
                })
            
            if issues:
                bottlenecks.append({
                    'operation': op_name,
                    'issues': issues,
                    'sample_count': len(op_metrics),
                    'timestamp': datetime.now().isoformat()
                })
        
        return bottlenecks

class AdvancedProfiler:
    """Advanced performance profiler with real-time analytics"""
    
    def __init__(self):
        self.metrics = deque(maxlen=10000)  # Keep last 10K metrics
        self.bottleneck_detector = PerformanceBottleneckDetector()
        self.system_monitor = SystemMonitor()
        self.optimization_strategies = OptimizationStrategies()
        self.is_running = False
        self.analysis_thread = None
        
    def start(self):
        """Start the profiler"""
        self.is_running = True
        # Create a simple analysis loop using threading with asyncio.run
        self.analysis_thread = threading.Thread(
            target=self._run_analysis_loop, 
            daemon=True
        )
        self.analysis_thread.start()
        logger.info("Advanced profiler started")
        
    def stop(self):
        """Stop the profiler"""
        self.is_running = False
        if self.analysis_thread:
            self.analysis_thread.join()
        logger.info("Advanced profiler stopped")
    
    def _run_analysis_loop(self):
        """Run the analysis loop in a thread with proper asyncio handling"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            loop.run_until_complete(self._analysis_loop())
        finally:
            loop.close()
    
    async def _analysis_loop(self):
        """Background analysis loop"""
        while self.is_running:
            try:
                # Perform periodic analysis
                await self._periodic_analysis()
                await asyncio.sleep(30)  # Analyze every 30 seconds
            except Exception as e:
                logger.error(f"Error in analysis loop: {e}")
                await asyncio.sleep(60)
        
    def record_operation(self, operation: str, category: str, duration: float, 
                        metadata: Optional[Dict[str, Any]] = None):
        """Record a performance operation"""
        metric = PerformanceMetric(
            timestamp=time.time(),
            duration=duration,
            operation=operation,
            category=category,
            metadata=metadata or {},
            cpu_percent=self.system_monitor.get_cpu_usage(),
            memory_mb=self.system_monitor.get_memory_usage(),
            thread_count=threading.active_count()
        )
        
        self.metrics.append(metric)
        
        # Trigger real-time analysis if this is a slow operation
        if duration > 1.0:  # Only analyze operations taking > 1 second
            asyncio.create_task(self._analyze_slow_operation(metric))
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get comprehensive performance summary"""
        if not self.metrics:
            return {"status": "no_metrics"}
        
        # Group by category
        categories = {}
        for metric in self.metrics:
            if metric.category not in categories:
                categories[metric.category] = []
            categories[metric.category].append(metric)
        
        summary = {
            "total_metrics": len(self.metrics),
            "time_range": {
                "start": min(m.timestamp for m in self.metrics),
                "end": max(m.timestamp for m in self.metrics),
                "duration": max(m.timestamp for m in self.metrics) - min(m.timestamp for m in self.metrics)
            },
            "categories": {},
            "system_stats": self.system_monitor.get_system_stats(),
            "bottlenecks": self.bottleneck_detector.analyze_metrics(list(self.metrics))
        }
        
        # Summarize each category
        for category_name, category_metrics in categories.items():
            durations = [m.duration for m in category_metrics]
            summary["categories"][category_name] = {
                "operation_count": len(category_metrics),
                "avg_duration": np.mean(durations),
                "max_duration": np.max(durations),
                "min_duration": np.min(durations),
                "p95_duration": np.percentile(durations, 95),
                "total_time": sum(durations),
                "operations": {}
            }
            
            # Group by operation within category
            op_groups = {}
            for metric in category_metrics:
                if metric.operation not in op_groups:
                    op_groups[metric.operation] = []
                op_groups[metric.operation].append(metric)
            
            for op_name, op_metrics in op_groups.items():
                op_durations = [m.duration for m in op_metrics]
                summary["categories"][category_name]["operations"][op_name] = {
                    "count": len(op_metrics),
                    "avg_duration": np.mean(op_durations),
                    "max_duration": np.max(op_durations),
                    "p95_duration": np.percentile(op_durations, 95),
                    "total_time": sum(op_durations)
                }
        
        return summary
    
    def get_optimization_recommendations(self) -> List[Dict[str, Any]]:
        """Get AI-powered optimization recommendations"""
        summary = self.get_performance_summary()
        recommendations = []
        
        # Analyze bottlenecks
        for bottleneck in summary.get("bottlenecks", []):
            for issue in bottleneck.get("issues", []):
                rec = self.optimization_strategies.get_recommendation(
                    issue["type"], 
                    bottleneck["operation"],
                    issue
                )
                if rec:
                    recommendations.append(rec)
        
        return recommendations
    
    async def _analysis_loop(self):
        """Background analysis loop"""
        while self.is_running:
            try:
                # Perform periodic analysis
                await self._periodic_analysis()
                await asyncio.sleep(30)  # Analyze every 30 seconds
            except Exception as e:
                logger.error(f"Error in analysis loop: {e}")
                await asyncio.sleep(60)
    
    async def _periodic_analysis(self):
        """Perform periodic performance analysis"""
        summary = self.get_performance_summary()
        bottlenecks = summary.get("bottlenecks", [])
        
        if bottlenecks:
            logger.warning(f"Found {len(bottlenecks)} performance bottlenecks")
            for bottleneck in bottlenecks:
                logger.warning(f"Bottleneck in {bottleneck['operation']}: {bottleneck['issues']}")
    
    async def _analyze_slow_operation(self, metric: PerformanceMetric):
        """Analyze individual slow operations"""
        if metric.duration > 2.0:  # Only analyze very slow operations
            logger.warning(f"Slow operation detected: {metric.operation} took {metric.duration:.2f}s")
            
            # Get optimization suggestions
            recommendations = self.optimization_strategies.get_recommendation(
                "slow_operation", 
                metric.operation,
                {"duration": metric.duration}
            )
            
            if recommendations:
                logger.info(f"Optimization suggestions for {metric.operation}: {recommendations}")

class SystemMonitor:
    """Monitors system resources"""
    
    def __init__(self):
        self.process = psutil.Process()
        self.start_time = time.time()
        
    def get_cpu_usage(self) -> float:
        """Get current CPU usage"""
        return psutil.cpu_percent()
    
    def get_memory_usage(self) -> float:
        """Get current memory usage in MB"""
        return self.process.memory_info().rss / 1024 / 1024
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Get comprehensive system statistics"""
        return {
            "cpu_percent": psutil.cpu_percent(),
            "cpu_count": psutil.cpu_count(),
            "memory_percent": psutil.virtual_memory().percent,
            "memory_available_gb": psutil.virtual_memory().available / 1024 / 1024 / 1024,
            "disk_usage_percent": psutil.disk_usage('/').percent,
            "uptime_seconds": time.time() - self.start_time,
            "thread_count": threading.active_count(),
            "load_average": list(psutil.getloadavg()) if hasattr(psutil, 'getloadavg') else [0, 0, 0]
        }

class OptimizationStrategies:
    """Provides optimization strategies based on performance data"""
    
    def get_recommendation(self, issue_type: str, operation: str, details: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Get optimization recommendation for specific issue"""
        
        strategies = {
            "slow_operation": {
                "cache_recommendation": f"Consider implementing caching for {operation}",
                "async_recommendation": f"Make {operation} asynchronous to avoid blocking",
                "batch_recommendation": f"Consider batching multiple {operation} calls",
                "priority": "high"
            },
            "high_cpu": {
                "optimize_recommendation": f"Optimize CPU-intensive operations in {operation}",
                "parallel_recommendation": f"Consider parallel processing for {operation}",
                "caching_recommendation": f"Cache results of frequently called {operation}",
                "priority": "medium"
            },
            "high_memory": {
                "streaming_recommendation": f"Implement streaming for {operation} to reduce memory",
                "lazy_loading_recommendation": f"Use lazy loading for {operation}",
                "pooling_recommendation": f"Consider object pooling for {operation}",
                "priority": "high"
            },
            "high_latency": {
                "caching_recommendation": f"Cache results of {operation} to reduce latency",
                "cdn_recommendation": f"Consider CDN integration for {operation}",
                "optimization_recommendation": f"Optimize database queries for {operation}",
                "priority": "high"
            }
        }
        
        if issue_type in strategies:
            strategy = strategies[issue_type]
            return {
                "type": issue_type,
                "operation": operation,
                "priority": strategy["priority"],
                "recommendations": [
                    strategy["cache_recommendation"],
                    strategy["async_recommendation"] if "async_recommendation" in strategy else "",
                    strategy["batch_recommendation"] if "batch_recommendation" in strategy else ""
                ],
                "details": details,
                "timestamp": datetime.now().isoformat()
            }
        
        return None

# Global profiler instance
profiler = AdvancedProfiler()

# Decorator for profiling functions
def profile_operation(operation_name: str, category: str = "general"):
    """Decorator to profile function calls"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                profiler.record_operation(operation_name, category, duration, {
                    "function": func.__name__,
                    "args_count": len(args),
                    "kwargs_count": len(kwargs)
                })
        return wrapper
    return decorator

# Context manager for profiling code blocks
class profile_context:
    """Context manager for profiling code blocks"""
    def __init__(self, operation_name: str, category: str = "general"):
        self.operation_name = operation_name
        self.category = category
        self.start_time = 0
        
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        profiler.record_operation(self.operation_name, self.category, duration, {
            "exc_type": str(exc_type),
            "has_exception": exc_type is not None
        })