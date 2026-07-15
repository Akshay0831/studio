"""
Horizontal Scaling Architecture for Unified Editing Studio
Implements load balancing, auto-scaling, and distributed resource management.
"""
import asyncio
import time
import threading
import logging
import json
import random
import hashlib
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import psutil
import aiohttp
import aiohttp.web

logger = logging.getLogger("studio.backend.scaling")

@dataclass
class InstanceInfo:
    """Information about a service instance"""
    instance_id: str
    host: str
    port: int
    status: str  # "healthy", "unhealthy", "starting", "stopping"
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    load_average: float = 0.0
    request_count: int = 0
    last_heartbeat: float = 0.0
    started_at: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ScalingConfig:
    """Configuration for scaling policies"""
    min_instances: int = 2
    max_instances: int = 10
    target_cpu_usage: float = 70.0
    target_memory_usage: float = 80.0
    cooldown_period: int = 300  # seconds
    health_check_interval: int = 30  # seconds
    scale_up_threshold: int = 2
    scale_down_threshold: int = 1
    instance_type: str = "standard"
    resource_limits: Dict[str, Any] = field(default_factory=lambda: {
        "cpu_cores": 4,
        "memory_gb": 8,
        "storage_gb": 100
    })

class LoadBalancer:
    """Intelligent load balancer with multiple strategies"""
    
    def __init__(self, instances: List[InstanceInfo] = None):
        self.instances = instances or []
        self.current_strategy = "round_robin"
        self.strategy_index = 0
        self.strategies = ["round_robin", "least_loaded", "weighted_cpu", "response_time"]
        self.instance_weights = {}
        self.response_times = {}
        
    def add_instance(self, instance: InstanceInfo):
        """Add a new instance to the load balancer"""
        self.instances.append(instance)
        self.instance_weights[instance.instance_id] = 1.0  # Default weight
        
    def remove_instance(self, instance_id: str):
        """Remove an instance from the load balancer"""
        self.instances = [inst for inst in self.instances if inst.instance_id != instance_id]
        if instance_id in self.instance_weights:
            del self.instance_weights[instance_id]
        if instance_id in self.response_times:
            del self.response_times[instance_id]
    
    def select_instance(self) -> Optional[InstanceInfo]:
        """Select the best instance based on current strategy"""
        healthy_instances = [inst for inst in self.instances if inst.status == "healthy"]
        
        if not healthy_instances:
            return None
            
        if self.current_strategy == "round_robin":
            selected = healthy_instances[self.strategy_index % len(healthy_instances)]
            self.strategy_index += 1
            return selected
            
        elif self.current_strategy == "least_loaded":
            return min(healthy_instances, key=lambda x: x.cpu_usage + x.memory_usage)
            
        elif self.current_strategy == "weighted_cpu":
            return self._weighted_selection(healthy_instances, "cpu_usage")
            
        elif self.current_strategy == "response_time":
            return self._weighted_selection(healthy_instances, "response_time")
            
        return healthy_instances[0]
    
    def _weighted_selection(self, instances: List[InstanceInfo], metric: str) -> InstanceInfo:
        """Select instance using weighted algorithm"""
        weights = []
        for instance in instances:
            if metric == "response_time":
                weight = 1.0 / (self.response_times.get(instance.instance_id, 1.0) + 0.1)
            elif metric == "cpu_usage":
                weight = 1.0 / (instance.cpu_usage + 10.0)
            else:
                weight = 1.0
            weights.append(weight)
        
        total_weight = sum(weights)
        if total_weight == 0:
            return instances[0]
            
        rand_val = random.uniform(0, total_weight)
        current_weight = 0
        
        for i, weight in enumerate(weights):
            current_weight += weight
            if rand_val <= current_weight:
                return instances[i]
                
        return instances[-1]
    
    def update_response_time(self, instance_id: str, response_time: float):
        """Update response time for an instance"""
        self.response_times[instance_id] = response_time

