"""
Performance Profiling API Routes
Provides real-time performance monitoring, bottleneck detection, and optimization recommendations.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import asyncio
import json
import time
from datetime import datetime
import logging

from utils.profiling.advanced_profiler import profiler, profile_operation, PerformanceMetric
from utils.profiling.advanced_profiler import SystemMonitor, OptimizationStrategies

logger = logging.getLogger("studio.backend.profiling")

router = APIRouter(prefix="/profiling", tags=["profiling"])

# Request/Response Models
class ProfilingRequest(BaseModel):
    operation: str
    category: str = "general"
    metadata: Optional[Dict[str, Any]] = None

class OptimizationRequest(BaseModel):
    operation: str
    issue_type: str
    details: Dict[str, Any]

class PerformanceSummaryResponse(BaseModel):
    status: str
    total_metrics: int
    time_range: Dict[str, float]
    categories: Dict[str, Any]
    system_stats: Dict[str, Any]
    bottlenecks: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]

class SystemStatsResponse(BaseModel):
    cpu_percent: float
    cpu_count: int
    memory_percent: float
    memory_available_gb: float
    disk_usage_percent: float
    uptime_seconds: float
    thread_count: int
    load_average: List[float]

# Initialize services
system_monitor = SystemMonitor()
optimization_strategies = OptimizationStrategies()

@router.get("/start", response_model=Dict[str, str])
async def start_profiling():
    """Start the advanced profiler"""
    try:
        profiler.start()
        return {"status": "started", "message": "Advanced profiler started successfully"}
    except Exception as e:
        logger.error(f"Failed to start profiler: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start profiler: {str(e)}")

@router.get("/stop", response_model=Dict[str, str])
async def stop_profiling():
    """Stop the advanced profiler"""
    try:
        profiler.stop()
        return {"status": "stopped", "message": "Advanced profiler stopped successfully"}
    except Exception as e:
        logger.error(f"Failed to stop profiler: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to stop profiler: {str(e)}")

@router.get("/status", response_model=Dict[str, Any])
async def get_profiling_status():
    """Get current profiler status"""
    try:
        return {
            "is_running": profiler.is_running,
            "total_metrics": len(profiler.metrics),
            "system_monitor_active": True,
            "analysis_thread_active": profiler.analysis_thread.is_alive() if profiler.analysis_thread else False,
            "last_analysis": time.time() if profiler.metrics else None
        }
    except Exception as e:
        logger.error(f"Failed to get profiler status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get profiler status: {str(e)}")

@router.post("/record", response_model=Dict[str, str])
async def record_operation(request: ProfilingRequest):
    """Record a performance operation"""
    try:
        profiler.record_operation(
            operation=request.operation,
            category=request.category,
            metadata=request.metadata
        )
        return {"status": "recorded", "operation": request.operation}
    except Exception as e:
        logger.error(f"Failed to record operation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to record operation: {str(e)}")

@router.get("/summary", response_model=PerformanceSummaryResponse)
async def get_performance_summary():
    """Get comprehensive performance summary"""
    try:
        summary = profiler.get_performance_summary()
        recommendations = profiler.get_optimization_recommendations()
        
        return PerformanceSummaryResponse(
            status=summary.get("status", "ok"),
            total_metrics=summary.get("total_metrics", 0),
            time_range=summary.get("time_range", {}),
            categories=summary.get("categories", {}),
            system_stats=summary.get("system_stats", {}),
            bottlenecks=summary.get("bottlenecks", []),
            recommendations=recommendations
        )
    except Exception as e:
        logger.error(f"Failed to get performance summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get performance summary: {str(e)}")

@router.get("/system-stats", response_model=SystemStatsResponse)
async def get_system_stats():
    """Get real-time system statistics"""
    try:
        stats = system_monitor.get_system_stats()
        return SystemStatsResponse(**stats)
    except Exception as e:
        logger.error(f"Failed to get system stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get system stats: {str(e)}")

@router.get("/bottlenecks", response_model=List[Dict[str, Any]])
async def get_performance_bottlenecks():
    """Get detected performance bottlenecks"""
    try:
        summary = profiler.get_performance_summary()
        return summary.get("bottlenecks", [])
    except Exception as e:
        logger.error(f"Failed to get bottlenecks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get bottlenecks: {str(e)}")

@router.get("/recommendations", response_model=List[Dict[str, Any]])
async def get_optimization_recommendations():
    """Get AI-powered optimization recommendations"""
    try:
        recommendations = profiler.get_optimization_recommendations()
        return recommendations
    except Exception as e:
        logger.error(f"Failed to get recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@router.get("/categories", response_model=Dict[str, Any])
async def get_performance_categories():
    """Get performance metrics grouped by category"""
    try:
        summary = profiler.get_performance_summary()
        return summary.get("categories", {})
    except Exception as e:
        logger.error(f"Failed to get performance categories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get performance categories: {str(e)}")

@router.get("/operations/{category}", response_model=Dict[str, Any])
async def get_category_operations(category: str):
    """Get performance metrics for a specific category"""
    try:
        summary = profiler.get_performance_summary()
        categories = summary.get("categories", {})
        
        if category not in categories:
            raise HTTPException(status_code=404, detail=f"Category '{category}' not found")
        
        return categories[category]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get category operations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get category operations: {str(e)}")

@router.delete("/metrics", response_model=Dict[str, str])
async def clear_metrics():
    """Clear all collected performance metrics"""
    try:
        profiler.metrics.clear()
        return {"status": "cleared", "message": "Performance metrics cleared"}
    except Exception as e:
        logger.error(f"Failed to clear metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear metrics: {str(e)}")

@router.post("/optimize", response_model=Dict[str, Any])
async def apply_optimization(request: OptimizationRequest):
    """Apply optimization recommendations"""
    try:
        # Get recommendation details
        recommendation = optimization_strategies.get_recommendation(
            request.issue_type,
            request.operation,
            request.details
        )
        
        if not recommendation:
            raise HTTPException(status_code=404, detail="No optimization found for this issue")
        
        # Apply optimization (placeholder for actual optimization logic)
        optimization_result = {
            "recommendation_applied": recommendation,
            "optimization_id": f"opt_{int(time.time())}",
            "timestamp": datetime.now().isoformat(),
            "estimated_improvement": "50%"  # Placeholder
        }
        
        logger.info(f"Applied optimization: {recommendation}")
        return optimization_result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to apply optimization: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to apply optimization: {str(e)}")

@router.get("/export", response_model=Dict[str, str])
async def export_performance_data():
    """Export performance data for analysis"""
    try:
        summary = profiler.get_performance_summary()
        
        # Prepare export data
        export_data = {
            "export_timestamp": datetime.now().isoformat(),
            "profiler_summary": summary,
            "raw_metrics": [
                {
                    "timestamp": m.timestamp,
                    "duration": m.duration,
                    "operation": m.operation,
                    "category": m.category,
                    "cpu_percent": m.cpu_percent,
                    "memory_mb": m.memory_mb,
                    "thread_count": m.thread_count,
                    "metadata": m.metadata
                }
                for m in profiler.metrics
            ]
        }
        
        return {
            "status": "exported",
            "export_data": json.dumps(export_data, indent=2),
            "metrics_count": len(profiler.metrics),
            "export_timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to export performance data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to export performance data: {str(e)}")

@router.get("/health", response_model=Dict[str, Any])
async def get_profiling_health():
    """Get profiling service health status"""
    try:
        return {
            "status": "healthy",
            "profiler_running": profiler.is_running,
            "metrics_collected": len(profiler.metrics),
            "system_monitor_active": True,
            "last_analysis": time.time(),
            "bottlenecks_detected": len(profiler.get_performance_summary().get("bottlenecks", [])),
            "recommendations_available": len(profiler.get_optimization_recommendations())
        }
    except Exception as e:
        logger.error(f"Failed to get profiling health: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get profiling health: {str(e)}")