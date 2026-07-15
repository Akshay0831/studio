"""
Scaling Architecture API Routes
Provides endpoints for horizontal scaling, caching, queue processing, and resource allocation.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import asyncio
import time
import logging

from utils.profiling.advanced_profiler import profiler
from utils.scaling.horizontal_scaling import scaler, InstanceInfo, ScalingConfig
from utils.caching.cache_manager import cache_manager
from utils.queue.queue_processor import queue_processor, TaskPriority
from utils.resource_allocation.smart_allocator import resource_allocator, ResourceRequirement

logger = logging.getLogger("studio.backend.scaling")

router = APIRouter(prefix="/scaling", tags=["scaling"])

# Request/Response Models
class InstanceCreateRequest(BaseModel):
    instance_id: str
    host: str
    port: int
    metadata: Optional[Dict[str, Any]] = None

class TaskEnqueueRequest(BaseModel):
    task_type: str
    payload: Dict[str, Any]
    priority: TaskPriority = TaskPriority.NORMAL
    timeout: int = 300
    max_retries: int = 3

class ResourceAllocationRequest(BaseModel):
    task_id: str
    cpu_cores: float = 0.0
    memory_gb: float = 0.0
    gpu_memory_gb: float = 0.0
    storage_gb: float = 0.0
    network_bandwidth_mbps: float = 0.0
    duration: float = 3600

class ScalingConfigRequest(BaseModel):
    min_instances: int = 2
    max_instances: int = 10
    target_cpu_usage: float = 70.0
    target_memory_usage: float = 80.0
    cooldown_period: int = 300

class CacheConfigRequest(BaseModel):
    local_cache_size: int = 1000
    redis_enabled: bool = True
    cache_ttl: int = 3600

class QueueConfigRequest(BaseModel):
    max_concurrent_tasks: int = 10
    default_timeout: int = 300
    max_retries: int = 3
    enable_rate_limiting: bool = True
    rate_limit_max: int = 100
    rate_limit_window: int = 60

class ResourceAllocationResponse(BaseModel):
    task_id: str
    node_id: str
    allocated_resources: Dict[str, float]
    allocated_at: float
    estimated_duration: float

class ClusterStatusResponse(BaseModel):
    total_instances: int
    healthy_instances: int
    unhealthy_instances: int
    average_cpu: float
    average_memory: float
    scaling_history: List[Dict[str, Any]]
    config: Dict[str, Any]

# Initialize scaling components
scaling_config = ScalingConfig()

@router.on_event("startup")
@router.on_event("startup")
async def startup_event():
    """Initialize scaling components on startup"""
    try:
        # Start the profiler
        profiler.start()
        
        # Start the cache manager
        cache_manager.start()
        
        # Start the queue processor
        queue_processor.start()
        
        # Start the resource allocator
        resource_allocator.start()
        
        # Add some initial instances to the scaler
        for i in range(2):
            instance = InstanceInfo(
                instance_id=f"initial_instance_{i}",
                host=f"server_{i}",
                port=8000 + i,
                status="healthy",
                started_at=time.time()
            )
            scaler.add_instance(instance)
        
        # Add some initial nodes to the resource allocator
        from utils.resource_allocation.smart_allocator import ResourceCapacity, ResourceNode
        
        # Add test nodes
        for i in range(2):
            capacity = ResourceCapacity(
                cpu_cores=4.0,
                memory_gb=8.0,
                gpu_memory_gb=2.0,
                storage_gb=50.0,
                network_bandwidth_mbps=500.0
            )
            
            node = ResourceNode(
                f"resource_node_{i}",
                capacity,
                "test_location"
            )
            resource_allocator.add_node(node)
        
        logger.info("All scaling components initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize scaling components: {e}")
        raise

@router.on_event("shutdown")
async def shutdown_event():
    """Clean up scaling components on shutdown"""
    try:
        # Stop the profiler
        profiler.stop()
        
        # Stop the cache manager
        cache_manager.stop()
        
        # Stop the queue processor
        queue_processor.stop()
        
        # Stop the resource allocator
        resource_allocator.stop()
        
        logger.info("All scaling components stopped successfully")
        
    except Exception as e:
        logger.error(f"Error during scaling component shutdown: {e}")

# Profiling endpoints
@router.get("/profiling/start", response_model=Dict[str, str])
async def start_profiling():
    """Start the advanced profiler"""
    try:
        profiler.start()
        return {"status": "started", "message": "Advanced profiler started successfully"}
    except Exception as e:
        logger.error(f"Failed to start profiler: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start profiler: {str(e)}")

@router.get("/profiling/summary", response_model=Dict[str, Any])
async def get_profiling_summary():
    """Get comprehensive performance summary"""
    try:
        summary = profiler.get_performance_summary()
        recommendations = profiler.get_optimization_recommendations()
        
        return {
            "status": summary.get("status", "ok"),
            "total_metrics": summary.get("total_metrics", 0),
            "time_range": summary.get("time_range", {}),
            "categories": summary.get("categories", {}),
            "system_stats": summary.get("system_stats", {}),
            "bottlenecks": summary.get("bottlenecks", []),
            "recommendations": recommendations
        }
    except Exception as e:
        logger.error(f"Failed to get profiling summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get profiling summary: {str(e)}")

# Horizontal scaling endpoints
@router.post("/instances", response_model=Dict[str, str])
async def create_instance(request: InstanceCreateRequest):
    """Create a new scaling instance"""
    try:
        instance = InstanceInfo(
            instance_id=request.instance_id,
            host=request.host,
            port=request.port,
            status="starting",
            started_at=time.time(),
            metadata=request.metadata or {}
        )
        
        scaler.add_instance(instance)
        
        # Simulate instance startup
        await asyncio.sleep(2)
        instance.status = "healthy"
        
        return {"status": "created", "instance_id": request.instance_id}
    except Exception as e:
        logger.error(f"Failed to create instance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create instance: {str(e)}")

@router.delete("/instances/{instance_id}", response_model=Dict[str, str])
async def remove_instance(instance_id: str):
    """Remove a scaling instance"""
    try:
        if instance_id not in scaler.auto_scaler.instances:
            raise HTTPException(status_code=404, detail=f"Instance {instance_id} not found")
        
        instance = scaler.auto_scaler.instances[instance_id]
        instance.status = "stopping"
        
        # Simulate graceful shutdown
        await asyncio.sleep(2)
        
        scaler.auto_scaler.remove_instance(instance_id)
        
        return {"status": "removed", "instance_id": instance_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to remove instance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to remove instance: {str(e)}")

@router.get("/cluster", response_model=ClusterStatusResponse)
async def get_cluster_status():
    """Get cluster status"""
    try:
        status = scaler.get_cluster_status()
        return ClusterStatusResponse(**status)
    except Exception as e:
        logger.error(f"Failed to get cluster status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get cluster status: {str(e)}")

@router.post("/scale-up", response_model=Dict[str, Any])
async def scale_up():
    """Scale up the cluster"""
    try:
        result = await scaler.auto_scaler.scale_up()
        return {"status": "scaling_up", "result": result}
    except Exception as e:
        logger.error(f"Failed to scale up: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to scale up: {str(e)}")

@router.post("/scale-down", response_model=Dict[str, Any])
async def scale_down():
    """Scale down the cluster"""
    try:
        result = await scaler.auto_scaler.scale_down()
        return {"status": "scaling_down", "result": result}
    except Exception as e:
        logger.error(f"Failed to scale down: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to scale down: {str(e)}")

@router.put("/config", response_model=Dict[str, str])
async def update_scaling_config(request: ScalingConfigRequest):
    """Update scaling configuration"""
    try:
        scaling_config.min_instances = request.min_instances
        scaling_config.max_instances = request.max_instances
        scaling_config.target_cpu_usage = request.target_cpu_usage
        scaling_config.target_memory_usage = request.target_memory_usage
        scaling_config.cooldown_period = request.cooldown_period
        
        scaler.auto_scaler.config = scaling_config
        
        return {"status": "updated", "message": "Scaling configuration updated successfully"}
    except Exception as e:
        logger.error(f"Failed to update scaling config: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update scaling config: {str(e)}")

# Caching endpoints
@router.get("/cache/stats", response_model=Dict[str, Any])
async def get_cache_stats():
    """Get cache statistics"""
    try:
        stats = await cache_manager.get_stats()
        return stats
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get cache stats: {str(e)}")

@router.post("/cache/{key}", response_model=Dict[str, str])
async def set_cache(key: str, ttl: int = 3600):
    """Set cache value (placeholder)"""
    try:
        # In a real implementation, this would take a value parameter
        await cache_manager.set(key, {"cached": True}, ttl)
        return {"status": "cached", "key": key}
    except Exception as e:
        logger.error(f"Failed to set cache: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to set cache: {str(e)}")

@router.get("/cache/{key}", response_model=Dict[str, Any])
async def get_cache(key: str):
    """Get cached value"""
    try:
        value = await cache_manager.get(key)
        return {"key": key, "value": value, "found": value is not None}
    except Exception as e:
        logger.error(f"Failed to get cache: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get cache: {str(e)}")

@router.delete("/cache/{key}", response_model=Dict[str, str])
async def delete_cache(key: str):
    """Delete cached value"""
    try:
        success = await cache_manager.delete(key)
        return {"status": "deleted" if success else "not_found", "key": key}
    except Exception as e:
        logger.error(f"Failed to delete cache: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete cache: {str(e)}")

@router.post("/cache/clear", response_model=Dict[str, str])
async def clear_cache():
    """Clear all cached values"""
    try:
        success = await cache_manager.clear()
        return {"status": "cleared" if success else "error", "message": "Cache cleared successfully"}
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")

# Queue processing endpoints
@router.post("/queue/tasks", response_model=Dict[str, str])
async def enqueue_task(request: TaskEnqueueRequest):
    """Enqueue a task"""
    try:
        task_id = await queue_processor.enqueue_task(
            task_type=request.task_type,
            payload=request.payload,
            priority=request.priority,
            timeout=request.timeout,
            max_retries=request.max_retries
        )
        return {"status": "enqueued", "task_id": task_id}
    except Exception as e:
        logger.error(f"Failed to enqueue task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to enqueue task: {str(e)}")

@router.get("/queue/tasks/{task_id}", response_model=Dict[str, Any])
async def get_task_info(task_id: str):
    """Get task information"""
    try:
        task_info = await queue_processor.get_task_info(task_id)
        if task_info is None:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        return task_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get task info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get task info: {str(e)}")

@router.get("/queue/stats", response_model=Dict[str, Any])
async def get_queue_stats():
    """Get queue statistics"""
    try:
        stats = queue_processor.get_queue_stats()
        return stats
    except Exception as e:
        logger.error(f"Failed to get queue stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get queue stats: {str(e)}")

@router.delete("/queue/tasks/{task_id}", response_model=Dict[str, str])
async def complete_task(task_id: str):
    """Mark task as completed"""
    try:
        await queue_processor.complete_task(task_id)
        return {"status": "completed", "task_id": task_id}
    except Exception as e:
        logger.error(f"Failed to complete task: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to complete task: {str(e)}")

# Resource allocation endpoints
@router.post("/resources/allocate", response_model=ResourceAllocationResponse)
async def allocate_resources(request: ResourceAllocationRequest):
    """Allocate resources for a task"""
    try:
        requirement = ResourceRequirement(
            cpu_cores=request.cpu_cores,
            memory_gb=request.memory_gb,
            gpu_memory_gb=request.gpu_memory_gb,
            storage_gb=request.storage_gb,
            network_bandwidth_mbps=request.network_bandwidth_mbps
        )
        
        node_id = await resource_allocator.allocate_resources(
            task_id=request.task_id,
            requirement=requirement,
            duration=request.duration
        )
        
        if node_id is None:
            raise HTTPException(status_code=400, detail="Failed to allocate resources")
        
        return ResourceAllocationResponse(
            task_id=request.task_id,
            node_id=node_id,
            allocated_resources=requirement.__dict__,
            allocated_at=time.time(),
            estimated_duration=request.duration
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to allocate resources: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to allocate resources: {str(e)}")

@router.post("/resources/release/{task_id}", response_model=Dict[str, str])
async def release_resources(task_id: str):
    """Release resources for a task"""
    try:
        success = await resource_allocator.release_resources(task_id)
        return {"status": "released" if success else "not_found", "task_id": task_id}
    except Exception as e:
        logger.error(f"Failed to release resources: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to release resources: {str(e)}")

@router.get("/resources/status", response_model=Dict[str, Any])
async def get_resource_status():
    """Get resource allocation status"""
    try:
        status = resource_allocator.get_system_status()
        return status
    except Exception as e:
        logger.error(f"Failed to get resource status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get resource status: {str(e)}")

@router.get("/health", response_model=Dict[str, Any])
async def get_scaling_health():
    """Get overall scaling system health"""
    try:
        return {
            "status": "healthy",
            "profiler_running": profiler.is_running,
            "cache_running": cache_manager.is_running,
            "queue_running": queue_processor.is_running,
            "resource_allocator_running": resource_allocator.is_running,
            "cluster_instances": len(scaler.auto_scaler.instances),
            "cache_stats": await cache_manager.get_stats(),
            "queue_stats": queue_processor.get_queue_stats(),
            "resource_status": resource_allocator.get_system_status()
        }
    except Exception as e:
        logger.error(f"Failed to get scaling health: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get scaling health: {str(e)}")