class AutoScaler:
    """Automatic scaling service"""
    
    def __init__(self, config: ScalingConfig):
        self.config = config
        self.instances = {}
        self.load_balancer = LoadBalancer()
        self.scaling_history = []
        self.last_scaling_action = None
        self.is_scaling = False
        
    def add_instance(self, instance: InstanceInfo):
        """Add a new instance"""
        self.instances[instance.instance_id] = instance
        self.load_balancer.add_instance(instance)
        
    def remove_instance(self, instance_id: str):
        """Remove an instance"""
        if instance_id in self.instances:
            del self.instances[instance_id]
        self.load_balancer.remove_instance(instance_id)
        
    def update_instance_metrics(self, instance_id: str, metrics: Dict[str, Any]):
        """Update metrics for an instance"""
        if instance_id in self.instances:
            instance = self.instances[instance_id]
            instance.cpu_usage = metrics.get("cpu_usage", 0.0)
            instance.memory_usage = metrics.get("memory_usage", 0.0)
            instance.load_average = metrics.get("load_average", 0.0)
            instance.request_count = metrics.get("request_count", 0)
            instance.last_heartbeat = time.time()
            
    def should_scale_up(self) -> bool:
        """Determine if scaling up is needed"""
        if len(self.instances) >= self.config.max_instances:
            return False
            
        if self.last_scaling_action and time.time() - self.last_scaling_action < self.config.cooldown_period:
            return False
            
        if self.is_scaling:
            return False
            
        # Calculate average metrics
        if not self.instances:
            return True
            
        avg_cpu = sum(inst.cpu_usage for inst in self.instances.values()) / len(self.instances)
        avg_memory = sum(inst.memory_usage for inst in self.instances.values()) / len(self.instances)
        
        return (avg_cpu > self.config.target_cpu_usage or 
                avg_memory > self.config.target_memory_usage)
    
    def should_scale_down(self) -> bool:
        """Determine if scaling down is needed"""
        if len(self.instances) <= self.config.min_instances:
            return False
            
        if self.last_scaling_action and time.time() - self.last_scaling_action < self.config.cooldown_period:
            return False
            
        if self.is_scaling:
            return False
            
        # Calculate average metrics
        if not self.instances:
            return False
            
        avg_cpu = sum(inst.cpu_usage for inst in self.instances.values()) / len(self.instances)
        avg_memory = sum(inst.memory_usage for inst in self.instances.values()) / len(self.instances)
        
        return (avg_cpu < self.config.target_cpu_usage / 2 and 
                avg_memory < self.config.target_memory_usage / 2)
    
    async def scale_up(self) -> str:
        """Scale up by adding a new instance"""
        if self.is_scaling:
            return "already_scaling"
            
        self.is_scaling = True
        
        try:
            # Generate new instance ID
            instance_id = f"instance_{int(time.time())}_{random.randint(1000, 9999)}"
            
            # Create new instance (in real implementation, this would spin up a new container/vm)
            new_instance = InstanceInfo(
                instance_id=instance_id,
                host=f"server_{random.randint(1, 10)}",
                port=8000 + random.randint(1, 100),
                status="starting",
                started_at=time.time(),
                metadata={"type": self.config.instance_type}
            )
            
            # Add to instances
            self.add_instance(new_instance)
            
            # Simulate instance startup
            await asyncio.sleep(10)  # Simulate startup time
            new_instance.status = "healthy"
            
            # Record scaling action
            self.last_scaling_action = time.time()
            self.scaling_history.append({
                "action": "scale_up",
                "instance_id": instance_id,
                "timestamp": time.time(),
                "reason": "high_resource_usage"
            })
            
            logger.info(f"Scaled up: added instance {instance_id}")
            return instance_id
            
        except Exception as e:
            logger.error(f"Failed to scale up: {e}")
            return "error"
        finally:
            self.is_scaling = False
    
    async def scale_down(self) -> str:
        """Scale down by removing an instance"""
        if self.is_scaling:
            return "already_scaling"
            
        self.is_scaling = True
        
        try:
            # Find an instance to remove (prefer unhealthy or overloaded ones)
            instances_to_remove = [inst for inst in self.instances.values() 
                                 if inst.status != "healthy"]
            
            if not instances_to_remove:
                # Remove the least loaded healthy instance
                instances_to_remove = sorted(self.instances.values(), 
                                          key=lambda x: x.cpu_usage + x.memory_usage)
            
            if instances_to_remove:
                instance_to_remove = instances_to_remove[0]
                instance_to_remove.status = "stopping"
                
                # Simulate graceful shutdown
                await asyncio.sleep(5)
                
                # Remove instance
                self.remove_instance(instance_to_remove.instance_id)
                
                # Record scaling action
                self.last_scaling_action = time.time()
                self.scaling_history.append({
                    "action": "scale_down",
                    "instance_id": instance_to_remove.instance_id,
                    "timestamp": time.time(),
                    "reason": "low_resource_usage"
                })
                
                logger.info(f"Scaled down: removed instance {instance_to_remove.instance_id}")
                return instance_to_remove.instance_id
            else:
                return "no_instances_to_remove"
                
        except Exception as e:
            logger.error(f"Failed to scale down: {e}")
            return "error"
        finally:
            self.is_scaling = False
    
    async def auto_scale(self):
        """Main auto-scaling loop"""
        while True:
            try:
                if self.should_scale_up():
                    await self.scale_up()
                elif self.should_scale_down():
                    await self.scale_down()
                    
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Error in auto-scaling loop: {e}")
                await asyncio.sleep(120)

