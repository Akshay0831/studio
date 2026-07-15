from fastapi import APIRouter, HTTPException, Query, Depends, Path
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json
import os
from datetime import datetime
from scaling_service import scaling_service
from utils.monitoring import health_monitor
import time

router = APIRouter(prefix="/scaling", tags=["scaling"])

# Request/Response Models
class ScalingConfigRequest(BaseModel):
    horizontal: Optional[Dict[str, Any]] = None
    vertical: Optional[Dict[str, Any]] = None
    load_balancer: Optional[Dict[str, Any]] = None
    caching: Optional[Dict[str, Any]] = None

class ScalingResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: float

@router.get("/status", response_model=Dict[str, Any])
async def get_scaling_status():
    """Get current scaling status and metrics."""
    try:
        status = scaling_service.get_scaling_status()
        return {
            "success": True,
            "data": status,
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations", response_model=Dict[str, Any])
async def get_scaling_recommendations():
    """Get scaling recommendations based on current state."""
    try:
        recommendations = scaling_service.get_scaling_recommendations()
        return {
            "success": True,
            "recommendations": recommendations,
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/config", response_model=ScalingResponse)
async def update_scaling_config(request: ScalingConfigRequest):
    """Update scaling configuration."""
    try:
        config_dict = request.dict(exclude_none=True)
        scaling_service.update_scaling_config(config_dict)
        
        return ScalingResponse(
            success=True,
            message="Scaling configuration updated successfully",
            data=config_dict,
            timestamp=time.time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/config", response_model=Dict[str, Any])
async def get_scaling_config():
    """Get current scaling configuration."""
    try:
        return {
            "success": True,
            "config": scaling_service.scaling_config,
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scale-up", response_model=ScalingResponse)
async def manual_scale_up(
    count: int = Query(1, ge=1, le=10, description="Number of instances to add")
):
    """Manually scale up by adding instances."""
    try:
        result = await scaling_service.manual_scale_up(count)
        
        return ScalingResponse(
            success=result.get("success", False),
            message=result.get("message", "Scale up operation completed"),
            data=result,
            timestamp=time.time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scale-down", response_model=ScalingResponse)
async def manual_scale_down(
    count: int = Query(1, ge=1, le=10, description="Number of instances to remove")
):
    """Manually scale down by removing instances."""
    try:
        result = await scaling_service.manual_scale_down(count)
        
        return ScalingResponse(
            success=result.get("success", False),
            message=result.get("message", "Scale down operation completed"),
            data=result,
            timestamp=time.time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/instances", response_model=Dict[str, Any])
async def get_instances():
    """Get information about all instances."""
    try:
        status = scaling_service.get_scaling_status()
        return {
            "success": True,
            "instances": status.get("instances", {}),
            "instance_health": status.get("instance_health", {}),
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health/{instance_id}", response_model=Dict[str, Any])
async def get_instance_health(
    instance_id: str = Path(..., description="Instance ID")
):
    """Get health status of a specific instance."""
    try:
        instance_health = scaling_service.instance_health.get(instance_id)
        if instance_health is None:
            raise HTTPException(status_code=404, detail=f"Instance {instance_id} not found")
        
        return {
            "success": True,
            "instance_id": instance_id,
            "health": instance_health,
            "timestamp": time.time()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/health/{instance_id}/check", response_model=Dict[str, Any])
async def check_instance_health(
    instance_id: str = Path(..., description="Instance ID")
):
    """Perform health check on a specific instance."""
    try:
        result = await scaling_service._check_instance_health(instance_id)
        
        return {
            "success": True,
            "instance_id": instance_id,
            "health_check_result": result,
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/instances/{instance_id}", response_model=ScalingResponse)
async def terminate_instance(
    instance_id: str = Path(..., description="Instance ID to terminate")
):
    """Terminate a specific instance."""
    try:
        if instance_id not in scaling_service.instances:
            raise HTTPException(status_code=404, detail=f"Instance {instance_id} not found")
        
        instance_config = scaling_service.instances[instance_id]
        instance_config["status"] = "terminating"
        instance_config["active"] = False
        
        # Remove from instances
        del scaling_service.instances[instance_id]
        
        return ScalingResponse(
            success=True,
            message=f"Instance {instance_id} termination initiated",
            data={"instance_id": instance_id},
            timestamp=time.time()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/system", response_model=Dict[str, Any])
async def get_system_metrics():
    """Get system metrics for scaling decisions."""
    try:
        status = scaling_service.get_scaling_status()
        system_metrics = status.get("metrics", {}).get("system", {})
        
        return {
            "success": True,
            "system_metrics": system_metrics,
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/instances", response_model=Dict[str, Any])
async def get_instance_metrics():
    """Get instance metrics for scaling decisions."""
    try:
        status = scaling_service.get_scaling_status()
        instance_metrics = status.get("metrics", {}).get("instances", {})
        
        return {
            "success": True,
            "instance_metrics": instance_metrics,
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=Dict[str, Any])
async def get_scaling_history():
    """Get scaling history and events."""
    try:
        status = scaling_service.get_scaling_status()
        scaling_metrics = status.get("metrics", {}).get("scaling", {})
        
        return {
            "success": True,
            "scaling_history": {
                "last_event_time": scaling_metrics.get("last_event"),
                "cooldown_remaining": scaling_metrics.get("cooldown_remaining"),
                "config": scaling_metrics.get("config")
            },
            "current_instances": status.get("instances", {}),
            "instance_health": status.get("instance_health", {}),
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/algorithms", response_model=Dict[str, Any])
async def get_available_algorithms():
    """Get available scaling algorithms and their descriptions."""
    try:
        algorithms = {
            "round_robin": {
                "description": "Distributes requests evenly across all healthy instances",
                "pros": ["Simple to implement", "Equal load distribution"],
                "cons": ["Doesn't consider instance capacity"],
                "best_for": ["Evenly loaded instances", "Unknown workloads"]
            },
            "least_connections": {
                "description": "Sends requests to the instance with fewest active connections",
                "pros": ["Optimizes load distribution", "Considers current load"],
                "cons": ["Requires connection tracking", "Slightly more complex"],
                "best_for": ["Variable workloads", "Uneven request patterns"]
            },
            "weighted_round_robin": {
                "description": "Distributes requests based on instance weight/capacity",
                "pros": ["Considers instance capacity", "Optimizes resource utilization"],
                "cons": ["Requires instance weighting", "More complex configuration"],
                "best_for": ["Heterogeneous instances", "Performance-critical workloads"]
            },
            "ip_hash": {
                "description": "Routes requests based on client IP address hash",
                "pros": ["Session affinity", "Consistent routing"],
                "cons": ["Uneven distribution", "Single point of failure per IP"],
                "best_for": ["Session-based applications", "Stateful services"]
            }
        }
        
        return {
            "success": True,
            "algorithms": algorithms,
            "current_algorithm": scaling_service.scaling_config["load_balancer"]["algorithm"],
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/algorithm/{algorithm_name}", response_model=ScalingResponse)
async def set_load_balancer_algorithm(
    algorithm_name: str = Path(..., description="Algorithm name")
):
    """Set the load balancer algorithm."""
    try:
        available_algorithms = ["round_robin", "least_connections", "weighted_round_robin", "ip_hash"]
        
        if algorithm_name not in available_algorithms:
            raise HTTPException(status_code=400, detail=f"Invalid algorithm: {algorithm_name}")
        
        scaling_service.scaling_config["load_balancer"]["algorithm"] = algorithm_name
        
        return ScalingResponse(
            success=True,
            message=f"Load balancer algorithm set to {algorithm_name}",
            data={"algorithm": algorithm_name},
            timestamp=time.time()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/caching/stats", response_model=Dict[str, Any])
async def get_caching_stats():
    """Get caching statistics."""
    try:
        status = scaling_service.get_scaling_status()
        caching_config = status.get("caching", {})
        
        return {
            "success": True,
            "caching_stats": {
                "enabled": caching_config.get("enabled", False),
                "max_size_gb": caching_config.get("max_size_gb", 0),
                "eviction_policy": caching_config.get("eviction_policy", "lru"),
                "compression_enabled": caching_config.get("compression", False),
                "ttl_seconds": caching_config.get("ttl", 0)
            },
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset", response_model=ScalingResponse)
async def reset_scaling_config():
    """Reset scaling configuration to defaults."""
    try:
        # Reset to default configuration
        scaling_service.scaling_config = scaling_service.__init__.__closure__[0].cell_contents.scaling_config
        
        return ScalingResponse(
            success=True,
            message="Scaling configuration reset to defaults",
            timestamp=time.time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Additional endpoints for comprehensive scaling management
@router.post("/scale", response_model=ScalingResponse)
async def manual_scale_operation(
    operation: str = Query(..., description="Scale operation: scale_up, scale_down, repair"),
    count: int = Query(1, ge=1, description="Number of instances to scale"),
    force: bool = Query(False, description="Force operation even during cooldown")
):
    """Manual scaling operation with more control options."""
    try:
        if operation == "scale_up":
            result = await scaling_service.manual_scale_up(count, force=force)
        elif operation == "scale_down":
            result = await scaling_service.manual_scale_down(count, force=force)
        elif operation == "repair":
            result = await scaling_service.repair_instances()
        else:
            raise HTTPException(status_code=400, detail="Invalid scale operation")
        
        return ScalingResponse(
            success=result.get("success", False),
            message=result.get("message", "Scale operation completed"),
            data=result,
            timestamp=time.time()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auto-tune/config", response_model=Dict[str, Any])
async def get_auto_tune_config():
    """Get auto-tuning configuration."""
    try:
        return {
            "success": True,
            "auto_tune_config": scaling_service.scaling_config.get("auto_tune", {}),
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auto-tune/config", response_model=ScalingResponse)
async def update_auto_tune_config(
    cpu_threshold_high: float = Query(80.0, le=100, ge=0),
    cpu_threshold_low: float = Query(20.0, le=100, ge=0),
    memory_threshold_high: float = Query(80.0, le=100, ge=0),
    memory_threshold_low: float = Query(20.0, le=100, ge=0),
    enable_auto_scaling: bool = Query(True),
    cooldown_period: int = Query(300, ge=60)
):
    """Update auto-tuning configuration."""
    try:
        scaling_service.scaling_config["auto_tune"] = {
            "cpu_threshold_high": cpu_threshold_high,
            "cpu_threshold_low": cpu_threshold_low,
            "memory_threshold_high": memory_threshold_high,
            "memory_threshold_low": memory_threshold_low,
            "enable_auto_scaling": enable_auto_scaling,
            "cooldown_period": cooldown_period
        }
        
        return ScalingResponse(
            success=True,
            message="Auto-tune configuration updated successfully",
            data={"auto_tune_config": scaling_service.scaling_config["auto_tune"]},
            timestamp=time.time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auto-tune/start", response_model=ScalingResponse)
async def start_auto_tune():
    """Start auto-tuning process."""
    try:
        scaling_service.scaling_config["auto_tune"]["enabled"] = True
        scaling_service.start_auto_tune()
        
        return ScalingResponse(
            success=True,
            message="Auto-tuning started successfully",
            timestamp=time.time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auto-tune/stop", response_model=ScalingResponse)
async def stop_auto_tune():
    """Stop auto-tuning process."""
    try:
        scaling_service.scaling_config["auto_tune"]["enabled"] = False
        scaling_service.stop_auto_tune()
        
        return ScalingResponse(
            success=True,
            message="Auto-tuning stopped successfully",
            timestamp=time.time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis", response_model=Dict[str, Any])
async def get_scaling_analysis():
    """Get detailed scaling analysis and recommendations."""
    try:
        status = scaling_service.get_scaling_status()
        analysis = scaling_service.analyze_scaling_needs()
        
        return {
            "success": True,
            "analysis": analysis,
            "current_status": {
                "instances": status.get("instances", {}),
                "system_metrics": status.get("metrics", {}).get("system", {}),
                "load_balancer": status.get("load_balancer", {})
            },
            "recommendations": scaling_service.get_scaling_recommendations(),
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cost/estimate", response_model=Dict[str, Any])
async def get_cost_estimate():
    """Get cost estimates for current scaling configuration."""
    try:
        cost_analysis = scaling_service.calculate_cost_impact()
        
        return {
            "success": True,
            "cost_analysis": cost_analysis,
            "current_config": scaling_service.scaling_config,
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export", response_model=Dict[str, Any])
async def export_config():
    """Export current scaling configuration."""
    try:
        config_data = scaling_service.scaling_config.copy()
        config_data["exported_at"] = datetime.now().isoformat()
        config_data["version"] = "1.0"
        
        return {
            "success": True,
            "config": config_data,
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import", response_model=ScalingResponse)
async def import_config(request: Dict[str, Any]):
    """Import scaling configuration."""
    try:
        # Validate configuration structure
        required_keys = ["horizontal", "vertical", "load_balancer", "caching"]
        if not all(key in request for key in required_keys):
            raise HTTPException(status_code=400, detail="Invalid configuration format")
        
        scaling_service.scaling_config = request
        
        return ScalingResponse(
            success=True,
            message="Configuration imported successfully",
            data={"config_hash": hash(str(request))},
            timestamp=time.time()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))