class HorizontalScaler:
    """Main horizontal scaling orchestrator"""
    
    def __init__(self, config: ScalingConfig = None):
        self.config = config or ScalingConfig()
        self.auto_scaler = AutoScaler(self.config)
        self.load_balancer = LoadBalancer()
        self.health_check_task = None
        self.scaling_task = None
        self.is_running = False
        
    def start(self):
        """Start the horizontal scaling service"""
        self.is_running = True
        
        # Start health check task
        self.health_check_task = asyncio.create_task(self._health_check_loop())
        
        # Start scaling task
        self.scaling_task = asyncio.create_task(self.auto_scaler.auto_scale())
        
        logger.info("Horizontal scaling service started")
        
    def stop(self):
        """Stop the horizontal scaling service"""
        self.is_running = False
        
        if self.health_check_task:
            self.health_check_task.cancel()
            
        if self.scaling_task:
            self.scaling_task.cancel()
            
        logger.info("Horizontal scaling service stopped")
        
    def add_instance(self, instance: InstanceInfo):
        """Add an instance to the scaling pool"""
        self.auto_scaler.add_instance(instance)
        self.load_balancer.add_instance(instance)
        
    def get_cluster_status(self) -> Dict[str, Any]:
        """Get current cluster status"""
        healthy_count = sum(1 for inst in self.auto_scaler.instances.values() 
                           if inst.status == "healthy")
        
        return {
            "total_instances": len(self.auto_scaler.instances),
            "healthy_instances": healthy_count,
            "unhealthy_instances": len(self.auto_scaler.instances) - healthy_count,
            "average_cpu": sum(inst.cpu_usage for inst in self.auto_scaler.instances.values()) / len(self.auto_scaler.instances) if self.auto_scaler.instances else 0,
            "average_memory": sum(inst.memory_usage for inst in self.auto_scaler.instances.values()) / len(self.auto_scaler.instances) if self.auto_scaler.instances else 0,
            "scaling_history": self.auto_scaler.scaling_history[-10:],  # Last 10 scaling events
            "config": self.config.__dict__
        }
    
    async def _health_check_loop(self):
        """Health check loop for all instances"""
        while self.is_running:
            try:
                for instance in list(self.auto_scaler.instances.values()):
                    await self._check_instance_health(instance)
                    
                await asyncio.sleep(self.config.health_check_interval)
                
            except Exception as e:
                logger.error(f"Error in health check loop: {e}")
                await asyncio.sleep(60)
    
    async def _check_instance_health(self, instance: InstanceInfo):
        """Check health of a specific instance"""
        current_time = time.time()
        
        # Check if instance is unresponsive
        if current_time - instance.last_heartbeat > self.config.health_check_interval * 3:
            instance.status = "unhealthy"
            logger.warning(f"Instance {instance.instance_id} is unresponsive")
            return
            
        # Check if instance is overloaded
        if instance.cpu_usage > 95 or instance.memory_usage > 95:
            instance.status = "unhealthy"
            logger.warning(f"Instance {instance.instance_id} is overloaded")
            return
            
        # Mark as healthy if it was unhealthy
        if instance.status == "unhealthy" and instance.cpu_usage < 80 and instance.memory_usage < 80:
            instance.status = "healthy"
            logger.info(f"Instance {instance.instance_id} recovered")
    
    def distribute_request(self, request_data: Dict[str, Any]) -> Optional[str]:
        """Distribute a request to the best instance"""
        selected_instance = self.load_balancer.select_instance()
        
        if selected_instance:
            # Update request count
            selected_instance.request_count += 1
            
            # Record response time (simulated)
            response_time = random.uniform(0.1, 0.5)
            self.load_balancer.update_response_time(selected_instance.instance_id, response_time)
            
            return selected_instance.instance_id
            
        return None

# Global scaler instance
scaler = HorizontalScaler()